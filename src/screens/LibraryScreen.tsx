import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { Heart, Trash2, Music } from 'lucide-react-native';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { TrackInfo } from '../types';

export const LibraryScreen: React.FC = () => {
  const favorites = useLibraryStore((s) => s.favorites);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  const handlePlay = (track: TrackInfo) => {
    playTrack(track, favorites);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white font-black text-2xl tracking-tight">LIBRARY</Text>
            <Text className="text-zinc-500 text-xs mt-0.5">Saved tracks & favorites</Text>
          </View>
          <View className="px-2.5 py-1 rounded-full bg-zinc-800">
            <Text className="text-zinc-400 font-mono text-xs">{favorites.length} tracks</Text>
          </View>
        </View>
      </View>

      {favorites.length === 0 ? (
        <View className="flex-1 items-center justify-center pb-20 px-6">
          <Heart size={44} color="#27272a" />
          <Text className="text-zinc-400 font-semibold text-base mt-4">No favorites yet</Text>
          <Text className="text-zinc-600 text-xs text-center mt-1">
            Tap the heart icon on any playing track to save it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, paddingBottom: 100 }}
          renderItem={({ item }) => {
            const isPlayingThis = currentTrack?.id === item.id;
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handlePlay(item)}
                className="flex-row items-center py-3 border-b border-zinc-900"
              >
                {item.artwork ? (
                  <Image source={{ uri: item.artwork }} className="w-12 h-12 rounded-lg bg-zinc-800 mr-3.5" />
                ) : (
                  <View className="w-12 h-12 rounded-lg bg-zinc-800 mr-3.5 items-center justify-center">
                    <Music size={20} color="#71717a" />
                  </View>
                )}

                <View className="flex-1 mr-3">
                  <Text
                    className={`font-semibold text-sm ${isPlayingThis ? 'text-primary' : 'text-white'}`}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text className="text-zinc-400 text-xs mt-0.5" numberOfLines={1}>
                    {item.artist}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => toggleFavorite(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="w-10 h-10 items-center justify-center"
                >
                  <Heart size={18} color="#ef4444" fill="#ef4444" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

