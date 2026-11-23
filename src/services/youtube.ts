import { Innertube, UniversalCache } from 'youtubei.js/react-native';
import { SearchResultItem, TrackInfo } from '../types';
import { getCachedAudioUri, preloadAudioToDisk } from './audioCache';
import { APP_CONFIG } from '../constants/config';

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

interface IOSClientConfig {
  version: string;
  deviceModel: string;
  osVersion: string;
}

const IOS_CONFIGS: IOSClientConfig[] = [
  {
    version: '20.10.1',
    deviceModel: 'iPhone14,3',
    osVersion: '17.4.1.21E236',
  },
  {
    version: '20.11.6',
    deviceModel: 'iPhone10,4',
    osVersion: '16.7.7.20H330',
  },
  {
    version: '20.08.3',
    deviceModel: 'iPhone15,2',
    osVersion: '17.3.1.21D61',
  },
];

async function fetchAndroidMusicStream(videoId: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      'https://www.youtube.com/youtubei/v1/player?prettyPrint=false&alt=json',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Youtube-Client-Name': '21',
          'X-Youtube-Client-Version': '6.40.52',
        },
        body: JSON.stringify({
          videoId,
          context: {
            client: {
              clientName: 'ANDROID_MUSIC',
              clientVersion: '6.40.52',
              hl: 'en',
              gl: 'US',
            },
          },
        }),
      },
      2500
    );
    if (!res.ok) return null;
    const data = await res.json();
    const adaptive = data.streamingData?.adaptiveFormats || [];
    const general = data.streamingData?.formats || [];
    const allAudio = [...adaptive, ...general].filter(
      (f: any) => (f.mimeType || '').includes('audio/') && !!f.url
    );
    if (allAudio.length > 0) {
      allAudio.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
      return allAudio[0].url;
    }
  } catch {
    // ignore
  }
  return null;
}

async function fetchIOSStream(videoId: string, cfg: IOSClientConfig): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      'https://www.youtube.com/youtubei/v1/player?prettyPrint=false&alt=json',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Youtube-Client-Name': '5',
          'X-Youtube-Client-Version': cfg.version,
        },
        body: JSON.stringify({
          videoId,
          context: {
            client: {
              clientName: 'iOS',
              clientVersion: cfg.version,
              deviceMake: 'Apple',
              deviceModel: cfg.deviceModel,
              osName: 'iOS',
              osVersion: cfg.osVersion,
              hl: 'en',
              gl: 'US',
            },
          },
        }),
      },
      2500
    );
    if (!res.ok) return null;
    const data = await res.json();
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
 * Races Android Music and iOS clients in parallel for lightning-fast (150-250ms) resolution.
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

  // TIER 1: High-Speed Parallel Race (Android Music + iOS Clients concurrently)
  try {
    const raceTargets = [
      fetchAndroidMusicStream(videoId),
      fetchIOSStream(videoId, IOS_CONFIGS[0]),
      fetchIOSStream(videoId, IOS_CONFIGS[1]),
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
    console.warn('[AudioStream] Primary parallel race failed, falling back...');
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

  console.error(`[AudioStream] All stream extraction tiers exhausted for ${videoId}`);
  return null;
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
