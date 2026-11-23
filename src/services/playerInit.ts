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
      // Instant-play: begin emitting sound after only 0.2s of audio buffered (zero lag)
      playBuffer: 0.2,
      minBuffer: 10,
      maxBuffer: 40,
      backBuffer: 10,
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
