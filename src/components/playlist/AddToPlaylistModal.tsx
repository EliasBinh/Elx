import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { X, Plus, Search, Check } from 'lucide-react-native';
import { usePlaylistStore } from '../../store/playlistStore';
import { CoverCollage } from './CoverCollage';
import { showToast } from '../Toast';
import { TrackInfo, Playlist } from '../../types';

interface AddToPlaylistModalProps {
  visible: boolean;
  track: TrackInfo | null;
  onClose: () => void;
  onRequestCreate?: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  visible,
  track,
  onClose,
  onRequestCreate,
}) => {
  const [search, setSearch] = useState('');
  const playlists = usePlaylistStore((s) => s.playlists);
  const addTrackToPlaylist = usePlaylistStore((s) => s.addTrackToPlaylist);

  const filteredPlaylists = useMemo(() => {
    if (!search.trim()) return playlists;
    const q = search.toLowerCase().trim();
    return playlists.filter((p) => p.title.toLowerCase().includes(q));
  }, [playlists, search]);

  if (!track) return null;

  const handleSelectPlaylist = async (playlist: Playlist) => {
    const res = await addTrackToPlaylist(playlist.id, track);
    if (res.alreadyExists) {
      showToast(`Already in "${playlist.title}"`);
    } else if (res.success) {
      showToast(`Added to "${playlist.title}"`);
      onClose();
    } else {
      showToast('Failed to add track');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-card border-t border-zinc-800 rounded-t-3xl p-5 max-h-[80%]">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white font-extrabold text-lg">Add to Playlist</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center"
            >
              <X size={18} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          {/* Target Track Preview Header */}
          <View className="flex-row items-center bg-zinc-900/90 rounded-2xl p-2.5 mb-4 border border-zinc-800">
            {track.artwork ? (
              <Image
                source={{ uri: track.artwork }}
                className="w-12 h-12 rounded-xl bg-zinc-800 mr-3"
              />
            ) : (
              <View className="w-12 h-12 rounded-xl bg-zinc-800 mr-3 items-center justify-center">
                <Text className="text-zinc-600 font-bold text-xs">ELX</Text>
              </View>
            )}
            <View className="flex-1 mr-2">
              <Text className="text-white font-bold text-sm" numberOfLines={1}>
                {track.title}
              </Text>
              <Text className="text-zinc-400 text-xs" numberOfLines={1}>
                {track.artist}
              </Text>
            </View>
          </View>

          {/* Quick "+ New Playlist" action */}
          <TouchableOpacity
            onPress={() => {
              onClose();
              onRequestCreate?.();
            }}
            activeOpacity={0.7}
            className="flex-row items-center py-3 px-2 rounded-xl bg-emerald-950/30 border border-emerald-500/20 mb-3"
          >
            <View className="w-10 h-10 rounded-xl bg-emerald-600/20 items-center justify-center mr-3">
              <Plus size={20} color="#22c55e" />
            </View>
            <Text className="text-emerald-400 font-bold text-sm">New Playlist</Text>
          </TouchableOpacity>

          {/* Search Playlists */}
          {playlists.length > 3 && (
            <View className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 mb-3">
              <Search size={16} color="#71717a" className="mr-2" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Find a playlist..."
                placeholderTextColor="#71717a"
                className="flex-1 text-white text-xs py-0.5"
              />
            </View>
          )}

          {/* List of Playlists */}
          <FlatList
            data={filteredPlaylists}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-8">
                <Text className="text-zinc-500 text-xs">
                  {playlists.length === 0
                    ? 'No playlists yet. Create one above!'
                    : 'No matching playlists'}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const inPlaylist = item.tracks.some((t) => t.id === track.id);
              return (
                <TouchableOpacity
                  onPress={() => handleSelectPlaylist(item)}
                  activeOpacity={0.7}
                  className="flex-row items-center py-2.5 px-2 rounded-xl active:bg-zinc-800/50"
                >
                  <CoverCollage urls={item.coverUrls} size={46} borderRadius={10} className="mr-3" />
                  <View className="flex-1 mr-2">
                    <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-zinc-500 text-xs">
                      {item.tracks.length} {item.tracks.length === 1 ? 'song' : 'songs'}
                    </Text>
                  </View>
                  {inPlaylist && <Check size={18} color="#22c55e" />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

