import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import {
  Heart,
  Music,
  ArrowDownCircle,
  WifiOff,
  Trash2,
  FolderDown,
} from 'lucide-react-native';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { useDownloadStore } from '../store/downloadStore';
import { TrackInfo } from '../types';

export const LibraryScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'downloaded' | 'favorites'>('all');

  const favorites = useLibraryStore((s) => s.favorites);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  const downloads = useDownloadStore((s) => s.downloads);
  const isDownloaded = useDownloadStore((s) => s.isDownloaded);
  const removeDownload = useDownloadStore((s) => s.removeDownload);
  const isOfflineOnly = useDownloadStore((s) => s.isOfflineOnly);
  const toggleOfflineOnly = useDownloadStore((s) => s.toggleOfflineOnly);

  const playTrack = usePlayerStore((s) => s.playTrack);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  // Compute display list based on active tab
  let displayTracks: TrackInfo[] = [];
  if (activeTab === 'downloaded') {
    displayTracks = downloads;
  } else if (activeTab === 'favorites') {
    displayTracks = favorites;
  } else {
    // 'all': merge downloads and favorites (deduplicated)
    const map = new Map<string, TrackInfo>();
    downloads.forEach((t) => map.set(t.id, t));
    favorites.forEach((t) => map.set(t.id, t));
    displayTracks = Array.from(map.values());
  }

  const handlePlay = (track: TrackInfo) => {
    playTrack(track, displayTracks);
  };

  const handleRemoveDownload = (track: TrackInfo) => {
    Alert.alert(
      'Remove Download',
      `Delete "${track.title}" from offline downloads?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeDownload(track.id),
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Top Header */}
      <View className="px-5 pt-3 pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-white font-black text-2xl tracking-tight">LIBRARY</Text>
            <Text className="text-zinc-500 text-xs mt-0.5">
              {downloads.length} downloaded • {favorites.length} favorites
            </Text>
          </View>

          {/* Spotify-Style Offline Mode Toggle */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleOfflineOnly}
            className={`flex-row items-center px-3 py-1.5 rounded-full border ${
              isOfflineOnly
                ? 'bg-emerald-950/80 border-emerald-500/50'
                : 'bg-card border-zinc-800'
            }`}
          >
            <WifiOff
              size={14}
              color={isOfflineOnly ? '#22c55e' : '#71717a'}
              className="mr-1.5"
            />
            <Text
              className={`text-xs font-semibold ${
                isOfflineOnly ? 'text-emerald-400' : 'text-zinc-400'
              }`}
            >
              Offline {isOfflineOnly ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Offline Mode Banner */}
        {isOfflineOnly ? (
          <View className="flex-row items-center bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-3 py-2 mb-3">
            <ArrowDownCircle size={16} color="#000000" fill="#22c55e" className="mr-2" />
            <Text className="text-emerald-300 text-xs flex-1 font-medium">
              Offline Mode active: Only downloaded music is playable without Wi-Fi.
            </Text>
          </View>
        ) : null}

        {/* Filter Pills (All | Downloaded | Favorites) */}
        <View className="flex-row space-x-2 my-1">
          <TouchableOpacity
            onPress={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-full ${
              activeTab === 'all'
                ? 'bg-white'
                : 'bg-card border border-zinc-800'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'all' ? 'text-black' : 'text-zinc-400'
              }`}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('downloaded')}
            className={`flex-row items-center px-4 py-1.5 rounded-full ${
              activeTab === 'downloaded'
                ? 'bg-white'
                : 'bg-card border border-zinc-800'
            }`}
          >
            <ArrowDownCircle
              size={13}
              color={activeTab === 'downloaded' ? '#000000' : '#000000'}
              fill={activeTab === 'downloaded' ? '#000000' : '#22c55e'}
              className="mr-1.5"
            />
            <Text
              className={`text-xs font-bold ${
                activeTab === 'downloaded' ? 'text-black' : 'text-zinc-400'
              }`}
            >
              Downloaded ({downloads.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('favorites')}
            className={`flex-row items-center px-4 py-1.5 rounded-full ${
              activeTab === 'favorites'
                ? 'bg-white'
                : 'bg-card border border-zinc-800'
            }`}
          >
            <Heart
              size={13}
              color={activeTab === 'favorites' ? '#000000' : '#ef4444'}
              fill={activeTab === 'favorites' ? '#000000' : '#ef4444'}
              className="mr-1.5"
            />
            <Text
              className={`text-xs font-bold ${
                activeTab === 'favorites' ? 'text-black' : 'text-zinc-400'
              }`}
            >
              Favorites ({favorites.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Track List */}
      {displayTracks.length === 0 ? (
        <View className="flex-1 items-center justify-center pb-20 px-6">
          {activeTab === 'downloaded' ? (
            <>
              <FolderDown size={48} color="#27272a" />
              <Text className="text-zinc-400 font-semibold text-base mt-4">
                No downloaded music
              </Text>
              <Text className="text-zinc-600 text-xs text-center mt-1">
                Tap the download button on any track to listen offline without Wi-Fi.
              </Text>
            </>
          ) : activeTab === 'favorites' ? (
            <>
              <Heart size={48} color="#27272a" />
              <Text className="text-zinc-400 font-semibold text-base mt-4">
                No favorites yet
              </Text>
              <Text className="text-zinc-600 text-xs text-center mt-1">
                Tap the heart icon on any playing track to save it here.
              </Text>
            </>
          ) : (
            <>
              <Music size={48} color="#27272a" />
              <Text className="text-zinc-400 font-semibold text-base mt-4">
                Library is empty
              </Text>
              <Text className="text-zinc-600 text-xs text-center mt-1">
                Save songs or download tracks for offline listening.
              </Text>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={displayTracks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, paddingBottom: 120 }}
          renderItem={({ item }) => {
            const isPlayingThis = currentTrack?.id === item.id;
            const downloaded = isDownloaded(item.id);
            const isFav = favorites.some((f) => f.id === item.id);

            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handlePlay(item)}
                className="flex-row items-center py-3 border-b border-zinc-900"
              >
                {item.artwork ? (
                  <Image
                    source={{ uri: item.artwork }}
                    className="w-12 h-12 rounded-lg bg-zinc-800 mr-3.5 border border-white/5"
                  />
                ) : (
                  <View className="w-12 h-12 rounded-lg bg-zinc-800 mr-3.5 items-center justify-center">
                    <Music size={20} color="#71717a" />
                  </View>
                )}

                <View className="flex-1 mr-3">
                  <Text
                    className={`font-semibold text-sm ${
                      isPlayingThis ? 'text-primary' : 'text-white'
                    }`}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>

                  {/* Subtitle with Spotify Green Arrow if downloaded */}
                  <View className="flex-row items-center mt-1">
                    {downloaded ? (
                      <View className="mr-1.5">
                        <ArrowDownCircle size={13} color="#000000" fill="#22c55e" />
                      </View>
                    ) : null}
                    <Text className="text-zinc-400 text-xs" numberOfLines={1}>
                      {item.artist}
                    </Text>
                  </View>
                </View>

                {/* Right Actions: Favorite Toggle and/or Delete Download */}
                <View className="flex-row items-center space-x-2">
                  <TouchableOpacity
                    onPress={() => toggleFavorite(item)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    className="w-9 h-9 items-center justify-center"
                  >
                    <Heart
                      size={18}
                      color={isFav ? '#ef4444' : '#71717a'}
                      fill={isFav ? '#ef4444' : 'transparent'}
                    />
                  </TouchableOpacity>

                  {downloaded ? (
                    <TouchableOpacity
                      onPress={() => handleRemoveDownload(item)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      className="w-9 h-9 items-center justify-center"
                    >
                      <Trash2 size={16} color="#71717a" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};
