import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Playlist, TrackInfo } from '../types';
import { fetchPlaylistDetails } from '../services/youtube';

const STORAGE_KEY = '@elx_playlists_v1';

interface PlaylistState {
  playlists: Playlist[];
  isLoaded: boolean;

  loadPlaylists: () => Promise<void>;
  createPlaylist: (title: string, description?: string) => Promise<Playlist>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  renamePlaylist: (playlistId: string, title: string, description?: string) => Promise<void>;
  addTrackToPlaylist: (
    playlistId: string,
    track: TrackInfo
  ) => Promise<{ success: boolean; alreadyExists?: boolean }>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  importYouTubePlaylist: (
    urlOrId: string
  ) => Promise<{ success: boolean; playlist?: Playlist; error?: string }>;
}

function computeCoverUrls(tracks: TrackInfo[]): string[] {
  const urls: string[] = [];
  for (const t of tracks) {
    if (t.artwork && !urls.includes(t.artwork)) {
      urls.push(t.artwork);
      if (urls.length >= 4) break;
    }
  }
  return urls;
}

function extractYouTubePlaylistId(input: string): string | null {
  const trimmed = input.trim();
  // Direct playlist ID format
  if (/^[A-Za-z0-9_-]{12,}$/.test(trimmed)) {
    return trimmed;
  }
  // URL matching
  const match = trimmed.match(/[?&]list=([A-Za-z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],
  isLoaded: false,

  loadPlaylists: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const playlists: Playlist[] = JSON.parse(stored);
        set({ playlists, isLoaded: true });
      } else {
        set({ playlists: [], isLoaded: true });
      }
    } catch (err) {
      console.error('[PlaylistStore] Failed to load playlists:', err);
      set({ playlists: [], isLoaded: true });
    }
  },

  createPlaylist: async (title: string, description?: string) => {
    const { playlists } = get();
    const newPlaylist: Playlist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim() || 'Untitled Playlist',
      description: description?.trim() || '',
      tracks: [],
      coverUrls: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newPlaylist, ...playlists];
    set({ playlists: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newPlaylist;
  },

  deletePlaylist: async (playlistId: string) => {
    const { playlists } = get();
    const updated = playlists.filter((p) => p.id !== playlistId);
    set({ playlists: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  renamePlaylist: async (playlistId: string, title: string, description?: string) => {
    const { playlists } = get();
    const updated = playlists.map((p) => {
      if (p.id === playlistId) {
        return {
          ...p,
          title: title.trim() || p.title,
          description: description !== undefined ? description.trim() : p.description,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    set({ playlists: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  addTrackToPlaylist: async (playlistId: string, track: TrackInfo) => {
    const { playlists } = get();
    const target = playlists.find((p) => p.id === playlistId);
    if (!target) return { success: false, error: 'Playlist not found' };

    const exists = target.tracks.some((t) => t.id === track.id);
    if (exists) {
      return { success: false, alreadyExists: true };
    }

    const newTracks = [track, ...target.tracks];
    const updated = playlists.map((p) => {
      if (p.id === playlistId) {
        return {
          ...p,
          tracks: newTracks,
          coverUrls: computeCoverUrls(newTracks),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    set({ playlists: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return { success: true };
  },

  removeTrackFromPlaylist: async (playlistId: string, trackId: string) => {
    const { playlists } = get();
    const updated = playlists.map((p) => {
      if (p.id === playlistId) {
        const newTracks = p.tracks.filter((t) => t.id !== trackId);
        return {
          ...p,
          tracks: newTracks,
          coverUrls: computeCoverUrls(newTracks),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    set({ playlists: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  importYouTubePlaylist: async (urlOrId: string) => {
    const listId = extractYouTubePlaylistId(urlOrId);
    if (!listId) {
      return { success: false, error: 'Invalid YouTube playlist URL or ID' };
    }

    try {
      const details = await fetchPlaylistDetails(listId);
      if (!details || !details.tracks || details.tracks.length === 0) {
        return { success: false, error: 'Playlist is empty or unavailable' };
      }

      const { playlists } = get();
      const newPlaylist: Playlist = {
        id: `ytpl_${listId}_${Date.now()}`,
        title: details.title || 'Imported Playlist',
        description: details.description || `Imported from YouTube (${details.tracks.length} tracks)`,
        tracks: details.tracks,
        coverUrls: computeCoverUrls(details.tracks),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = [newPlaylist, ...playlists];
      set({ playlists: updated });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      return { success: true, playlist: newPlaylist };
    } catch (err: any) {
      console.error('[PlaylistStore] Error importing playlist:', err);
      return { success: false, error: err?.message || 'Failed to import playlist' };
    }
  },
}));

