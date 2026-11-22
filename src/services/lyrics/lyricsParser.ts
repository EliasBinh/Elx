import { LyricLine, Syllable } from '../../types';

/**
 * Parses timestamp string [mm:ss.xx] or [mm:ss:xx] or [mm:ss.xxx] into milliseconds.
 */
export function parseTimestampMs(timeStr: string): number | null {
  const clean = timeStr.trim().replace(/^\[|\]$/g, '').replace(/^<|>$/g, '');
  const parts = clean.split(':');
  if (parts.length < 2) return null;

  const minutes = parseFloat(parts[0]);
  const seconds = parseFloat(parts[1]);
  if (isNaN(minutes) || isNaN(seconds)) return null;

  return Math.round((minutes * 60 + seconds) * 1000);
}

/**
 * Parses enhanced syllable/word-level LRC lines, e.g.:
 * "[01:23.45] <01:23.45> Hello <01:23.80> World <01:24.20>"
 * or standard LRC lines:
 * "[01:23.45] Hello World"
 */
export function parseLrc(lrcText: string): { lines: LyricLine[]; hasSyllables: boolean } {
  if (!lrcText || typeof lrcText !== 'string') {
    return { lines: [], hasSyllables: false };
  }

  const rawLines = lrcText.split(/\r?\n/);
  const parsedLines: LyricLine[] = [];
  let foundSyllables = false;

  const timeTagRegex = /\[(\d{1,2}:\d{2}(?:\.\d{1,3})?)\]/g;
  const syllableTagRegex = /<(\d{1,2}:\d{2}(?:\.\d{1,3})?)>([^<]*)/g;

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i].trim();
    if (!rawLine) continue;

    // Check for metadata tags like [ti:], [ar:], [al:]
    if (/^\[[a-zA-Z]+:.*\]$/.test(rawLine)) {
      continue;
    }

    const matches = [...rawLine.matchAll(timeTagRegex)];
    if (matches.length === 0) continue;

    // Line text after time tags
    const lineText = rawLine.replace(timeTagRegex, '').trim();
    if (!lineText) continue;

    for (const match of matches) {
      const timeMs = parseTimestampMs(match[1]);
      if (timeMs === null) continue;

      const syllables: Syllable[] = [];
      const sylMatches = [...lineText.matchAll(syllableTagRegex)];

      if (sylMatches.length > 0) {
        foundSyllables = true;
        for (let j = 0; j < sylMatches.length; j++) {
          const sMatch = sylMatches[j];
          const sTimeMs = parseTimestampMs(sMatch[1]);
          const sText = sMatch[2];

          if (sTimeMs !== null) {
            // Next syllable time or approximate end
            let nextTimeMs = sTimeMs + 500;
            if (j + 1 < sylMatches.length) {
              const nextSylTime = parseTimestampMs(sylMatches[j + 1][1]);
              if (nextSylTime !== null && nextSylTime > sTimeMs) {
                nextTimeMs = nextSylTime;
              }
            }
            syllables.push({
              text: sText,
              startTimeMs: sTimeMs,
              endTimeMs: nextTimeMs,
            });
          }
        }
      }

      // Plain clean text without inline tags
      const cleanText = lineText.replace(/<[^>]+>/g, '').trim();

      parsedLines.push({
        id: `lyric_${parsedLines.length}_${timeMs}`,
        startTimeMs: timeMs,
        endTimeMs: timeMs + 4000, // will be adjusted in second pass
        text: cleanText,
        syllables: syllables.length > 0 ? syllables : undefined,
      });
    }
  }

  // Sort chronologically
  parsedLines.sort((a, b) => a.startTimeMs - b.startTimeMs);

  // Second pass: Adjust endTimeMs to match the next line's startTimeMs
  for (let i = 0; i < parsedLines.length; i++) {
    if (i + 1 < parsedLines.length) {
      const nextStart = parsedLines[i + 1].startTimeMs;
      // Cap at next line start or max 8 seconds
      parsedLines[i].endTimeMs = Math.min(nextStart, parsedLines[i].startTimeMs + 8000);
      
      // If syllables exist, ensure last syllable ends at line endTimeMs
      const syls = parsedLines[i].syllables;
      if (syls && syls.length > 0) {
        syls[syls.length - 1].endTimeMs = parsedLines[i].endTimeMs;
      }
    }
  }

  return {
    lines: parsedLines,
    hasSyllables: foundSyllables,
  };
}

/**
 * Parses simple TTML or Musixmatch RichSync JSON if received.
 */
export function parseRichSync(jsonData: any): LyricLine[] {
  if (!jsonData || !Array.isArray(jsonData)) return [];

  return jsonData.map((item, index) => {
    const startTimeMs = Math.round((item.ts || 0) * 1000);
    const endTimeMs = Math.round((item.te || (item.ts + 4)) * 1000);
    
    let syllables: Syllable[] | undefined;
    if (Array.isArray(item.l)) {
      syllables = item.l.map((w: any) => ({
        text: w.c || '',
        startTimeMs: Math.round(((w.ts || item.ts)) * 1000),
        endTimeMs: Math.round(((w.te || w.ts + 0.3)) * 1000),
      }));
    }

    return {
      id: `rich_${index}`,
      startTimeMs,
      endTimeMs,
      text: item.x || '',
      syllables,
    };
  });
}
