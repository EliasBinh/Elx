import { Innertube, UniversalCache } from 'youtubei.js';
import { SearchResultItem, TrackInfo } from '../types';

let innertubeInstance: Innertube | null = null;
let initPromise: Promise<Innertube> | null = null;

/**
 * Returns a cached singleton Innertube client instance.
 */
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
 * Searches YouTube Music for tracks, artists, and albums.
 */
export async function searchTracks(query: string): Promise<SearchResultItem[]> {
  if (!query || !query.trim()) return [];

  try {
    const yt = await getInnertube();
    // Search YouTube Music
    const searchResult = await yt.music.search(query.trim());

    const items: SearchResultItem[] = [];

    // Process songs and videos
    if (searchResult.songs && searchResult.songs.contents) {
      for (const item of searchResult.songs.contents) {
        if (!item || !item.id) continue;
        const artwork = item.thumbnails?.[item.thumbnails.length - 1]?.url || '';
        const durationSec = parseDurationToSeconds(item.duration?.text || '0:00');

        items.push({
          id: item.id,
          title: item.title || 'Unknown Track',
          artist: item.artists?.[0]?.name || item.author?.name || 'Unknown Artist',
          album: item.album?.name,
          artwork,
          durationText: item.duration?.text || '3:00',
          durationSeconds: durationSec,
          type: 'song',
        });
      }
    }

    // Process videos if songs are sparse
    if (items.length < 5 && searchResult.videos && searchResult.videos.contents) {
      for (const item of searchResult.videos.contents) {
        if (!item || !item.id) continue;
        const artwork = item.thumbnails?.[item.thumbnails.length - 1]?.url || '';
        const durationSec = parseDurationToSeconds(item.duration?.text || '0:00');

        items.push({
          id: item.id,
          title: item.title || 'Unknown Video',
          artist: item.author?.name || 'Unknown Artist',
          artwork,
          durationText: item.duration?.text || '3:00',
          durationSeconds: durationSec,
          type: 'video',
        });
      }
    }

    return items;
  } catch (error) {
    console.warn('YouTube search error:', error);
    return [];
  }
}

/**
 * Resolves direct high-quality playable audio stream URL for a given track videoId.
 */
export async function getTrackAudioStreamUrl(videoId: string): Promise<string | null> {
  try {
    const yt = await getInnertube();
    const info = await yt.getInfo(videoId);

    // Pick best audio format
    const format = info.chooseFormat({
      type: 'audio',
      quality: 'best',
    });

    if (format && format.decipher) {
      const url = await format.decipher(yt.session.player);
      if (url) return url;
    }

    if (format && format.url) {
      return format.url;
    }

    // Fallback: search adaptive formats for audio/mp4 or audio/webm
    const streamingData = info.streaming_data;
    if (streamingData?.adaptive_formats) {
      const audioFormats = streamingData.adaptive_formats
        .filter((f) => f.mime_type?.startsWith('audio/'))
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

      if (audioFormats.length > 0) {
        const best = audioFormats[0];
        if (best.url) return best.url;
      }
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
    const info = await yt.getInfo(videoId);

    const relatedTracks: TrackInfo[] = [];
    const related = info.watch_next_feed || [];

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

/**
 * Helper to convert duration string (mm:ss or hh:mm:ss) into seconds.
 */
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
