import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';
import { TrackInfo } from '../types';

interface LibraryState {
  favorites: TrackInfo[];
  history: TrackInfo[];
  isLoaded: boolean;

  loadLibrary: () => Promise<void>;
  toggleFavorite: (track: TrackInfo) => Promise<void>;
  isFavorite: (trackId: string) => boolean;
  addToHistory: (track: TrackInfo) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  favorites: [],
  history: [],
  isLoaded: false,

  loadLibrary: async () => {
    try {
      const [favStr, histStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
        AsyncStorage.getItem(STORAGE_KEYS.HISTORY),
      ]);

      const favorites = favStr ? JSON.parse(favStr) : [];
      const history = histStr ? JSON.parse(histStr) : [];

      set({ favorites, history, isLoaded: true });
    } catch (error) {
      console.error('Failed to load library:', error);
      set({ isLoaded: true });
    }
  },

  toggleFavorite: async (track: TrackInfo) => {
    const { favorites } = get();
    const exists = favorites.some((t) => t.id === track.id);
    let newFavs: TrackInfo[];

    if (exists) {
      newFavs = favorites.filter((t) => t.id !== track.id);
    } else {
      newFavs = [track, ...favorites];
    }

    set({ favorites: newFavs });
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(newFavs));
  },

  isFavorite: (trackId: string) => {
    return get().favorites.some((t) => t.id === trackId);
  },

  addToHistory: async (track: TrackInfo) => {
    const { history } = get();
    const filtered = history.filter((t) => t.id !== track.id);
    const newHistory = [track, ...filtered].slice(0, 50); // limit to recent 50

    set({ history: newHistory });
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(newHistory));
  },

  clearHistory: async () => {
    set({ history: [] });
    await AsyncStorage.removeItem(STORAGE_KEYS.HISTORY);
  },
}));

