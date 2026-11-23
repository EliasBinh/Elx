import { Platform, Alert, Linking } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BATTERY_OPT_DISMISSED_KEY = '@elx_battery_opt_dismissed';

/**
 * Prompts user on Android (especially Samsung One UI) ONCE to disable
 * aggressive battery optimization for uninterrupted background playback.
 * Remembers decision in AsyncStorage so it NEVER loops on subsequent app launches.
 */
export async function checkAndPromptBatteryOptimization() {
  if (Platform.OS !== 'android') return;

  try {
    const dismissed = await AsyncStorage.getItem(BATTERY_OPT_DISMISSED_KEY);
    if (dismissed === 'true') {
      return;
    }

    // Mark as prompted immediately so it NEVER prompts repeatedly
    await AsyncStorage.setItem(BATTERY_OPT_DISMISSED_KEY, 'true');

    Alert.alert(
      "Background Playback",
      "For uninterrupted music playback when the screen is locked, allow Elx to run without battery restrictions.",
      [
        {
          text: "Don't show again",
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
    // Silently ignore
  }
}
