import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useProgress } from 'react-native-track-player';
import { Play, Pause, SkipBack, SkipForward, Heart, FileText } from 'lucide-react-native';
import { usePlayerStore } from '../../store/playerStore';
import { useLibraryStore } from '../../store/libraryStore';

interface MiniPlayerProps {
  onPress: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onPress }) => {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
  const skipNext = usePlayerStore((s) => s.skipNext);
  const skipPrevious = usePlayerStore((s) => s.skipPrevious);

  const favorites = useLibraryStore((s) => s.favorites);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  const { position, duration } = useProgress(500);

  if (!currentTrack) return null;

  const isFav = favorites.some((f) => f.id === currentTrack.id);
  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      className="bg-[#121214] border-t border-zinc-800/80 px-3.5 py-2.5 flex-row items-center justify-between"
    >
      {/* Top micro progress line */}
      <View
        className="absolute top-0 left-0 h-[2px] bg-white/90"
        style={{ width: `${progressPercent}%` }}
      />

      {/* Left: Thumbnail + Title/Artist + Heart */}
      <View className="flex-row items-center flex-1 mr-3">
        {currentTrack.artwork ? (
          <Image
            source={{ uri: currentTrack.artwork }}
            className="w-11 h-11 rounded-lg bg-zinc-800 mr-2.5 border border-white/5"
          />
        ) : (
          <View className="w-11 h-11 rounded-lg bg-zinc-800 mr-2.5 items-center justify-center">
            <Text className="text-zinc-500 text-xs font-bold">ELX</Text>
          </View>
        )}

        <View className="flex-1 justify-center mr-1">
          <Text className="text-white font-semibold text-xs" numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text className="text-zinc-400 text-[11px] mt-0.5" numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => toggleFavorite(currentTrack)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="w-8 h-8 items-center justify-center"
        >
          <Heart
            size={16}
            color={isFav ? '#ef4444' : '#71717a'}
            fill={isFav ? '#ef4444' : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      {/* Center & Right: Previous, Play/Pause in white circle, Next, Lyrics */}
      <View className="flex-row items-center space-x-2">
        <TouchableOpacity
          onPress={skipPrevious}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="w-8 h-8 items-center justify-center"
        >
          <SkipBack size={18} color="#ffffff" fill="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={togglePlayPause}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="w-9 h-9 items-center justify-center rounded-full bg-white shadow-md active:opacity-80"
        >
          {isPlaying ? (
            <Pause size={17} color="#000000" fill="#000000" />
          ) : (
            <Play size={17} color="#000000" fill="#000000" className="ml-0.5" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={skipNext}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="w-8 h-8 items-center justify-center"
        >
          <SkipForward size={18} color="#ffffff" fill="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="w-8 h-8 items-center justify-center ml-0.5"
        >
          <FileText size={17} color="#a1a1aa" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};
