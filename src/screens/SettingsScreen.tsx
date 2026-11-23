import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {
  Settings,
  Activity,
  BatteryCharging,
  RefreshCw,
  Trash2,
  Github,
  CheckCircle2,
  Music,
  ExternalLink,
} from 'lucide-react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import { useStatsStore } from '../store/statsStore';
import { useLibraryStore } from '../store/libraryStore';
import { checkForUpdate } from '../services/updater';
import { APP_CONFIG } from '../constants/config';
import { showToast } from '../components/Toast';

interface SettingsScreenProps {
  onShowUpdate?: (info: any) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onShowUpdate }) => {
  const totalMinutes = useStatsStore((s) => s.totalMinutes);
  const totalSongsPlayed = useStatsStore((s) => s.totalSongsPlayed);
  const getTopTracks = useStatsStore((s) => s.getTopTracks);
  const clearStats = useStatsStore((s) => s.clearStats);
  const clearHistory = useLibraryStore((s) => s.clearHistory);

  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const topTracks = getTopTracks(3);

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const res = await checkForUpdate();
      setCheckingUpdate(false);
      if (res.hasUpdate && onShowUpdate) {
        onShowUpdate(res);
      } else {
        showToast(`You are on the latest version (v${APP_CONFIG.VERSION})`);
      }
    } catch (e) {
      setCheckingUpdate(false);
      showToast('Could not check for updates');
    }
  };

  const handleOpenBatterySettings = async () => {
    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
      );
    } catch (e) {
      Linking.openSettings();
    }
  };

  const handleClearHistory = () => {
    Alert.alert('Clear History', 'Are you sure you want to clear your listening history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearHistory();
          showToast('Listening history cleared');
        },
      },
    ]);
  };

  const handleClearStats = () => {
    Alert.alert('Reset Stats', 'Are you sure you want to reset your listening stats?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await clearStats();
          showToast('Listening stats reset');
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-white font-black text-2xl tracking-tight">SETTINGS</Text>
          <Text className="text-zinc-500 text-xs mt-0.5">Preferences, activity & app info</Text>
        </View>

        {/* Section 1: Your Activity */}
        <View className="mb-6">
          <Text className="text-zinc-400 font-bold text-xs tracking-wider uppercase mb-3">
            Your Activity
          </Text>

          {totalSongsPlayed > 0 ? (
            <View className="bg-card border border-zinc-800 rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-1 mr-2">
                  <Text className="text-zinc-500 text-[11px] font-medium">TOTAL TRACKS</Text>
                  <Text className="text-white font-extrabold text-2xl mt-0.5">
                    {totalSongsPlayed.toLocaleString()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-zinc-500 text-[11px] font-medium">LISTENING TIME</Text>
                  <Text className="text-white font-extrabold text-2xl mt-0.5">
                    {totalMinutes} <Text className="text-sm font-normal text-zinc-500">min</Text>
                  </Text>
                </View>
              </View>

              {topTracks.length > 0 && (
                <View className="border-t border-zinc-800/80 pt-3 mt-1">
                  <Text className="text-zinc-400 text-xs font-semibold mb-2">Most Played</Text>
                  {topTracks.map((t, idx) => (
                    <View key={t.track.id} className="flex-row items-center justify-between py-1.5">
                      <Text className="text-zinc-300 text-xs flex-1 mr-2" numberOfLines={1}>
                        {idx + 1}. {t.track.title}
                      </Text>
                      <Text className="text-zinc-500 text-[11px] font-mono">{t.count} plays</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View className="bg-card border border-zinc-800 rounded-2xl p-4 items-center">
              <Activity size={24} color="#52525b" />
              <Text className="text-zinc-400 text-xs font-medium mt-2 text-center">
                No activity recorded yet
              </Text>
              <Text className="text-zinc-600 text-[11px] text-center mt-1">
                Play any track to track real listening time and song plays.
              </Text>
            </View>
          )}
        </View>

        {/* Section 2: App & System */}
        <View className="mb-6">
          <Text className="text-zinc-400 font-bold text-xs tracking-wider uppercase mb-3">
            App & System
          </Text>

          <View className="bg-card border border-zinc-800 rounded-2xl overflow-hidden">
            {/* Battery Optimization */}
            <TouchableOpacity
              onPress={handleOpenBatterySettings}
              activeOpacity={0.7}
              className="flex-row items-center justify-between p-4 border-b border-zinc-800/80"
            >
              <View className="flex-row items-center flex-1 mr-3">
                <View className="w-8 h-8 rounded-lg bg-emerald-500/10 items-center justify-center mr-3">
                  <BatteryCharging size={18} color="#34d399" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium text-sm">Background Playback</Text>
                  <Text className="text-zinc-500 text-xs mt-0.5">
                    Allow unrestricted battery for lock screen playback
                  </Text>
                </View>
              </View>
              <ExternalLink size={16} color="#71717a" />
            </TouchableOpacity>

            {/* Check Updates */}
            <TouchableOpacity
              onPress={handleCheckUpdate}
              disabled={checkingUpdate}
              activeOpacity={0.7}
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-row items-center flex-1 mr-3">
                <View className="w-8 h-8 rounded-lg bg-sky-500/10 items-center justify-center mr-3">
                  {checkingUpdate ? (
                    <ActivityIndicator size="small" color="#38bdf8" />
                  ) : (
                    <RefreshCw size={18} color="#38bdf8" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium text-sm">Check for Updates</Text>
                  <Text className="text-zinc-500 text-xs mt-0.5">
                    Current Version: v{APP_CONFIG.VERSION}
                  </Text>
                </View>
              </View>
              <Text className="text-primary text-xs font-semibold">Check</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 3: Data Management */}
        <View className="mb-6">
          <Text className="text-zinc-400 font-bold text-xs tracking-wider uppercase mb-3">
            Data & Privacy
          </Text>

          <View className="bg-card border border-zinc-800 rounded-2xl overflow-hidden">
            <TouchableOpacity
              onPress={handleClearHistory}
              activeOpacity={0.7}
              className="flex-row items-center justify-between p-4 border-b border-zinc-800/80"
            >
              <Text className="text-zinc-300 text-sm">Clear Listening History</Text>
              <Trash2 size={16} color="#71717a" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClearStats}
              activeOpacity={0.7}
              className="flex-row items-center justify-between p-4"
            >
              <Text className="text-rose-400 text-sm">Reset Activity Stats</Text>
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 4: About */}
        <View className="mb-6">
          <Text className="text-zinc-400 font-bold text-xs tracking-wider uppercase mb-3">
            About
          </Text>

          <View className="bg-card border border-zinc-800 rounded-2xl p-4">
            <View className="flex-row items-center mb-2">
              <Text className="text-white font-bold text-base">Elx</Text>
              <View className="ml-2 px-2 py-0.5 rounded-full bg-zinc-800">
                <Text className="text-zinc-400 text-[10px] font-bold font-mono">v{APP_CONFIG.VERSION}</Text>
              </View>
            </View>
            <Text className="text-zinc-400 text-xs leading-5">
              Open-source, ad-free YouTube Music player with Android Media3 background audio, lock screen controls, and syllable-accurate synced lyrics.
            </Text>

            <TouchableOpacity
              onPress={() => Linking.openURL('https://github.com/EliasBinh/Elx')}
              activeOpacity={0.7}
              className="flex-row items-center mt-3 pt-3 border-t border-zinc-800/80"
            >
              <Github size={16} color="#ffffff" />
              <Text className="text-white text-xs font-semibold ml-2">GitHub Repository</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

