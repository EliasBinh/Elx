import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StatusBar } from 'react-native';
import { Home, Heart, Activity } from 'lucide-react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { MiniPlayer } from './src/components/player/MiniPlayer';
import { UpdateModal } from './src/components/UpdateModal';
import { setupPlayer } from './src/services/playerInit';
import { useLibraryStore } from './src/store/libraryStore';
import { useStatsStore } from './src/store/statsStore';
import { checkForUpdate, UpdateCheckResult } from './src/services/updater';
import { checkAndPromptBatteryOptimization } from './src/services/samsungOptimizer';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'library' | 'pulse'>('home');
  const [fullPlayerVisible, setFullPlayerVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const loadLibrary = useLibraryStore((s) => s.loadLibrary);
  const loadStats = useStatsStore((s) => s.loadStats);

  useEffect(() => {
    // 1. Initialize Audio Player Service
    setupPlayer();

    // 2. Load stored favorites, history & listening stats
    loadLibrary();
    loadStats();

    // 3. Proactive check for Samsung battery optimization
    checkAndPromptBatteryOptimization();

    // 4. Check for in-app updates via GitHub Releases
    checkForUpdate().then((result) => {
      if (result.hasUpdate) {
        setUpdateInfo(result);
        setShowUpdateModal(true);
      }
    });
  }, []);

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor="#09090b" />

      {/* Screen View */}
      <View className="flex-1">
        {activeTab === 'home' ? (
          <HomeScreen />
        ) : activeTab === 'library' ? (
          <LibraryScreen />
        ) : (
          <StatsScreen />
        )}
      </View>

      {/* Docked Mini Player */}
      <MiniPlayer onPress={() => setFullPlayerVisible(true)} />

      {/* Bottom Navigation */}
      <View className="flex-row items-center justify-around bg-card border-t border-zinc-900 py-3 pb-5">
        <TouchableOpacity
          onPress={() => setActiveTab('home')}
          className="items-center"
        >
          <Home
            size={22}
            color={activeTab === 'home' ? '#ffffff' : '#71717a'}
          />
          <Text
            className={`text-[11px] font-semibold mt-1 ${
              activeTab === 'home' ? 'text-white font-bold' : 'text-zinc-500'
            }`}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('library')}
          className="items-center"
        >
          <Heart
            size={22}
            color={activeTab === 'library' ? '#ffffff' : '#71717a'}
            fill={activeTab === 'library' ? '#ffffff' : 'transparent'}
          />
          <Text
            className={`text-[11px] font-semibold mt-1 ${
              activeTab === 'library' ? 'text-white font-bold' : 'text-zinc-500'
            }`}
          >
            Favorites
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('pulse')}
          className="items-center"
        >
          <Activity
            size={22}
            color={activeTab === 'pulse' ? '#ffffff' : '#71717a'}
          />
          <Text
            className={`text-[11px] font-semibold mt-1 ${
              activeTab === 'pulse' ? 'text-white font-bold' : 'text-zinc-500'
            }`}
          >
            Pulse
          </Text>
        </TouchableOpacity>
      </View>

      {/* Full-screen Now Playing Modal */}
      <Modal
        visible={fullPlayerVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setFullPlayerVisible(false)}
      >
        <PlayerScreen onClose={() => setFullPlayerVisible(false)} />
      </Modal>

      {/* In-App GitHub Releases Auto-Updater Modal */}
      <UpdateModal
        visible={showUpdateModal}
        updateInfo={updateInfo}
        onDismiss={() => setShowUpdateModal(false)}
      />
    </View>
  );
}
