import React, { useState, useEffect } from 'react';
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
  Plus,
  Link,
  ListMusic,
  ChevronRight,
} from 'lucide-react-native';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { useDownloadStore } from '../store/downloadStore';
import { usePlaylistStore } from '../store/playlistStore';
import { CoverCollage } from '../components/playlist/CoverCollage';
import { CreatePlaylistModal } from '../components/playlist/CreatePlaylistModal';
import { PlaylistDetailModal } from '../components/playlist/PlaylistDetailModal';
import { TrackInfo, Playlist } from '../types';

export const LibraryScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'playlists' | 'favorites' | 'downloaded' | 'all'>('playlists');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const favorites = useLibraryStore((s) => s.favorites);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  const downloads = useDownloadStore((s) => s.downloads);
  const isDownloaded = useDownloadStore((s) => s.isDownloaded);
  const removeDownload = useDownloadStore((s) => s.removeDownload);
  const isOfflineOnly = useDownloadStore((s) => s.isOfflineOnly);
  const toggleOfflineOnly = useDownloadStore((s) => s.toggleOfflineOnly);

  const playlists = usePlaylistStore((s) => s.playlists);
  const loadPlaylists = usePlaylistStore((s) => s.loadPlaylists);
  const deletePlaylist = usePlaylistStore((s) => s.deletePlaylist);

  const playTrack = usePlayerStore((s) => s.playTrack);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  useEffect(() => {
    loadPlaylists();
  }, []);

  // Compute display tracks for non-playlist tabs
  let displayTracks: TrackInfo[] = [];
  if (activeTab === 'downloaded') {
    displayTracks = downloads;
  } else if (activeTab === 'favorites') {
    displayTracks = favorites;
  } else if (activeTab === 'all') {
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

  const handleDeletePlaylist = (playlist: Playlist) => {
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlist.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePlaylist(playlist.id),
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
              {playlists.length} playlists • {favorites.length} favorites • {downloads.length} downloaded
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

        {/* Filter Pills (Playlists | Favorites | Downloaded | All) */}
        <View className="flex-row space-x-2 my-1">
          <TouchableOpacity
            onPress={() => setActiveTab('playlists')}
            className={`flex-row items-center px-3.5 py-1.5 rounded-full ${
              activeTab === 'playlists' ? 'bg-white' : 'bg-card border border-zinc-800'
            }`}
          >
            <ListMusic
              size={13}
              color={activeTab === 'playlists' ? '#000000' : '#a1a1aa'}
              className="mr-1.5"
            />
            <Text
              className={`text-xs font-bold ${
                activeTab === 'playlists' ? 'text-black' : 'text-zinc-400'
              }`}
            >
              Playlists ({playlists.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('favorites')}
            className={`flex-row items-center px-3.5 py-1.5 rounded-full ${
              activeTab === 'favorites' ? 'bg-white' : 'bg-card border border-zinc-800'
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

          <TouchableOpacity
            onPress={() => setActiveTab('downloaded')}
            className={`flex-row items-center px-3.5 py-1.5 rounded-full ${
              activeTab === 'downloaded' ? 'bg-white' : 'bg-card border border-zinc-800'
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
              Downloads ({downloads.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab: PLAYLISTS */}
      {activeTab === 'playlists' ? (
        <View className="flex-1 px-5 pt-2">
          {/* Action Row: + New Playlist & Import */}
          <View className="flex-row items-center justify-between mb-3">
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.8}
              className="flex-1 flex-row items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 mr-2"
            >
              <Plus size={16} color="#ffffff" className="mr-1.5" />
              <Text className="text-white font-bold text-xs">New Playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.8}
              className="flex-1 flex-row items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 ml-2"
            >
              <Link size={16} color="#38bdf8" className="mr-1.5" />
              <Text className="text-sky-400 font-bold text-xs">Import Link</Text>
            </TouchableOpacity>
          </View>

          {/* Playlist Cards List */}
          <FlatList
            data={playlists}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-20 px-6">
                <View className="w-16 h-16 rounded-full bg-zinc-900 items-center justify-center mb-3">
                  <ListMusic size={32} color="#71717a" />
                </View>
                <Text className="text-white font-bold text-base text-center mb-1">
                  No playlists yet
                </Text>
                <Text className="text-zinc-500 text-xs text-center mb-5">
                  Create your own playlists or import public playlists from YouTube.
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCreateModal(true)}
                  className="bg-white px-5 py-2.5 rounded-full"
                >
                  <Text className="text-black font-extrabold text-xs">+ Create Playlist</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedPlaylist(item)}
                onLongPress={() => handleDeletePlaylist(item)}
                activeOpacity={0.7}
                className="flex-row items-center py-3 border-b border-zinc-900/80 active:bg-zinc-900/40"
              >
                <CoverCollage
                  urls={item.coverUrls}
                  size={54}
                  borderRadius={12}
                  className="mr-3.5 shadow-md shadow-black"
                />

                <View className="flex-1 mr-2">
                  <Text className="text-white font-bold text-sm" numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text className="text-zinc-500 text-xs mt-0.5" numberOfLines={1}>
                    {item.tracks.length} {item.tracks.length === 1 ? 'track' : 'tracks'}
                    {item.description ? ` • ${item.description}` : ''}
                  </Text>
                </View>

                <ChevronRight size={18} color="#71717a" />
              </TouchableOpacity>
            )}
          />
        </View>
      ) : displayTracks.length === 0 ? (
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
          ) : (
            <>
              <Heart size={48} color="#27272a" />
              <Text className="text-zinc-400 font-semibold text-base mt-4">
                No favorites yet
              </Text>
              <Text className="text-zinc-600 text-xs text-center mt-1">
                Tap the heart icon on any playing track to save it here.
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

      {/* Create / Import Playlist Modal */}
      <CreatePlaylistModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(pl) => setSelectedPlaylist(pl)}
      />

      {/* Playlist Detail Modal */}
      <PlaylistDetailModal
        visible={!!selectedPlaylist}
        playlist={selectedPlaylist}
        onClose={() => setSelectedPlaylist(null)}
      />
    </SafeAreaView>
  );
};
