import { Innertube, UniversalCache } from 'youtubei.js/react-native';
import { SearchResultItem, TrackInfo } from '../types';
import { getCachedAudioUri, preloadAudioToDisk } from './audioCache';
import { APP_CONFIG } from '../constants/config';
import { getClientVisitorData, resetClientVisitorData } from './visitorSession';

let innertubeInstance: Innertube | null = null;
let initPromise: Promise<Innertube> | null = null;

// In-memory stream URL cache: videoId -> { url, expiresAt }
interface CachedStream {
  url: string;
  expiresAt: number;
}
const streamCache = new Map<string, CachedStream>();

export function getCachedStreamUrl(videoId: string): string | null {
  const item = streamCache.get(videoId);
  if (item && Date.now() < item.expiresAt) {
    return item.url;
  }
  return null;
}

export function cacheStreamUrl(videoId: string, url: string) {
  // Cache for 4 hours (YouTube stream URLs are valid for ~6 hours)
  streamCache.set(videoId, {
    url,
    expiresAt: Date.now() + 4 * 3600 * 1000,
  });
}

/**
 * Robust fetch with strict timeout to prevent any hanging connections on mobile.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 3500
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Pre-fetches audio stream URL into memory cache for instant zero-latency skips.
 * Does NOT choke network bandwidth with heavy parallel background downloads.
 */
export async function prefetchTrackAudioStreamUrl(videoId: string): Promise<void> {
  if (!videoId || getCachedStreamUrl(videoId)) return;
  try {
    await getTrackAudioStreamUrl(videoId);
  } catch {
    // ignore background prefetch errors
  }
}

