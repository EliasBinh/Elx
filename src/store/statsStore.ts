import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrackInfo } from '../types';

const STATS_STORAGE_KEY = '@elx_listening_stats';

export interface DayStat {
  date: string; // YYYY-MM-DD
  dayLabel: string; // Mon, Tue, etc.
  minutes: number;
  songCount: number;
}

export interface TrackPlayStat {
  track: TrackInfo;
  count: number;
}

interface StatsState {
  dailyListeningMinutes: Record<string, number>;
  dailySongCounts: Record<string, number>;
  trackPlayCounts: Record<string, TrackPlayStat>;
  totalMinutes: number;
  totalSongsPlayed: number;
  isLoaded: boolean;

  loadStats: () => Promise<void>;
  recordSongPlay: (track: TrackInfo) => Promise<void>;
  recordListeningTime: (seconds: number) => Promise<void>;
  getWeeklyTrend: () => DayStat[];
  getTopTracks: (limit?: number) => TrackPlayStat[];
  clearStats: () => Promise<void>;
}

function getTodayKey(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const useStatsStore = create<StatsState>((set, get) => ({
  dailyListeningMinutes: {},
  dailySongCounts: {},
  trackPlayCounts: {},
  totalMinutes: 0,
  totalSongsPlayed: 0,
  isLoaded: false,

  loadStats: async () => {
    try {
      const dataStr = await AsyncStorage.getItem(STATS_STORAGE_KEY);
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        set({
          dailyListeningMinutes: parsed.dailyListeningMinutes || {},
          dailySongCounts: parsed.dailySongCounts || {},
          trackPlayCounts: parsed.trackPlayCounts || {},
          totalMinutes: parsed.totalMinutes || 0,
          totalSongsPlayed: parsed.totalSongsPlayed || 0,
          isLoaded: true,
        });
      } else {
        // Start completely clean — zero fake mock data
        set({
          dailyListeningMinutes: {},
          dailySongCounts: {},
          trackPlayCounts: {},
          totalMinutes: 0,
          totalSongsPlayed: 0,
          isLoaded: true,
        });
      }
    } catch (e) {
      console.warn('Failed to load stats:', e);
      set({ isLoaded: true });
    }
  },

  recordSongPlay: async (track: TrackInfo) => {
    const today = getTodayKey();
    const { dailySongCounts, trackPlayCounts, totalSongsPlayed } = get();

    const currentCount = dailySongCounts[today] || 0;
    const newDailyCounts = { ...dailySongCounts, [today]: currentCount + 1 };

    const trackStat = trackPlayCounts[track.id] || { track, count: 0 };
    const newTrackCounts = {
      ...trackPlayCounts,
      [track.id]: { track, count: trackStat.count + 1 },
    };

    const newTotal = totalSongsPlayed + 1;

    set({
      dailySongCounts: newDailyCounts,
      trackPlayCounts: newTrackCounts,
      totalSongsPlayed: newTotal,
    });

    try {
      await AsyncStorage.setItem(
        STATS_STORAGE_KEY,
        JSON.stringify({
          dailyListeningMinutes: get().dailyListeningMinutes,
          dailySongCounts: newDailyCounts,
          trackPlayCounts: newTrackCounts,
          totalMinutes: get().totalMinutes,
          totalSongsPlayed: newTotal,
        })
      );
    } catch (e) {
      console.warn('Failed to persist play stat:', e);
    }
  },

  recordListeningTime: async (seconds: number) => {
    const today = getTodayKey();
    const minutesToAdd = Math.max(1, Math.round(seconds / 60));
    const { dailyListeningMinutes, totalMinutes } = get();

    const currentMins = dailyListeningMinutes[today] || 0;
    const newDailyMinutes = { ...dailyListeningMinutes, [today]: currentMins + minutesToAdd };
    const newTotal = totalMinutes + minutesToAdd;

    set({
      dailyListeningMinutes: newDailyMinutes,
      totalMinutes: newTotal,
    });

    try {
      await AsyncStorage.setItem(
        STATS_STORAGE_KEY,
        JSON.stringify({
          dailyListeningMinutes: newDailyMinutes,
          dailySongCounts: get().dailySongCounts,
          trackPlayCounts: get().trackPlayCounts,
          totalMinutes: newTotal,
          totalSongsPlayed: get().totalSongsPlayed,
        })
      );
    } catch (e) {
      console.warn('Failed to persist listening time:', e);
    }
  },

  getWeeklyTrend: (): DayStat[] => {
    const { dailyListeningMinutes, dailySongCounts } = get();
    const today = new Date();
    const trend: DayStat[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const dayIndex = d.getDay();
      const minutes = dailyListeningMinutes[key] || 0;
      const count = dailySongCounts[key] || 0;

      trend.push({
        date: key,
        dayLabel: DAY_NAMES[dayIndex],
        minutes,
        songCount: count,
      });
    }

    return trend;
  },

  getTopTracks: (limit = 5): TrackPlayStat[] => {
    const { trackPlayCounts } = get();
    return Object.values(trackPlayCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },

  clearStats: async () => {
    set({
      dailyListeningMinutes: {},
      dailySongCounts: {},
      trackPlayCounts: {},
      totalMinutes: 0,
      totalSongsPlayed: 0,
    });
    await AsyncStorage.removeItem(STATS_STORAGE_KEY);
  },
}));
