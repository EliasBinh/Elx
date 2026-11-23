import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
} from 'react-native-track-player';

let isSetup = false;

export async function setupPlayer(): Promise<boolean> {
  if (isSetup) return true;

  try {
    await TrackPlayer.setupPlayer({
      autoHandleInterruptions: true,
      // 512MB ExoPlayer SimpleCache on Android for zero-data repeat playback
      maxCacheSize: 512 * 1024,
      // Fast start: start playback after only 0.8s buffered (default is 2.5s)
      playBuffer: 0.8,
      // Buffer parameters: keep 30s-90s ahead, 20s behind for smooth scrub
      minBuffer: 30,
      maxBuffer: 90,
      backBuffer: 20,
    });

    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior:
          AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
        Capability.Stop,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
      ],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
    });

    isSetup = true;
    return true;
  } catch (error: any) {
    if (
      error?.message?.includes('already been initialized') ||
      error?.message?.includes('already initialized') ||
      error?.code === 'player_already_initialized'
    ) {
      isSetup = true;
      return true;
    }
    console.error('Failed to setup TrackPlayer:', error);
    return false;
  }
}
