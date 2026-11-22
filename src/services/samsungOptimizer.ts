import { Platform, Alert, Linking } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';

/**
 * Checks and prompts user on Android (especially Samsung One UI)
 * to disable aggressive battery optimization for seamless background audio.
 */
export async function checkAndPromptBatteryOptimization() {
  if (Platform.OS !== 'android') return;

  try {
    Alert.alert(
      "Background Playback Optimization",
      "To ensure uninterrupted playback when the screen is locked or while multitasking, allow Liner Mobile to run without battery restrictions.",
      [
        {
          text: "Later",
          style: "cancel",
        },
        {
          text: "Settings",
          onPress: async () => {
            try {
              await IntentLauncher.startActivityAsync(
                IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
              );
            } catch (e) {
              Linking.openSettings();
            }
          },
        },
      ]
    );
  } catch (err) {
    console.warn('Could not launch battery optimization settings', err);
  }
}
