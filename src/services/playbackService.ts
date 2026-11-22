import TrackPlayer, { Event } from 'react-native-track-player';

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
    TrackPlayer.skipToNext();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    TrackPlayer.skipToPrevious();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    TrackPlayer.seekTo(event.position);
  });

  // Audio Focus & Ducking (Samsung & Android calls/notifications)
  TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
    if (event.permanent) {
      await TrackPlayer.stop();
    } else if (event.paused) {
      // Audio focus lost (e.g. incoming phone call)
      await TrackPlayer.pause();
    } else {
      // Audio focus restored
      await TrackPlayer.play();
    }
  });
}
