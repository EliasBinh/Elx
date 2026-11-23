import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * YouTube Visitor Session Manager (inspired by Liner Desktop)
 * Mints authentic visitorData directly from the client's residential IP
 * via https://www.youtube.com/sw.js_data and caches it for 5.5 hours.
 * 
 * Passing visitorData eliminates YouTube's "Sign in to confirm you're not a bot" (403/LOGIN_REQUIRED)
 * rate-limits and bot checks across mobile networks.
 */

const STORAGE_KEY = '@elx_visitor_session_v1';
const VISITOR_DATA_PATTERN = /Cg[s-v][A-Za-z0-9_-]{20,}(?:%3D|=){0,2}/;
const SESSION_TTL_MS = 5.5 * 60 * 60 * 1000; // 5.5 hours
const FETCH_TIMEOUT_MS = 6000;
const FAILURE_COOLDOWN_MS = 60000; // 1 min cooldown on failure

interface VisitorSession {
  visitorData: string;
  expiresAt: number;
}

let memorySession: VisitorSession | null = null;
let pendingFetch: Promise<string> | null = null;
let lastFailedAt = 0;

function parseVisitorData(text: string): string | null {
  try {
    const match = text.match(VISITOR_DATA_PATTERN);
    if (match && match[0]) {
      return match[0];
    }
  } catch {
    // fallback to regex match
  }
  return null;
}

export function resetClientVisitorData(): void {
  memorySession = null;
  lastFailedAt = 0;
  AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
}

export async function getClientVisitorData(): Promise<string> {
  const now = Date.now();

  // 1. Check in-memory session
  if (memorySession && memorySession.expiresAt > now) {
    return memorySession.visitorData;
  }

  // 2. Reuse pending in-flight fetch
  if (pendingFetch) {
    return pendingFetch;
  }

  // 3. Check persistent AsyncStorage
  if (!memorySession) {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: VisitorSession = JSON.parse(stored);
        if (parsed.expiresAt > now && parsed.visitorData) {
          memorySession = parsed;
          return parsed.visitorData;
        }
      }
    } catch {
      // ignore storage read error
    }
  }

  // 4. Rate-limit failure cooldown
  if (now - lastFailedAt < FAILURE_COOLDOWN_MS && memorySession?.visitorData) {
    return memorySession.visitorData;
  }

  // 5. Fetch fresh visitorData from sw.js_data
  pendingFetch = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch('https://www.youtube.com/sw.js_data', {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!res.ok) {
        throw new Error(`sw.js_data returned ${res.status}`);
      }

      const text = await res.text();
      const visitorData = parseVisitorData(text);

      if (!visitorData) {
        throw new Error('Could not parse visitorData from sw.js_data');
      }

      lastFailedAt = 0;
      const session: VisitorSession = {
        visitorData,
        expiresAt: Date.now() + SESSION_TTL_MS,
      };

      memorySession = session;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session)).catch(() => {});

      console.log(`[VisitorSession] Minted fresh visitor session: ${visitorData.substring(0, 16)}...`);
      return visitorData;
    } catch (err: any) {
      lastFailedAt = Date.now();
      console.warn('[VisitorSession] Failed to fetch fresh visitorData:', err?.message || err);

      // Gracefully use existing cached data even if expired
      if (memorySession?.visitorData) {
        return memorySession.visitorData;
      }
      return '';
    } finally {
      clearTimeout(timer);
      pendingFetch = null;
    }
  })();

  return pendingFetch;
}

/**
 * Eagerly warms up visitor session at app startup
 */
export function initVisitorSession(): void {
  getClientVisitorData().catch(() => {});
}

