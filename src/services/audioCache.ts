import * as FileSystem from 'expo-file-system';

const CACHE_FOLDER = `${FileSystem.cacheDirectory}audio_cache/`;
const MAX_CACHE_BYTES = 400 * 1024 * 1024; // 400 MB cap

// Tracks currently being downloaded to prevent redundant parallel downloads
const activeDownloads = new Map<string, Promise<string | null>>();

async function ensureCacheDirExists(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_FOLDER);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_FOLDER, { intermediates: true });
  }
}

/**
 * Returns the local file path for a cached audio file.
 */
export function getLocalAudioFilePath(videoId: string): string {
  return `${CACHE_FOLDER}${videoId}.m4a`;
}

/**
 * Checks if a track's audio file is already fully cached on local disk.
 */
export async function getCachedAudioUri(videoId: string): Promise<string | null> {
  try {
    const filePath = getLocalAudioFilePath(videoId);
    const info = await FileSystem.getInfoAsync(filePath);
    if (info.exists && info.size && info.size > 200 * 1024) {
      // File is cached and has valid size (>200KB)
      return filePath;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Predictively downloads a track's audio file to local disk in the background.
 * Returns the local file URI if successful.
 */
export async function preloadAudioToDisk(
  videoId: string,
  streamUrl: string
): Promise<string | null> {
  if (!videoId || !streamUrl) return null;

  // If already cached on disk, return immediately
  const existing = await getCachedAudioUri(videoId);
  if (existing) return existing;

  // If download is already in progress, await the existing promise
  if (activeDownloads.has(videoId)) {
    return activeDownloads.get(videoId)!;
  }

  const downloadPromise = (async () => {
    try {
      await ensureCacheDirExists();
      const targetPath = getLocalAudioFilePath(videoId);
      const tempPath = `${targetPath}.tmp`;

      console.log(`[AudioCache] Pre-buffering track ${videoId} to local disk...`);
      const result = await FileSystem.downloadAsync(streamUrl, tempPath);

      if (result.status === 200) {
        await FileSystem.moveAsync({
          from: tempPath,
          to: targetPath,
        });
        console.log(`[AudioCache] Successfully cached ${videoId} to disk (${result.uri})`);
        
        // Asynchronously check cache size and evict LRU if needed
        pruneCacheIfNeeded().catch(() => {});
        return targetPath;
      } else {
        // Clean up partial temp file
        FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => {});
        return null;
      }
    } catch (err: any) {
      console.warn(`[AudioCache] Failed to preload ${videoId}:`, err?.message || err);
      return null;
    } finally {
      activeDownloads.delete(videoId);
    }
  })();

  activeDownloads.set(videoId, downloadPromise);
  return downloadPromise;
}

/**
 * Prunes oldest cached audio files when total size exceeds MAX_CACHE_BYTES.
 */
async function pruneCacheIfNeeded(): Promise<void> {
  try {
    await ensureCacheDirExists();
    const files = await FileSystem.readDirectoryAsync(CACHE_FOLDER);
    if (files.length === 0) return;

    let totalSize = 0;
    const fileStats: { name: string; uri: string; size: number; modificationTime: number }[] = [];

    for (const name of files) {
      if (name.endsWith('.tmp')) {
        // Delete stale temp files
        FileSystem.deleteAsync(`${CACHE_FOLDER}${name}`, { idempotent: true }).catch(() => {});
        continue;
      }
      const uri = `${CACHE_FOLDER}${name}`;
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        const size = info.size || 0;
        totalSize += size;
        fileStats.push({
          name,
          uri,
          size,
          modificationTime: info.modificationTime || 0,
        });
      }
    }

    if (totalSize > MAX_CACHE_BYTES) {
      // Sort oldest first
      fileStats.sort((a, b) => a.modificationTime - b.modificationTime);
      let freed = 0;
      const targetFreed = totalSize - MAX_CACHE_BYTES * 0.75; // free down to 75% capacity

      for (const item of fileStats) {
        if (freed >= targetFreed) break;
        await FileSystem.deleteAsync(item.uri, { idempotent: true });
        freed += item.size;
        console.log(`[AudioCache] Evicted LRU file: ${item.name} (${Math.round(item.size / 1024)} KB)`);
      }
    }
  } catch (err) {
    console.warn('[AudioCache] Cache pruning error:', err);
  }
}
