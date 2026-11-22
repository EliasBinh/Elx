import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { useProgress } from 'react-native-track-player';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Heart,
  FileText,
} from 'lucide-react-native';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { SyncedLyricsView } from '../components/lyrics/SyncedLyricsView';
import { PlaybackMode } from '../types';

const { width } = Dimensions.get('window');

interface PlayerScreenProps {
  onClose: () => void;
}

export const PlayerScreen: React.FC<PlayerScreenProps> = ({ onClose }) => {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playbackMode = usePlayerStore((s) => s.playbackMode);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
  const skipNext = usePlayerStore((s) => s.skipNext);
  const skipPrevious = usePlayerStore((s) => s.skipPrevious);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const setPlaybackMode = usePlayerStore((s) => s.setPlaybackMode);

  const favorites = useLibraryStore((s) => s.favorites);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  const [showLyrics, setShowLyrics] = useState(false);
  const { position, duration } = useProgress(500);

  if (!currentTrack) return null;

  const isFav = favorites.some((f) => f.id === currentTrack.id);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const cyclePlaybackMode = () => {
    const modes: PlaybackMode[] = ['repeat-all', 'repeat-one', 'shuffle', 'repeat-off'];
    const nextIdx = (modes.indexOf(playbackMode) + 1) % modes.length;
    setPlaybackMode(modes[nextIdx]);
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View className="flex-1 bg-background">
      {/* Background Album Art (Full bleed blur overlay) */}
      {currentTrack.artwork ? (
        <Image
          source={{ uri: currentTrack.artwork }}
          style={StyleSheet.absoluteFillObject}
          blurRadius={70}
          className="opacity-30"
        />
      ) : null}
      <View style={StyleSheet.absoluteFillObject} className="bg-black/60" />

      <SafeAreaView className="flex-1 justify-between px-6 py-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mt-2">
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
          >
            <ChevronDown size={22} color="#ffffff" />
          </TouchableOpacity>

          <Text className="text-zinc-400 font-semibold text-xs tracking-widest uppercase">
            {showLyrics ? 'Lyrics' : 'Now Playing'}
          </Text>

          <TouchableOpacity
            onPress={() => setShowLyrics(!showLyrics)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              showLyrics ? 'bg-primary' : 'bg-white/10'
            }`}
          >
            <FileText size={18} color={showLyrics ? '#000000' : '#ffffff'} />
          </TouchableOpacity>
        </View>

        {/* Center: Artwork OR Synced Lyrics */}
        <View className="flex-1 items-center justify-center my-6">
          {showLyrics ? (
            <View className="flex-1 w-full">
              <SyncedLyricsView />
            </View>
          ) : (
            <View className="items-center justify-center">
              {currentTrack.artwork ? (
                <Image
                  source={{ uri: currentTrack.artwork }}
                  style={{ width: width * 0.8, height: width * 0.8 }}
                  className="rounded-3xl shadow-2xl bg-zinc-900 border border-white/10"
                />
              ) : (
                <View
                  style={{ width: width * 0.8, height: width * 0.8 }}
                  className="rounded-3xl bg-zinc-900 items-center justify-center border border-white/10"
                >
                  <Text className="text-zinc-600 font-bold text-4xl">LINER</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Bottom Metadata & Controls */}
        <View className="mb-6">
          {/* Track Info & Favorite Heart */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1 mr-4">
              <Text className="text-white font-bold text-2xl" numberOfLines={1}>
                {currentTrack.title}
              </Text>
              <Text className="text-zinc-400 text-base mt-1" numberOfLines={1}>
                {currentTrack.artist}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => toggleFavorite(currentTrack)}
              className="w-11 h-11 items-center justify-center"
            >
              <Heart
                size={24}
                color={isFav ? '#ef4444' : '#71717a'}
                fill={isFav ? '#ef4444' : 'transparent'}
              />
            </TouchableOpacity>
          </View>

          {/* Scrubber Progress Bar */}
          <View className="my-2">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={(e) => {
                const { locationX } = e.nativeEvent;
                const barWidth = width - 48; // px-6 is 24 on each side
                const seekFraction = Math.max(0, Math.min(1, locationX / barWidth));
                seekTo(seekFraction * duration);
              }}
              className="h-6 justify-center"
            >
              <View className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <View
                  className="h-full bg-white rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </View>
            </TouchableOpacity>

            <View className="flex-row justify-between mt-1">
              <Text className="text-zinc-500 text-xs">{formatTime(position)}</Text>
              <Text className="text-zinc-500 text-xs">
                {duration > 0 ? formatTime(duration) : '--:--'}
              </Text>
            </View>
          </View>

          {/* Media Controls */}
          <View className="flex-row items-center justify-between mt-4 px-2">
            {/* Playback Mode (Shuffle / Repeat) */}
            <TouchableOpacity
              onPress={cyclePlaybackMode}
              className="w-10 h-10 items-center justify-center"
            >
              {playbackMode === 'repeat-one' ? (
                <Repeat1 size={20} color="#38bdf8" />
              ) : playbackMode === 'shuffle' ? (
                <Shuffle size={20} color="#38bdf8" />
              ) : playbackMode === 'repeat-all' ? (
                <Repeat size={20} color="#38bdf8" />
              ) : (
                <Repeat size={20} color="#71717a" />
              )}
            </TouchableOpacity>

            {/* Skip Previous */}
            <TouchableOpacity
              onPress={skipPrevious}
              className="w-12 h-12 items-center justify-center"
            >
              <SkipBack size={26} color="#ffffff" />
            </TouchableOpacity>

            {/* Play / Pause Main Button */}
            <TouchableOpacity
              onPress={togglePlayPause}
              className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-white items-center justify-center shadow-lg"
            >
              {isPlaying ? (
                <Pause size={28} color="#000000" fill="#000000" />
              ) : (
                <Play size={28} color="#000000" fill="#000000" className="ml-1" />
              )}
            </TouchableOpacity>

            {/* Skip Next */}
            <TouchableOpacity
              onPress={skipNext}
              className="w-12 h-12 items-center justify-center"
            >
              <SkipForward size={26} color="#ffffff" />
            </TouchableOpacity>

            {/* Filler for symmetrical balance */}
            <View className="w-10 h-10" />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};
