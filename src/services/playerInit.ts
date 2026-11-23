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
      // Fast-start buffering: start playing after only 1.5s buffered (zero lag)
      playBuffer: 1.5,
      minBuffer: 15,
      maxBuffer: 50,
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
