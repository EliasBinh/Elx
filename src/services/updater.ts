import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';
import { APP_CONFIG } from '../constants/config';
import { GitHubRelease, ReleaseAsset } from '../types';

export interface UpdateCheckResult {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  releaseNotes: string;
  apkAsset?: ReleaseAsset;
}

/**
 * Compares two semantic version strings (e.g. "1.0.1" > "1.0.0")
 */
export function isVersionHigher(latest: string, current: string): boolean {
  const cleanLatest = latest.replace(/^v/i, '').trim();
  const cleanCurrent = current.replace(/^v/i, '').trim();

  const lParts = cleanLatest.split('.').map((p) => parseInt(p, 10) || 0);
  const cParts = cleanCurrent.split('.').map((p) => parseInt(p, 10) || 0);

  for (let i = 0; i < Math.max(lParts.length, cParts.length); i++) {
    const l = lParts[i] || 0;
    const c = cParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

/**
 * Checks GitHub Releases API for new updates.
 */
export async function checkForUpdate(
  owner = APP_CONFIG.DEFAULT_GITHUB_OWNER,
  repo = APP_CONFIG.DEFAULT_GITHUB_REPO
): Promise<UpdateCheckResult> {
  const currentVersion = Constants.expoConfig?.version || APP_CONFIG.VERSION;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
      {
        headers: {
          'User-Agent': APP_CONFIG.USER_AGENT,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      return {
        hasUpdate: false,
        latestVersion: currentVersion,
        currentVersion,
        releaseNotes: '',
      };
    }

    const release: GitHubRelease = await response.json();
    const latestVersion = release.tag_name || release.name || currentVersion;
    const hasUpdate = isVersionHigher(latestVersion, currentVersion);

    const apkAsset = release.assets?.find(
      (a) => a.name.endsWith('.apk') || a.content_type === 'application/vnd.android.package-archive'
    );

    return {
      hasUpdate: hasUpdate && !!apkAsset,
      latestVersion,
      currentVersion,
      releaseNotes: release.body || 'New update with performance improvements and bug fixes.',
      apkAsset,
    };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return {
      hasUpdate: false,
      latestVersion: currentVersion,
      currentVersion,
      releaseNotes: '',
    };
  }
}

/**
 * Downloads the APK and triggers Android package installer via FileProvider.
 */
export async function downloadAndInstallApk(
  apkUrl: string,
  onProgress?: (progress: number, writtenBytes: number, totalBytes: number) => void
): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new Error('In-app APK installation is only supported on Android devices.');
  }

  const destinationPath = `${FileSystem.cacheDirectory}liner-mobile-update.apk`;

  const fileInfo = await FileSystem.getInfoAsync(destinationPath);
  if (fileInfo.exists) {
    await FileSystem.deleteAsync(destinationPath);
  }

  const downloadResumable = FileSystem.createDownloadResumable(
    apkUrl,
    destinationPath,
    {},
    (downloadProgress) => {
      const { totalBytesWritten, totalBytesExpectedToWrite } = downloadProgress;
      const progress = totalBytesExpectedToWrite > 0
        ? totalBytesWritten / totalBytesExpectedToWrite
        : 0;
      if (onProgress) {
        onProgress(progress, totalBytesWritten, totalBytesExpectedToWrite);
      }
    }
  );

  const downloadResult = await downloadResumable.downloadAsync();
  if (!downloadResult || !downloadResult.uri) {
    throw new Error('Failed to download update package.');
  }

  // Convert to content:// URI using FileProvider
  const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);

  // Trigger package installer intent
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: contentUri,
    type: 'application/vnd.android.package-archive',
    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
  });
}
