import { create } from 'zustand';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrackInfo } from '../types';
import { getTrackAudioStreamUrl } from '../services/youtube';
import { showToast } from '../components/Toast';

const DOWNLOADS_STORAGE_KEY = '@elx_downloaded_tracks';
const OFFLINE_MODE_KEY = '@elx_offline_mode_active';
const DOWNLOAD_DIR = `${FileSystem.documentDirectory}downloads/`;

interface DownloadState {
  downloads: TrackInfo[];
  downloadingIds: string[];
  isOfflineOnly: boolean;
  isLoaded: boolean;

  // Actions
  loadDownloads: () => Promise<void>;
  downloadTrack: (track: TrackInfo) => Promise<boolean>;
  removeDownload: (trackId: string) => Promise<void>;
  isDownloaded: (trackId: string) => boolean;
  isDownloading: (trackId: string) => boolean;
  toggleOfflineOnly: () => Promise<void>;
  getOfflineTrackPath: (trackId: string) => string;
}

async function ensureDownloadDirExists(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
  }
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  downloads: [],
  downloadingIds: [],
  isOfflineOnly: false,
  isLoaded: false,

  loadDownloads: async () => {
    try {
      await ensureDownloadDirExists();
      const raw = await AsyncStorage.getItem(DOWNLOADS_STORAGE_KEY);
      const rawOffline = await AsyncStorage.getItem(OFFLINE_MODE_KEY);

      let loaded: TrackInfo[] = raw ? JSON.parse(raw) : [];

      // Verify that downloaded audio files actually exist on disk
      const verified: TrackInfo[] = [];
      for (const t of loaded) {
        const audioPath = `${DOWNLOAD_DIR}${t.id}.m4a`;
        const info = await FileSystem.getInfoAsync(audioPath);
        if (info.exists && info.size && info.size > 200 * 1024) {
          verified.push({
            ...t,
            streamUrl: audioPath,
          });
        }
      }

      set({
        downloads: verified,
        isOfflineOnly: rawOffline === 'true',
        isLoaded: true,
      });

      if (verified.length !== loaded.length) {
        await AsyncStorage.setItem(DOWNLOADS_STORAGE_KEY, JSON.stringify(verified));
      }
    } catch (err) {
      console.warn('[DownloadStore] Failed to load downloads:', err);
      set({ isLoaded: true });
    }
  },

  isDownloaded: (trackId: string) => {
    return get().downloads.some((t) => t.id === trackId);
  },

  isDownloading: (trackId: string) => {
    return get().downloadingIds.includes(trackId);
  },

  getOfflineTrackPath: (trackId: string) => {
    return `${DOWNLOAD_DIR}${trackId}.m4a`;
  },

  downloadTrack: async (track: TrackInfo): Promise<boolean> => {
    const { downloads, downloadingIds, isDownloaded } = get();
    if (isDownloaded(track.id)) {
      showToast(`"${track.title}" is already downloaded`);
      return true;
    }

    if (downloadingIds.includes(track.id)) {
      showToast(`"${track.title}" is currently downloading...`);
      return false;
    }

    set({ downloadingIds: [...downloadingIds, track.id] });
    showToast(`Downloading "${track.title}"...`);

    try {
      await ensureDownloadDirExists();
      const audioTarget = `${DOWNLOAD_DIR}${track.id}.m4a`;
      const artworkTarget = `${DOWNLOAD_DIR}${track.id}.jpg`;

      // 1. Resolve direct audio stream URL
      const streamUrl = await getTrackAudioStreamUrl(track.id);
      if (!streamUrl) {
        throw new Error('Unable to resolve audio stream URL');
      }

      // 2. Download audio file into permanent documents directory
      const downloadRes = await FileSystem.downloadAsync(streamUrl, audioTarget);
      if (downloadRes.status !== 200) {
        throw new Error(`Download failed with status ${downloadRes.status}`);
      }

      // 3. Download artwork for 100% offline visual presentation
      let offlineArtwork = track.artwork;
      if (track.artwork && track.artwork.startsWith('http')) {
        try {
          const artRes = await FileSystem.downloadAsync(track.artwork, artworkTarget);
          if (artRes.status === 200) {
            offlineArtwork = artworkTarget;
          }
        } catch {
          // Artwork failure is non-fatal
        }
      }

      const offlineTrack: TrackInfo = {
        ...track,
        streamUrl: audioTarget,
        artwork: offlineArtwork,
      };

      const updated = [offlineTrack, ...downloads];
      set({
        downloads: updated,
        downloadingIds: get().downloadingIds.filter((id) => id !== track.id),
      });

      await AsyncStorage.setItem(DOWNLOADS_STORAGE_KEY, JSON.stringify(updated));
      showToast(`Downloaded "${track.title}" (Ready offline)`);
      return true;
    } catch (error: any) {
      console.error('[DownloadStore] Download failed:', error);
      set({
        downloadingIds: get().downloadingIds.filter((id) => id !== track.id),
      });
      showToast(`Download failed: ${error?.message || 'Error'}`);
      return false;
    }
  },

  removeDownload: async (trackId: string) => {
    try {
      const audioTarget = `${DOWNLOAD_DIR}${trackId}.m4a`;
      const artworkTarget = `${DOWNLOAD_DIR}${trackId}.jpg`;

      await FileSystem.deleteAsync(audioTarget, { idempotent: true });
      await FileSystem.deleteAsync(artworkTarget, { idempotent: true });

      const updated = get().downloads.filter((t) => t.id !== trackId);
      set({ downloads: updated });
      await AsyncStorage.setItem(DOWNLOADS_STORAGE_KEY, JSON.stringify(updated));
      showToast('Removed from downloads');
    } catch (err: any) {
      console.warn('[DownloadStore] Remove failed:', err);
    }
  },

  toggleOfflineOnly: async () => {
    const nextState = !get().isOfflineOnly;
    set({ isOfflineOnly: nextState });
    await AsyncStorage.setItem(OFFLINE_MODE_KEY, nextState ? 'true' : 'false');
    if (nextState) {
      showToast('Offline Mode: Playing only downloaded tracks');
    } else {
      showToast('Online Mode enabled');
    }
  },
}));