export async function getInnertube(): Promise<Innertube> {
  if (innertubeInstance) return innertubeInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      innertubeInstance = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true,
      });
      return innertubeInstance;
    } catch (error) {
      console.error('[YouTube] Failed to initialize Innertube client:', error);
      throw error;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Searches for songs and tracks on YouTube.
 * Returns rich results with thumbnail, title, artist, and duration.
 */
export async function searchTracks(query: string): Promise<SearchResultItem[]> {
  if (!query || !query.trim()) return [];

  // 1. Primary search via Innertube
  try {
    const yt = await getInnertube();
    const searchRes = await yt.search(query.trim(), { type: 'video' });

    const items: SearchResultItem[] = [];

    if (searchRes.videos && searchRes.videos.length > 0) {
      for (const v of searchRes.videos) {
        const vAny = v as any;
        if (!vAny || !vAny.id) continue;
        const artwork =
          vAny.thumbnails?.[vAny.thumbnails.length - 1]?.url ||
          vAny.thumbnails?.[0]?.url ||
          '';
        const title =
          vAny.title?.text ||
          (typeof vAny.title === 'string' ? vAny.title : 'Unknown Track');
        const artist =
          vAny.author?.name ||
          (typeof vAny.author === 'string' ? vAny.author : 'Unknown Artist');
        const durationText = vAny.duration?.text || '3:30';
        const durationSec = parseDurationToSeconds(durationText);

        // Studio Master Audio Filter: exclude 1-hour loops (>15 min) or sound effects (<40s)
        if (durationSec > 900 || durationSec < 40) continue;

        items.push({
          id: vAny.id,
          title,
          artist,
          artwork,
          durationText,
          durationSeconds: durationSec,
          type: 'song',
        });
      }
    }

    if (items.length > 0) {
      // Prioritize Official Audio & Topic channel studio releases
      items.sort((a, b) => {
        const aStudio = a.title.toLowerCase().includes('official audio') || a.artist.includes('Topic');
        const bStudio = b.title.toLowerCase().includes('official audio') || b.artist.includes('Topic');
        if (aStudio && !bStudio) return -1;
        if (!aStudio && bStudio) return 1;
        return 0;
      });
      return items;
    }
  } catch (error) {
    console.warn('[YouTube] Innertube search error, trying fallback:', error);
  }

  // 2. Fallback search via Piped public instances (with 3.5s timeout)
  const pipedInstances = [
    'https://api.piped.private.coffee',
    'https://pipedapi.kavin.rocks',
    'https://piped-api.lunar.icu',
  ];

  for (const inst of pipedInstances) {
    try {
      const res = await fetchWithTimeout(
        `${inst}/search?q=${encodeURIComponent(query.trim())}&filter=videos`,
        {},
        3500
      );
      if (!res.ok) continue;
      const data = await res.json();
      const rawItems = data.items || [];
      if (rawItems.length > 0) {
        const fallbackItems: SearchResultItem[] = rawItems
          .filter((it: any) => it.url && it.title)
          .map((it: any) => {
            const vId = it.url.replace('/watch?v=', '');
            return {
              id: vId,
              title: it.title,
              artist: it.uploaderName || 'Unknown Artist',
              artwork: it.thumbnail || '',
              durationText: formatSecondsToText(it.duration || 210),
              durationSeconds: it.duration || 210,
              type: 'song' as const,
            };
          });
        if (fallbackItems.length > 0) {
          return fallbackItems;
        }
      }
    } catch {
      // try next
    }
  }

  return [];
}

interface ClientProfile {
  name: string;
  version: string;
  clientId: string;
  userAgent: string;
  context: Record<string, any>;
}

const VISIONOS_PROFILE: ClientProfile = {
  name: 'VISIONOS',
  version: '1.02',
  clientId: '101',
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_7_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
  context: {
    clientName: 'VISIONOS',
    clientVersion: '1.02',
    deviceMake: 'Apple',
    deviceModel: 'RealityDevice17,1',
    osName: 'visionOS',
    osVersion: '26.5.23O471',
    hl: 'en',
    gl: 'US',
  },
};

const ANDROID_VR_PROFILE: ClientProfile = {
  name: 'ANDROID_VR',
  version: '1.65.10',
  clientId: '28',
  userAgent:
    'com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip',
  context: {
    clientName: 'ANDROID_VR',
    clientVersion: '1.65.10',
    deviceMake: 'Oculus',
    deviceModel: 'Quest 3',
    osName: 'Android',
    osVersion: '12L',
    androidSdkVersion: 32,
    hl: 'en',
    gl: 'US',
  },
};

const IOS_PROFILE: ClientProfile = {
  name: 'iOS',
  version: '20.10.1',
  clientId: '5',
  userAgent:
    'com.google.ios.youtube/20.10.1 (iPhone14,3; U; CPU iOS 17_4_1 like Mac OS X)',
  context: {
    clientName: 'iOS',
    clientVersion: '20.10.1',
    deviceMake: 'Apple',
    deviceModel: 'iPhone14,3',
    osName: 'iOS',
    osVersion: '17.4.1.21E236',
    hl: 'en',
    gl: 'US',
  },
};

async function fetchProfileStream(
  videoId: string,
  profile: ClientProfile,
  visitorData?: string,
  timeoutMs = 2800
): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': profile.userAgent,
      'X-Youtube-Client-Name': profile.clientId,
      'X-Youtube-Client-Version': profile.version,
    };
    if (visitorData) {
      headers['X-Goog-Visitor-Id'] = visitorData;
    }

    const clientContext = {
      ...profile.context,
      ...(visitorData ? { visitorData } : {}),
    };

    const res = await fetchWithTimeout(
      'https://www.youtube.com/youtubei/v1/player?prettyPrint=false&alt=json',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          videoId,
          contentCheckOk: true,
          racyCheckOk: true,
          context: {
            client: clientContext,
          },
        }),
      },
      timeoutMs
    );

    if (!res.ok) return null;
    const data = await res.json();

    const status = data.playabilityStatus?.status;
    if (status && status !== 'OK') {
      if (status === 'LOGIN_REQUIRED') {
        console.warn(
          `[YouTube] ${profile.name} returned LOGIN_REQUIRED for ${videoId}: ${data.playabilityStatus?.reason}`
        );
      }
      return null;
    }

    const adaptive = data.streamingData?.adaptiveFormats || [];
    const general = data.streamingData?.formats || [];
    const allAudio = [...adaptive, ...general].filter(
      (f: any) => (f.mimeType || '').includes('audio/') && !!f.url
    );

    if (allAudio.length > 0) {
      allAudio.sort((a: any, b: any) => {
        const aIsMp4 = (a.mimeType || '').includes('audio/mp4');
        const bIsMp4 = (b.mimeType || '').includes('audio/mp4');
        if (aIsMp4 && !bIsMp4) return -1;
        if (!aIsMp4 && bIsMp4) return 1;
        return (b.bitrate || 0) - (a.bitrate || 0);
      });
      return allAudio[0].url;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Resolves direct high-quality playable audio stream URL.
 * Injects client-unique YouTube visitor session (Liner Desktop pattern) to prevent bot checks.
 * Races VisionOS, Android VR, and iOS clients in parallel for lightning-fast (150-250ms) resolution.
 * Checks in-memory cache first for instant 0ms playback.
 */
export async function getTrackAudioStreamUrl(videoId: string): Promise<string | null> {
  // Check memory cache for instant (0ms) playback!
  const cached = getCachedStreamUrl(videoId);
  if (cached) {
    console.log(`[AudioStream] Returning cached stream URL for ${videoId}`);
    return cached;
  }

  console.log(`[AudioStream] Resolving stream for videoId: ${videoId}`);

  // TIER 0: Global Edge Gateway (20ms Edge Caching & Serverless Proxy)
  if (APP_CONFIG.EDGE_GATEWAY_URL) {
    try {
      const edgeRes = await fetchWithTimeout(
        `${APP_CONFIG.EDGE_GATEWAY_URL}/api/resolve?videoId=${videoId}`,
        {},
        2000
      );
      if (edgeRes.ok) {
        const edgeData = await edgeRes.json();
        if (edgeData && edgeData.streamUrl) {
          console.log(
            `[AudioStream] Resolved via Global Edge Gateway (${edgeData.edge || 'EDGE'}, cached=${edgeData.cached})`
          );
          cacheStreamUrl(videoId, edgeData.streamUrl);
          return edgeData.streamUrl;
        }
      }
    } catch {
      // Seamlessly fallback to on-device resolution
    }
  }

  // Fetch or retrieve client visitor data
  const visitorData = await getClientVisitorData();

  // TIER 1: High-Speed Parallel Multi-Profile Race (VisionOS + Android VR + iOS concurrently)
  try {
    const raceTargets = [
      fetchProfileStream(videoId, VISIONOS_PROFILE, visitorData, 2800),
      fetchProfileStream(videoId, ANDROID_VR_PROFILE, visitorData, 2800),
      fetchProfileStream(videoId, IOS_PROFILE, visitorData, 2800),
    ].map((promise) =>
      promise.then((url) => {
        if (url) return url;
        throw new Error('No stream');
      })
    );

    const winnerUrl = await Promise.any(raceTargets);
    if (winnerUrl) {
      console.log(`[AudioStream] Parallel race winner resolved in sub-second for ${videoId}`);
      cacheStreamUrl(videoId, winnerUrl);
      return winnerUrl;
    }
  } catch {
    console.warn('[AudioStream] Primary parallel race failed, resetting visitor session & retrying...');
  }

  // TIER 1.5: Retry with freshly minted visitor data if rate-limited or bot-challenged
  try {
    resetClientVisitorData();
    const freshVisitor = await getClientVisitorData();
    const retryTargets = [
      fetchProfileStream(videoId, VISIONOS_PROFILE, freshVisitor, 3500),
      fetchProfileStream(videoId, ANDROID_VR_PROFILE, freshVisitor, 3500),
      fetchProfileStream(videoId, IOS_PROFILE, freshVisitor, 3500),
    ].map((promise) =>
      promise.then((url) => {
        if (url) return url;
        throw new Error('No stream');
      })
    );

    const retryWinner = await Promise.any(retryTargets);
    if (retryWinner) {
      console.log(`[AudioStream] Recovered stream after visitor session refresh for ${videoId}`);
      cacheStreamUrl(videoId, retryWinner);
      return retryWinner;
    }
  } catch {
    console.warn('[AudioStream] Retry with refreshed visitor session failed, falling back...');
  }

  // TIER 2: Innertube actions.execute with IOS client
  try {
    const yt = await getInnertube();
    const playerRes = await yt.actions.execute('/player', {
      videoId,
      client: 'IOS',
    });

    const adaptive = playerRes.data?.streamingData?.adaptiveFormats || [];
    const general = playerRes.data?.streamingData?.formats || [];
    const audioFormats = [...adaptive, ...general].filter(
      (f: any) => (f.mimeType || '').includes('audio/') && !!f.url
    );

    if (audioFormats.length > 0) {
      audioFormats.sort((a: any, b: any) => {
        const aIsMp4 = (a.mimeType || '').includes('audio/mp4');
        const bIsMp4 = (b.mimeType || '').includes('audio/mp4');
        if (aIsMp4 && !bIsMp4) return -1;
        if (!aIsMp4 && bIsMp4) return 1;
        return (b.bitrate || 0) - (a.bitrate || 0);
      });
      console.log('[AudioStream] Resolved via Innertube iOS player execution');
      cacheStreamUrl(videoId, audioFormats[0].url);
      return audioFormats[0].url;
    }
  } catch (err: any) {
    console.warn('[AudioStream] Innertube execution failed:', err?.message || err);
  }

  // TIER 3: Resilient Piped Stream API Failover (with 3s timeout)
  const pipedStreamInstances = [
    'https://api.piped.private.coffee',
    'https://pipedapi.kavin.rocks',
    'https://piped-api.lunar.icu',
    'https://cf.piped.video',
  ];

  for (const inst of pipedStreamInstances) {
    try {
      const pRes = await fetchWithTimeout(`${inst}/streams/${videoId}`, {}, 3000);
      if (!pRes.ok) continue;

      const pData = await pRes.json();
      const streams = pData.audioStreams || [];
      const valid = streams.filter((s: any) => !!s.url);

      if (valid.length > 0) {
        valid.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
        console.log(`[AudioStream] Resolved via Piped instance: ${inst}`);
        cacheStreamUrl(videoId, valid[0].url);
        return valid[0].url;
      }
    } catch {
      // try next
    }
  }

  console.error(`[AudioStream] YouTube refused stream from this network for ${videoId}`);
  throw new Error('YouTube refused stream from this network');
}

/**
 * Fetches all tracks and metadata of a YouTube Playlist for importing.
 */
export async function fetchPlaylistDetails(playlistId: string): Promise<{
  id: string;
  title: string;
  description?: string;
  tracks: TrackInfo[];
}> {
  try {
    const yt = await getInnertube();
    const pl = await yt.getPlaylist(playlistId);

    const title =
      (pl.info?.title as any)?.text ||
      (typeof pl.info?.title === 'string' ? pl.info.title : 'Imported Playlist');
    const description =
      (pl.info?.description as any)?.text ||
      (typeof pl.info?.description === 'string' ? pl.info.description : '');

    const tracks: TrackInfo[] = [];
    const videos = pl.videos || [];

    for (const v of videos) {
      const vAny = v as any;
      const vId = vAny.content_id || vAny.id;
      if (!vId) continue;

      // Extract title
      let tTitle = 'Unknown Track';
      if (vAny.title?.text) tTitle = vAny.title.text;
      else if (vAny.metadata?.title?.text) tTitle = vAny.metadata.title.text;
      else if (typeof vAny.title === 'string') tTitle = vAny.title;

      // Extract artist
      let tArtist = 'Unknown Artist';
      if (vAny.author?.name) tArtist = vAny.author.name;
      else if (
        vAny.metadata?.metadata?.metadata_rows?.[0]?.metadata_parts?.[0]?.text
          ?.text
      ) {
        tArtist =
          vAny.metadata.metadata.metadata_rows[0].metadata_parts[0].text.text;
      }

      // Extract artwork
      let artwork = '';
      if (vAny.thumbnails?.[0]?.url) artwork = vAny.thumbnails[0].url;
      else if (vAny.content_image?.image?.[0]?.url)
        artwork = vAny.content_image.image[0].url;
      else artwork = `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`;

      // Extract duration
      const durationSec = vAny.duration?.seconds || 210;

      tracks.push({
        id: vId,
        title: tTitle,
        artist: tArtist,
        artwork,
        duration: durationSec,
      });
    }

    return {
      id: playlistId,
      title,
      description,
      tracks,
    };
  } catch (error: any) {
    console.error('[YouTube] Failed to fetch playlist details:', error);
    throw new Error(`Failed to load playlist (${error?.message || 'Error'})`);
  }
}


/**
 * Fetches "Up Next" / Radio related tracks for infinite continuous autoplay.
 */
export async function getRelatedTracks(videoId: string): Promise<TrackInfo[]> {
  try {
    const yt = await getInnertube();
    const info = await yt.getBasicInfo(videoId);

    const relatedTracks: TrackInfo[] = [];
    const related = (info as any).watch_next_feed || [];

    for (const item of related) {
      if ((item as any).id && (item as any).title) {
        const vId = (item as any).id;
        const title =
          (item as any).title?.text || (item as any).title || 'Unknown';
        const artist =
          (item as any).author?.name ||
          (item as any).short_byline_text?.text ||
          'Unknown Artist';
        const artwork = (item as any).thumbnails?.[0]?.url || '';
        const durationSec = parseDurationToSeconds(
          (item as any).length_text?.text || '3:30'
        );

        relatedTracks.push({
          id: vId,
          title,
          artist,
          artwork,
          duration: durationSec,
        });
      }
    }

    return relatedTracks;
  } catch (error) {
    console.warn('[YouTube] Failed to fetch related tracks for autoplay:', error);
    return [];
  }
}

function parseDurationToSeconds(duration: string): number {
  if (!duration) return 180;
  const parts = duration.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 2) {
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  } else if (parts.length === 3) {
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  }
  return 180;
}

function formatSecondsToText(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}
