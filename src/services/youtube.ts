import { Innertube, UniversalCache } from 'youtubei.js/react-native';
import { SearchResultItem, TrackInfo } from '../types';

let innertubeInstance: Innertube | null = null;
let initPromise: Promise<Innertube> | null = null;

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
      console.error('Failed to initialize Innertube client:', error);
      throw error;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Searches for songs and tracks on YouTube.
 * Returns up to 20 rich results with thumbnail, title, artist, and duration.
 */
export async function searchTracks(query: string): Promise<SearchResultItem[]> {
  if (!query || !query.trim()) return [];

  try {
    const yt = await getInnertube();
    const searchRes = await yt.search(query.trim(), { type: 'video' });

    const items: SearchResultItem[] = [];

    if (searchRes.videos && searchRes.videos.length > 0) {
      for (const v of searchRes.videos) {
        const vAny = v as any;
        if (!vAny || !vAny.id) continue;
        const artwork = vAny.thumbnails?.[vAny.thumbnails.length - 1]?.url || vAny.thumbnails?.[0]?.url || '';
        const title = vAny.title?.text || (typeof vAny.title === 'string' ? vAny.title : 'Unknown Track');
        const artist = vAny.author?.name || (typeof vAny.author === 'string' ? vAny.author : 'Unknown Artist');
        const durationText = vAny.duration?.text || '3:30';
        const durationSec = parseDurationToSeconds(durationText);

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

    return items;
  } catch (error) {
    console.warn('Search tracks error:', error);
    return [];
  }
}

export interface AudioStreamResult {
  url: string;
  headers?: Record<string, string>;
}

function getClientUserAgent(client: string): string {
  switch (client) {
    case 'ANDROID_MUSIC':
      return 'com.google.android.apps.youtube.music/7.27.52 (Linux; U; Android 14)';
    case 'ANDROID':
      return 'com.google.android.youtube/19.47.53 (Linux; U; Android 14)';
    case 'IOS':
      return 'com.google.ios.youtube/19.47.7 (iPhone16,2; U; CPU iOS 18_1_1)';
    case 'TV_EMBEDDED':
      return 'Mozilla/5.0 (CrKey armv7l 1.5.16041) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.0 Safari/537.36';
    default:
      return 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
  }
}

/**
 * Resolves direct high-quality playable audio stream URL using multi-client fallback.
 * Includes necessary User-Agent and Referer headers so Android does not get 403 Forbidden.
 */
export async function getTrackAudioStreamUrl(videoId: string): Promise<AudioStreamResult | null> {
  try {
    const yt = await getInnertube();
    const clients = ['ANDROID_MUSIC', 'IOS', 'ANDROID', 'TV_EMBEDDED'] as const;

    for (const client of clients) {
      try {
        const playerRes = await yt.actions.execute('/player', {
          videoId,
          client,
        });

        const status = playerRes.data?.playabilityStatus?.status;
        if (status && status !== 'OK') {
          continue;
        }

        const adaptiveFormats = playerRes.data?.streamingData?.adaptiveFormats || [];
        const audioFormats = adaptiveFormats
          .filter((f: any) => f.mimeType?.includes('audio/') && f.url)
          .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

        if (audioFormats.length > 0 && audioFormats[0].url) {
          return {
            url: audioFormats[0].url,
            headers: {
              'User-Agent': getClientUserAgent(client),
              Referer: 'https://music.youtube.com/',
              Origin: 'https://music.youtube.com',
            },
          };
        }

        const generalFormats = playerRes.data?.streamingData?.formats || [];
        const generalAudio = generalFormats.find((f: any) => f.url);
        if (generalAudio?.url) {
          return {
            url: generalAudio.url,
            headers: {
              'User-Agent': getClientUserAgent(client),
              Referer: 'https://music.youtube.com/',
              Origin: 'https://music.youtube.com',
            },
          };
        }
      } catch (clientErr) {
        // try next client
        continue;
      }
    }

    // Secondary fallback: Innertube's built-in getBasicInfo with decipher
    try {
      const info = await yt.getBasicInfo(videoId, { client: 'IOS' });
      const format = info.chooseFormat({ type: 'audio', quality: 'best' });
      if (format) {
        const url = format.decipher ? format.decipher(yt.session.player) : (format as any).url;
        if (url) {
          return {
            url,
            headers: {
              'User-Agent': getClientUserAgent('IOS'),
              Referer: 'https://music.youtube.com/',
            },
          };
        }
      }
    } catch (fallbackErr) {
      // ignore
    }

    return null;
  } catch (error) {
    console.error(`Failed to get audio stream for track ${videoId}:`, error);
    return null;
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
        const title = (item as any).title?.text || (item as any).title || 'Unknown';
        const artist = (item as any).author?.name || (item as any).short_byline_text?.text || 'Unknown Artist';
        const artwork = (item as any).thumbnails?.[0]?.url || '';
        const durationSec = parseDurationToSeconds((item as any).length_text?.text || '3:30');

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
    console.warn('Failed to fetch related tracks for autoplay:', error);
    return [];
  }
}

function parseDurationToSeconds(duration: string): number {
  if (!duration) return 180;
  const parts = duration.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 180;
}
