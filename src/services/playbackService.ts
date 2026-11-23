import TrackPlayer, { Event, State } from 'react-native-track-player';
import { useStatsStore } from '../store/statsStore';
import { usePlayerStore } from '../store/playerStore';
import { prefetchTrackAudioStreamUrl } from './youtube';

let activeTrackStartTime = 0;
let isAdvancing = false;

/**
 * Headless background playback service required by react-native-track-player.
 * Handles lock screen controls, headset events, notifications, audio focus,
 * and reliable auto-advance when a track finishes naturally.
 */
export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    TrackPlayer.stop();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    usePlayerStore.getState().skipNext();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    usePlayerStore.getState().skipPrevious();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    TrackPlayer.seekTo(event.position);
  });

  // Auto-advance to next track when the queue ends naturally
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async () => {
    if (isAdvancing) return;
    try {
      const { position, duration } = await TrackPlayer.getProgress();
      // True natural completion check: song played to completion (within 3.5s of end)
      // This strictly prevents the infinite skip loop on TrackPlayer.reset() where duration is 0
      if (duration > 5 && position >= duration - 3.5) {
        isAdvancing = true;
        await usePlayerStore.getState().skipNext();
        setTimeout(() => {
          isAdvancing = false;
        }, 1500);
      }
    } catch {
      // ignore
    }
  });

  // Secondary check on state transition to Ended
  TrackPlayer.addEventListener(Event.PlaybackState, async (event) => {
    if (isAdvancing) return;
    const state = (event as any).state;
    if (state === State.Ended || state === 'ended') {
      try {
        const { position, duration } = await TrackPlayer.getProgress();
        if (duration > 5 && position >= duration - 3.5) {
          isAdvancing = true;
          await usePlayerStore.getState().skipNext();
          setTimeout(() => {
            isAdvancing = false;
          }, 1500);
        }
      } catch {
        // ignore
      }
    }
  });

  // Track real listening time
  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async () => {
    if (activeTrackStartTime > 0) {
      const elapsedMs = Date.now() - activeTrackStartTime;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      if (elapsedSec >= 5) {
        useStatsStore.getState().recordListeningTime(elapsedSec);
      }
    }
    activeTrackStartTime = Date.now();
  });

  // Predictive Pre-Buffering: When playback reaches 70% of duration,
  // pre-fetch and warm up the next track in queue for instant 0s switch
  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, async (event) => {
    if (event.duration > 15 && event.position >= event.duration * 0.7) {
      const state = usePlayerStore.getState();
      const nextIdx = state.queueIndex + 1;
      if (nextIdx < state.queue.length) {
        const nextTrack = state.queue[nextIdx];
        if (nextTrack && nextTrack.id) {
          prefetchTrackAudioStreamUrl(nextTrack.id);
        }
      }
    }
  });

  // Audio Focus & Ducking (Samsung & Android calls/notifications)
  TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
    if (event.permanent) {
      await TrackPlayer.stop();
    } else if (event.paused) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  });
}
