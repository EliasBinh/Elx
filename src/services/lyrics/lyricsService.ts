import { APP_CONFIG } from '../../constants/config';
import { LyricsData } from '../../types';
import { parseLrc } from './lyricsParser';

/**
 * Fetches synced lyrics from LRCLIB.
 */
export async function fetchLyricsFromLrcLib(
  trackTitle: string,
  artistName: string,
  durationSeconds?: number
): Promise<LyricsData | null> {
  try {
    const cleanTitle = trackTitle.replace(/\s*\(.*?\)\s*/g, '').trim();
    const cleanArtist = artistName.split(',')[0].trim();

    const queryParams = new URLSearchParams({
      track_name: cleanTitle,
      artist_name: cleanArtist,
    });

    if (durationSeconds && durationSeconds > 0) {
      queryParams.append('duration', Math.round(durationSeconds).toString());
    }

    const res = await fetch(`${APP_CONFIG.LRCLIB_API_URL}/get?${queryParams.toString()}`, {
      headers: {
        'User-Agent': APP_CONFIG.USER_AGENT,
      },
    });

    if (!res.ok) {
      // Fallback search
      const searchRes = await fetch(
        `${APP_CONFIG.LRCLIB_API_URL}/search?q=${encodeURIComponent(`${cleanTitle} ${cleanArtist}`)}`,
        {
          headers: {
            'User-Agent': APP_CONFIG.USER_AGENT,
          },
        }
      );
      if (searchRes.ok) {
        const results = await searchRes.json();
        if (Array.isArray(results) && results.length > 0) {
          const first = results[0];
          if (first.syncedLyrics) {
            const parsed = parseLrc(first.syncedLyrics);
            return {
              trackId: '',
              synced: true,
              hasSyllables: parsed.hasSyllables,
              lines: parsed.lines,
              source: 'lrclib',
            };
          }
        }
      }
      return null;
    }

    const data = await res.json();
    if (data.syncedLyrics) {
      const parsed = parseLrc(data.syncedLyrics);
      return {
        trackId: '',
        synced: true,
        hasSyllables: parsed.hasSyllables,
        lines: parsed.lines,
        source: 'lrclib',
      };
    } else if (data.plainLyrics) {
      const plainLines = data.plainLyrics.split(/\r?\n/).map((line: string, idx: number) => ({
        id: `plain_${idx}`,
        startTimeMs: idx * 4000,
        endTimeMs: (idx + 1) * 4000,
        text: line.trim(),
      })).filter((l: any) => l.text.length > 0);

      return {
        trackId: '',
        synced: false,
        hasSyllables: false,
        lines: plainLines,
        source: 'lrclib',
      };
    }

    return null;
  } catch (error) {
    console.warn('LRCLIB fetch error:', error);
    return null;
  }
}

