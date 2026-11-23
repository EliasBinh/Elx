import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Play,
  Shuffle,
  MoreVertical,
  Trash2,
  Edit2,
  Music,
  Clock,
} from 'lucide-react-native';
import { CoverCollage } from './CoverCollage';
import { usePlaylistStore } from '../../store/playlistStore';
import { usePlayerStore } from '../../store/playerStore';
import { Playlist, TrackInfo } from '../../types';
import { showToast } from '../Toast';

interface PlaylistDetailModalProps {
  visible: boolean;
  playlist: Playlist | null;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function formatTotalTime(tracks: TrackInfo[]): string {
  const totalSec = tracks.reduce((acc, t) => acc + (t.duration || 180), 0);
  const totalMin = Math.round(totalSec / 60);
  if (totalMin >= 60) {
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    return `${hours} hr ${mins} min`;
  }
  return `${totalMin} min`;
}

export const PlaylistDetailModal: React.FC<PlaylistDetailModalProps> = ({
  visible,
  playlist,
  onClose,
}) => {
  const playlists = usePlaylistStore((s) => s.playlists);
  const deletePlaylist = usePlaylistStore((s) => s.deletePlaylist);
  const removeTrackFromPlaylist = usePlaylistStore((s) => s.removeTrackFromPlaylist);

  const playTrack = usePlayerStore((s) => s.playTrack);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  // Sync current playlist from store in case it was updated
  const livePlaylist = playlists.find((p) => p.id === playlist?.id) || playlist;

  if (!livePlaylist) return null;

  const handlePlayAll = () => {
    if (!livePlaylist.tracks || livePlaylist.tracks.length === 0) {
      showToast('Playlist is empty');
      return;
    }
    playTrack(livePlaylist.tracks[0], livePlaylist.tracks);
  };

  const handleShufflePlay = () => {
    if (!livePlaylist.tracks || livePlaylist.tracks.length === 0) {
      showToast('Playlist is empty');
      return;
    }
    const shuffled = [...livePlaylist.tracks].sort(() => Math.random() - 0.5);
    playTrack(shuffled[0], shuffled);
  };

  const handleDeletePlaylist = () => {
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${livePlaylist.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePlaylist(livePlaylist.id);
            showToast('Playlist deleted');
            onClose();
          },
        },
      ]
    );
  };

  const handleRemoveTrack = (track: TrackInfo) => {
    Alert.alert(
      'Remove Track',
      `Remove "${track.title}" from this playlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeTrackFromPlaylist(livePlaylist.id, track.id);
            showToast('Track removed');
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        {/* Top Navigation Bar */}
        <View className="flex-row items-center justify-between px-4 py-2 border-b border-zinc-900">
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="w-10 h-10 items-center justify-center rounded-full bg-zinc-900"
          >
            <ArrowLeft size={20} color="#ffffff" />
          </TouchableOpacity>

          <Text className="text-zinc-400 font-bold text-xs uppercase tracking-wider" numberOfLines={1}>
            Playlist
          </Text>

          <TouchableOpacity
            onPress={handleDeletePlaylist}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="w-10 h-10 items-center justify-center rounded-full bg-zinc-900"
          >
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Hero Banner Header */}
        <View className="items-center px-6 pt-5 pb-4">
          <CoverCollage
            urls={livePlaylist.coverUrls}
            size={160}
            borderRadius={20}
            className="shadow-2xl shadow-black mb-4"
          />

          <Text className="text-white font-black text-2xl text-center" numberOfLines={2}>
            {livePlaylist.title}
          </Text>

          {!!livePlaylist.description && (
            <Text className="text-zinc-400 text-xs text-center mt-1 px-4" numberOfLines={2}>
              {livePlaylist.description}
            </Text>
          )}

          <Text className="text-zinc-500 text-xs font-medium mt-1">
            {livePlaylist.tracks.length} {livePlaylist.tracks.length === 1 ? 'song' : 'songs'} •{' '}
            {formatTotalTime(livePlaylist.tracks)}
          </Text>

          {/* Action Play & Shuffle Buttons */}
          <View className="flex-row items-center mt-4 space-x-3">
            <TouchableOpacity
              onPress={handlePlayAll}
              activeOpacity={0.8}
              className="flex-row items-center bg-white px-6 py-2.5 rounded-full shadow-lg"
            >
              <Play size={18} color="#000000" fill="#000000" className="mr-2" />
              <Text className="text-black font-extrabold text-sm">Play</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShufflePlay}
              activeOpacity={0.8}
              className="flex-row items-center bg-zinc-900 border border-zinc-800 px-5 py-2.5 rounded-full ml-3"
            >
              <Shuffle size={18} color="#ffffff" className="mr-2" />
              <Text className="text-white font-bold text-sm">Shuffle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Track List */}
        <FlatList
          data={livePlaylist.tracks}
          keyExtractor={(item, index) => `${item.id}_${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-16 px-6">
              <View className="w-16 h-16 rounded-full bg-zinc-900 items-center justify-center mb-3">
                <Music size={28} color="#71717a" />
              </View>
              <Text className="text-white font-bold text-base text-center mb-1">
                This playlist is empty
              </Text>
              <Text className="text-zinc-500 text-xs text-center">
                Search songs and tap the playlist icon to add them here.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isCurrent = currentTrack?.id === item.id;
            return (
              <TouchableOpacity
                onPress={() => playTrack(item, livePlaylist.tracks)}
                activeOpacity={0.7}
                className={`flex-row items-center py-3 px-3 rounded-2xl mb-1 ${
                  isCurrent ? 'bg-zinc-900/90 border border-zinc-800' : 'active:bg-zinc-900/40'
                }`}
              >
                <Text className="w-6 text-zinc-500 font-mono text-xs text-center mr-2">
                  {index + 1}
                </Text>

                {item.artwork ? (
                  <Image
                    source={{ uri: item.artwork }}
                    className="w-11 h-11 rounded-xl bg-zinc-800 mr-3"
                  />
                ) : (
                  <View className="w-11 h-11 rounded-xl bg-zinc-800 mr-3 items-center justify-center">
                    <Music size={16} color="#71717a" />
                  </View>
                )}

                <View className="flex-1 mr-2">
                  <Text
                    className={`font-semibold text-sm ${
                      isCurrent ? 'text-emerald-400 font-bold' : 'text-white'
                    }`}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text className="text-zinc-400 text-xs mt-0.5" numberOfLines={1}>
                    {item.artist}
                  </Text>
                </View>

                <Text className="text-zinc-500 font-mono text-xs mr-3">
                  {formatDuration(item.duration || 180)}
                </Text>

                <TouchableOpacity
                  onPress={() => handleRemoveTrack(item)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  className="p-1"
                >
                  <Trash2 size={16} color="#71717a" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
};

