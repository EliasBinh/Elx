import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useProgress } from 'react-native-track-player';
import { Play, Pause, SkipForward } from 'lucide-react-native';
import { usePlayerStore } from '../../store/playerStore';

interface MiniPlayerProps {
  onPress: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onPress }) => {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
  const skipNext = usePlayerStore((s) => s.skipNext);
  const { position, duration } = useProgress(500);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="bg-card/95 border-t border-zinc-800/80 px-4 py-2.5 flex-row items-center justify-between"
    >
      {/* Top progress indicator line */}
      <View
        className="absolute top-0 left-0 h-[2px] bg-primary"
        style={{ width: `${progressPercent}%` }}
      />

      <View className="flex-row items-center flex-1 mr-3">
        {currentTrack.artwork ? (
          <Image
            source={{ uri: currentTrack.artwork }}
            className="w-12 h-12 rounded-lg bg-zinc-800 mr-3"
          />
        ) : (
          <View className="w-12 h-12 rounded-lg bg-zinc-800 mr-3 items-center justify-center">
            <Text className="text-zinc-500 text-xs">OG</Text>
          </View>
        )}
        <View className="flex-1 justify-center">
          <Text className="text-white font-semibold text-sm" numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text className="text-zinc-400 text-xs mt-0.5" numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center space-x-2">
        <TouchableOpacity
          onPress={togglePlayPause}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="w-10 h-10 items-center justify-center rounded-full bg-white/10"
        >
          {isPlaying ? (
            <Pause size={18} color="#ffffff" fill="#ffffff" />
          ) : (
            <Play size={18} color="#ffffff" fill="#ffffff" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={skipNext}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="w-10 h-10 items-center justify-center"
        >
          <SkipForward size={20} color="#a1a1aa" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

