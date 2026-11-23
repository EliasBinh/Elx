import { create } from 'zustand';
import TrackPlayer, { State } from 'react-native-track-player';
import { LyricsData, PlaybackMode, TrackInfo } from '../types';
import { getTrackAudioStreamUrl, getRelatedTracks } from '../services/youtube';
import { fetchLyricsFromLrcLib } from '../services/lyrics/lyricsService';
import { setupPlayer } from '../services/playerInit';
import { useStatsStore } from './statsStore';
import { analytics } from '../services/analytics';
import { showToast } from '../components/Toast';

interface PlayerState {
  currentTrack: TrackInfo | null;
  queue: TrackInfo[];
  queueIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  playbackMode: PlaybackMode;
  lyrics: LyricsData | null;
  isLoadingLyrics: boolean;

  // Actions
  playTrack: (track: TrackInfo, queue?: TrackInfo[]) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrevious: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  setPlaybackMode: (mode: PlaybackMode) => void;
  loadLyricsForCurrentTrack: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  isLoading: false,
  playbackMode: 'repeat-all',
  lyrics: null,
  isLoadingLyrics: false,

  playTrack: async (track: TrackInfo, queue?: TrackInfo[]) => {
    try {
      set({ isLoading: true, currentTrack: track, lyrics: null });
      await setupPlayer();

      const newQueue = queue && queue.length > 0 ? queue : [track];
      const index = newQueue.findIndex((t) => t.id === track.id);

      set({
        queue: newQueue,
        queueIndex: index >= 0 ? index : 0,
      });

      // Resolve audio stream with Android compatible headers
      const streamData = await getTrackAudioStreamUrl(track.id);
      if (!streamData || !streamData.url) {
        throw new Error('Could not resolve audio stream URL');
      }

      const activeTrack: TrackInfo = {
        ...track,
        streamUrl: streamData.url,
        headers: streamData.headers,
      };
      set({ currentTrack: activeTrack });

      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: activeTrack.id,
        url: streamData.url,
        title: activeTrack.title,
        artist: activeTrack.artist,
        artwork: activeTrack.artwork,
        duration: activeTrack.duration,
        ...(streamData.headers ? { headers: streamData.headers } : {}),
      });

      await TrackPlayer.play();
      set({ isPlaying: true, isLoading: false });

      // Automatically track stats & analytics
      useStatsStore.getState().recordSongPlay(activeTrack);
      analytics.trackSongPlayed(activeTrack);

      // Automatically fetch synced lyrics and autoplay queue in background
      get().loadLyricsForCurrentTrack();

      // If near end of queue, fetch autoplay recommendations
      if (index === newQueue.length - 1) {
        getRelatedTracks(track.id).then((related) => {
          if (related.length > 0) {
            set((state) => ({ queue: [...state.queue, ...related] }));
          }
        });
      }
    } catch (error) {
      console.error('Failed to play track:', error);
      set({ isLoading: false, isPlaying: false });
      showToast(`Cannot play "${track.title}". Skipping...`);
      // Auto-skip to next after short delay
      setTimeout(() => {
        get().skipNext();
      }, 1500);
    }
  },

  togglePlayPause: async () => {
    const { isPlaying } = get();
    if (isPlaying) {
      await TrackPlayer.pause();
      set({ isPlaying: false });
    } else {
      await TrackPlayer.play();
      set({ isPlaying: true });
    }
  },

  skipNext: async () => {
    const { queue, queueIndex, playbackMode, playTrack } = get();
    if (queue.length === 0) return;

    if (playbackMode === 'repeat-one') {
      await TrackPlayer.seekTo(0);
      await TrackPlayer.play();
      return;
    }

    let nextIndex = queueIndex + 1;
    if (playbackMode === 'shuffle') {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      if (playbackMode === 'repeat-all') {
        nextIndex = 0;
      } else {
        return;
      }
    }

    const nextTrack = queue[nextIndex];
    if (nextTrack) {
      await playTrack(nextTrack, queue);
    }
  },

  skipPrevious: async () => {
    const { queue, queueIndex, playTrack } = get();
    if (queue.length === 0) return;

    // If more than 3 seconds in, restart current track
    const position = await TrackPlayer.getPosition();
    if (position > 3) {
      await TrackPlayer.seekTo(0);
      return;
    }

    const prevIndex = queueIndex - 1 >= 0 ? queueIndex - 1 : queue.length - 1;
    const prevTrack = queue[prevIndex];
    if (prevTrack) {
      await playTrack(prevTrack, queue);
    }
  },

  seekTo: async (seconds: number) => {
    await TrackPlayer.seekTo(seconds);
  },

  setPlaybackMode: (mode: PlaybackMode) => {
    set({ playbackMode: mode });
  },

  loadLyricsForCurrentTrack: async () => {
    const { currentTrack } = get();
    if (!currentTrack) return;

    set({ isLoadingLyrics: true });
    try {
      const lyricsData = await fetchLyricsFromLrcLib(
        currentTrack.title,
        currentTrack.artist,
        currentTrack.duration
      );
      if (lyricsData) {
        set({ lyrics: lyricsData });
      }
    } catch (error) {
      console.warn('Could not load lyrics:', error);
    } finally {
      set({ isLoadingLyrics: false });
    }
  },
}));
