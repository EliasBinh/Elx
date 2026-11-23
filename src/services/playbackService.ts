import TrackPlayer, { Event } from 'react-native-track-player';
import { useStatsStore } from '../store/statsStore';
import { usePlayerStore } from '../store/playerStore';

let activeTrackStartTime = 0;

/**
 * Headless background playback service required by react-native-track-player.
 * Handles lock screen controls, headset events, notifications, and audio focus.
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
