import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StatusBar } from 'react-native';
import { Home, Search, Library, Settings } from 'lucide-react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { MiniPlayer } from './src/components/player/MiniPlayer';
import { UpdateModal } from './src/components/UpdateModal';
import { Toast } from './src/components/Toast';
import { setupPlayer } from './src/services/playerInit';
import { useLibraryStore } from './src/store/libraryStore';
import { useStatsStore } from './src/store/statsStore';
import { useDownloadStore } from './src/store/downloadStore';
import { checkForUpdate, UpdateCheckResult } from './src/services/updater';
import { checkAndPromptBatteryOptimization } from './src/services/samsungOptimizer';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library' | 'settings'>('home');
  const [fullPlayerVisible, setFullPlayerVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const loadLibrary = useLibraryStore((s) => s.loadLibrary);
  const loadStats = useStatsStore((s) => s.loadStats);
  const loadDownloads = useDownloadStore((s) => s.loadDownloads);

  useEffect(() => {
    // 1. Initialize Audio Player Service
    setupPlayer();

    // 2. Load stored favorites, history & listening stats
    loadLibrary();
    loadStats();
    loadDownloads();

    // 3. Proactive one-time check for Samsung / Android battery optimization
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

      {/* Screen Views */}
      <View className="flex-1">
        {activeTab === 'home' ? (
          <HomeScreen onOpenSearch={() => setActiveTab('search')} />
        ) : activeTab === 'search' ? (
          <SearchScreen onTrackSelected={() => {}} />
        ) : activeTab === 'library' ? (
          <LibraryScreen />
        ) : (
          <SettingsScreen
            onShowUpdate={(info) => {
              setUpdateInfo(info);
              setShowUpdateModal(true);
            }}
          />
        )}
      </View>

      {/* Docked Mini Player */}
      <MiniPlayer onPress={() => setFullPlayerVisible(true)} />

      {/* Toast Overlay */}
      <Toast />

      {/* Liner Style Bottom Navigation (Home | Search | Library | Settings) */}
      <View className="flex-row items-center justify-around bg-card border-t border-zinc-900 py-3 pb-5">
        <TouchableOpacity
          onPress={() => setActiveTab('home')}
          className="items-center"
          activeOpacity={0.7}
        >
          <Home
            size={22}
            color={activeTab === 'home' ? '#ffffff' : '#71717a'}
            fill={activeTab === 'home' ? '#ffffff' : 'transparent'}
          />
          <Text
            className={`text-[10px] font-semibold mt-1 tracking-tight ${
              activeTab === 'home' ? 'text-white font-bold' : 'text-zinc-500'
            }`}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('search')}
          className="items-center"
          activeOpacity={0.7}
        >
          <Search
            size={22}
            color={activeTab === 'search' ? '#ffffff' : '#71717a'}
          />
          <Text
            className={`text-[10px] font-semibold mt-1 tracking-tight ${
              activeTab === 'search' ? 'text-white font-bold' : 'text-zinc-500'
            }`}
          >
            Search
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('library')}
          className="items-center"
          activeOpacity={0.7}
        >
          <Library
            size={22}
            color={activeTab === 'library' ? '#ffffff' : '#71717a'}
          />
          <Text
            className={`text-[10px] font-semibold mt-1 tracking-tight ${
              activeTab === 'library' ? 'text-white font-bold' : 'text-zinc-500'
            }`}
          >
            Library
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('settings')}
          className="items-center"
          activeOpacity={0.7}
        >
          <Settings
            size={22}
            color={activeTab === 'settings' ? '#ffffff' : '#71717a'}
          />
          <Text
            className={`text-[10px] font-semibold mt-1 tracking-tight ${
              activeTab === 'settings' ? 'text-white font-bold' : 'text-zinc-500'
            }`}
          >
            Settings
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
