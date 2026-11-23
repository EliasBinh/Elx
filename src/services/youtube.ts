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
 * Returns rich results with thumbnail, title, artist, and duration.
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

/**
 * Resolves direct high-quality playable audio stream URL.
 * Uses the iOS player client which provides unthrottled, unencrypted direct HTTPS audio streams (audio/mp4).
 */
export async function getTrackAudioStreamUrl(videoId: string): Promise<string | null> {
  try {
    const yt = await getInnertube();

    // 1. Primary: execute player action with iOS client
    try {
      const playerRes = await yt.actions.execute('/player', {
        videoId,
        client: 'IOS',
      });

      const adaptiveFormats = playerRes.data?.streamingData?.adaptiveFormats || [];
      const audioFormats = adaptiveFormats
        .filter((f: any) => f.mimeType?.includes('audio/') && f.url)
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

      if (audioFormats.length > 0 && audioFormats[0].url) {
        return audioFormats[0].url;
      }

      const generalFormats = playerRes.data?.streamingData?.formats || [];
      const generalAudio = generalFormats.find((f: any) => f.url);
      if (generalAudio?.url) {
        return generalAudio.url;
      }
    } catch (iosErr) {
      console.warn('IOS client player extraction failed:', iosErr);
    }

    // 2. Secondary fallback: yt.getInfo with format decipher
    try {
      const info = await yt.getInfo(videoId);
      const format = info.chooseFormat({ type: 'audio', quality: 'best' });
      if (format) {
        const url = format.decipher ? format.decipher(yt.session.player) : (format as any).url;
        if (url) return url;
      }
    } catch (fallbackErr) {
      console.warn('getInfo fallback failed:', fallbackErr);
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
