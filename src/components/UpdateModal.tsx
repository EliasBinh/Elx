import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { downloadAndInstallApk, UpdateCheckResult } from '../services/updater';

interface UpdateModalProps {
  updateInfo: UpdateCheckResult | null;
  visible: boolean;
  onDismiss: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  updateInfo,
  visible,
  onDismiss,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!updateInfo || !visible) return null;

  const handleUpdate = async () => {
    if (!updateInfo.apkAsset) {
      setErrorMsg('No installation package found for this release.');
      return;
    }

    try {
      setDownloading(true);
      setErrorMsg(null);

      await downloadAndInstallApk(
        updateInfo.apkAsset.browser_download_url,
        (prog) => {
          setProgress(Math.round(prog * 100));
        }
      );

      setDownloading(false);
      onDismiss();
    } catch (err: any) {
      console.error('Update error:', err);
      setDownloading(false);
      setErrorMsg(err.message || 'Failed to download or install update.');
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onDismiss}
    >
      <View className="flex-1 bg-black/80 items-center justify-center p-6">
        <View className="bg-card border border-zinc-800 rounded-2xl p-6 w-full max-w-sm">
          <Text className="text-white text-lg font-bold">
            Update Available
          </Text>
          <Text className="text-zinc-400 text-xs mt-1">
            Version {updateInfo.latestVersion} of Elx is now available (Current: v{updateInfo.currentVersion}).
          </Text>

          {/* Release Notes */}
          <View className="bg-zinc-900/60 rounded-xl p-3 my-4 max-h-32">
            <Text className="text-zinc-300 text-xs leading-5">
              {updateInfo.releaseNotes || 'Includes bug fixes and performance improvements.'}
            </Text>
          </View>

          {/* Download Progress */}
          {downloading && (
            <View className="mb-4">
              <View className="flex-row justify-between mb-1.5">
                <Text className="text-zinc-400 text-xs">Downloading...</Text>
                <Text className="text-primary text-xs font-semibold">{progress}%</Text>
              </View>
              <View className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <View
                  className="h-full bg-primary"
                  style={{ width: `${progress}%` }}
                />
              </View>
            </View>
          )}

          {errorMsg && (
            <Text className="text-rose-400 text-xs mb-3">{errorMsg}</Text>
          )}

          {/* Action Buttons */}
          <View className="flex-row space-x-3 mt-2">
            {!downloading && (
              <TouchableOpacity
                onPress={onDismiss}
                className="flex-1 py-3 rounded-xl bg-zinc-800 items-center justify-center"
              >
                <Text className="text-zinc-300 font-semibold text-sm">Later</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleUpdate}
              disabled={downloading}
              className={`flex-1 py-3 rounded-xl bg-primary items-center justify-center ${
                downloading ? 'opacity-70' : ''
              }`}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text className="text-black font-bold text-sm">Update Now</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

