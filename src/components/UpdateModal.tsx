import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Sparkles, Download, ArrowUpCircle } from 'lucide-react-native';
import { downloadAndInstallApk, dismissUpdateVersion, UpdateCheckResult } from '../services/updater';

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

  const handleDismiss = () => {
    if (updateInfo.latestVersion) {
      dismissUpdateVersion(updateInfo.latestVersion);
    }
    onDismiss();
  };

  const handleUpdate = async () => {
    if (!updateInfo.apkAsset) {
      setErrorMsg('No installation package found for this release.');
      return;
    }

    try {
      setDownloading(true);
      setErrorMsg(null);

      // Dismiss so it doesn't prompt again after reopening
      if (updateInfo.latestVersion) {
        dismissUpdateVersion(updateInfo.latestVersion);
      }

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
      onRequestClose={handleDismiss}
    >
      <View className="flex-1 bg-black/80 items-center justify-center p-6">
        <View className="bg-card border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center mb-3">
            <View className="w-11 h-11 rounded-2xl bg-primary/10 items-center justify-center mr-3 border border-primary/20">
              <Sparkles size={20} color="#38bdf8" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-base font-bold tracking-tight">Update Available</Text>
              <Text className="text-zinc-400 text-xs mt-0.5">
                Version <Text className="text-primary font-bold">{updateInfo.latestVersion}</Text> is ready
              </Text>
            </View>
          </View>

          {/* Release Notes */}
          <View className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3.5 my-3">
            <Text className="text-zinc-300 text-xs leading-5">
              {updateInfo.releaseNotes || 'Includes Liner UI refresh, fast YouTube search, and performance improvements.'}
            </Text>
          </View>

          {/* Download Progress Bar */}
          {downloading && (
            <View className="mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-zinc-400 text-xs font-medium">Downloading package...</Text>
                <Text className="text-primary text-xs font-bold font-mono">{progress}%</Text>
              </View>
              <View className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <View
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </View>
            </View>
          )}

          {errorMsg && (
            <Text className="text-rose-400 text-xs mb-3 font-medium">{errorMsg}</Text>
          )}

          {/* Action buttons */}
          <View className="flex-row space-x-3 mt-1">
            {!downloading && (
              <TouchableOpacity
                onPress={handleDismiss}
                activeOpacity={0.7}
                className="flex-1 py-3 rounded-xl bg-zinc-800/80 items-center justify-center border border-zinc-700/40"
              >
                <Text className="text-zinc-300 font-semibold text-xs">Later</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleUpdate}
              disabled={downloading}
              activeOpacity={0.8}
              className={`flex-1 py-3 rounded-xl bg-primary items-center justify-center flex-row ${
                downloading ? 'opacity-80' : ''
              }`}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <Download size={15} color="#000000" />
                  <Text className="text-black font-bold text-xs ml-1.5">Install Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
