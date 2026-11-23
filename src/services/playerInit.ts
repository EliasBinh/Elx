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
      // 1GB ExoPlayer SimpleCache on Android for extensive offline & zero-data repeat playback
      maxCacheSize: 1024 * 1024,
      // Ultra-fast start: start playback after only 0.5s buffered
      playBuffer: 0.5,
      // Aggressive buffer: 60s min, 500s (~8.3 min full song) max, 60s back buffer
      minBuffer: 60,
      maxBuffer: 500,
      backBuffer: 60,
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
