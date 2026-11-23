import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
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
  MoreVertical,
  Cast,
  Share2,
  ListMusic,
  ListPlus,
  ArrowUpRight,
  Sparkles,
  Trash2,
  X,
  Volume2,
  ArrowDownCircle,
} from 'lucide-react-native';
import { ActivityIndicator, Alert } from 'react-native';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { useDownloadStore } from '../store/downloadStore';
import { SyncedLyricsView } from '../components/lyrics/SyncedLyricsView';
import { AddToPlaylistModal } from '../components/playlist/AddToPlaylistModal';
import { CreatePlaylistModal } from '../components/playlist/CreatePlaylistModal';
import { PlaybackMode, TrackInfo } from '../types';

const { width } = Dimensions.get('window');

interface PlayerScreenProps {
  onClose: () => void;
}

export const PlayerScreen: React.FC<PlayerScreenProps> = ({ onClose }) => {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playbackMode = usePlayerStore((s) => s.playbackMode);
  const lyrics = usePlayerStore((s) => s.lyrics);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
  const skipNext = usePlayerStore((s) => s.skipNext);
  const skipPrevious = usePlayerStore((s) => s.skipPrevious);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const setPlaybackMode = usePlayerStore((s) => s.setPlaybackMode);
  const playTrack = usePlayerStore((s) => s.playTrack);

  const favorites = useLibraryStore((s) => s.favorites);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  const isDownloaded = useDownloadStore((s) => s.isDownloaded);
  const isDownloading = useDownloadStore((s) => s.isDownloading);
  const downloadTrack = useDownloadStore((s) => s.downloadTrack);
  const removeDownload = useDownloadStore((s) => s.removeDownload);

  const [showFullWordly, setShowFullWordly] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);

  const { position, duration } = useProgress(200);

  if (!currentTrack) return null;

  const isFav = favorites.some((f) => f.id === currentTrack.id);
  const isDownloadedThis = isDownloaded(currentTrack.id);
  const isDownloadingThis = isDownloading(currentTrack.id);

  const handleDownloadToggle = () => {
    if (isDownloadedThis) {
      Alert.alert(
        'Remove Download',
        `Remove "${currentTrack.title}" from your downloaded tracks?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => removeDownload(currentTrack.id),
          },
        ]
      );
    } else {
      downloadTrack(currentTrack);
    }
  };

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
  const currentMs = position * 1000;

  // Determine active lyrics line index for live preview card
  let activeIndex = -1;
  const lyricLines = lyrics?.lines || [];
  if (lyricLines.length > 0) {
    for (let i = 0; i < lyricLines.length; i++) {
      const line = lyricLines[i];
      if (currentMs >= line.startTimeMs && currentMs < line.endTimeMs) {
        activeIndex = i;
        break;
      }
    }
    if (activeIndex === -1 && currentMs > (lyricLines[lyricLines.length - 1]?.endTimeMs || 0)) {
      activeIndex = lyricLines.length - 1;
    }
  }

  // Get 4 lines around the active line for preview
  const previewStart = Math.max(0, activeIndex >= 0 ? activeIndex - 1 : 0);
  const previewLines = lyricLines.slice(previewStart, previewStart + 4);
  const hasLyrics = lyricLines.length > 0;

  return (
    <View className="flex-1 bg-[#09090b]">
      {/* Dynamic blurred artwork backdrop */}
      {currentTrack.artwork ? (
        <Image
          source={{ uri: currentTrack.artwork }}
          style={StyleSheet.absoluteFillObject}
          blurRadius={80}
          className="opacity-40"
        />
      ) : null}
      <View style={StyleSheet.absoluteFillObject} className="bg-black/65" />

      <SafeAreaView className="flex-1">
        {showFullWordly ? (
          /* Liner-Style Full Screen Wordly (Lyrics) Mode */
          <View className="flex-1 px-5 pt-2">
            <View className="flex-row items-center justify-between py-2 border-b border-white/10 pb-3">
              <TouchableOpacity
                onPress={() => setShowFullWordly(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
              >
                <ChevronDown size={22} color="#ffffff" />
              </TouchableOpacity>

              <View className="flex-row items-center">
                <Sparkles size={16} color="#38bdf8" className="mr-1.5" />
                <Text className="text-white font-bold text-base">Wordly</Text>
                <Text className="text-zinc-500 text-xs ml-2 font-mono">0.0s</Text>
              </View>

              <View className="w-10" />
            </View>

            <View className="flex-1 mt-2">
              <SyncedLyricsView />
            </View>
          </View>
        ) : (
          /* Liner-Inspired Mobile Player Screen */
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 60 }}
          >
            {/* Header: Down Chevron + Playing From Album + More */}
            <View className="flex-row items-center justify-between mb-6">
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                className="w-10 h-10 items-center justify-center -ml-2"
              >
                <ChevronDown size={26} color="#ffffff" />
              </TouchableOpacity>

              <View className="items-center flex-1 mx-3">
                <Text className="text-zinc-400 font-bold text-[11px] tracking-wider uppercase">
                  PLAYING FROM ALBUM
                </Text>
                <Text className="text-white font-bold text-sm mt-0.5" numberOfLines={1}>
                  {currentTrack.album || currentTrack.title}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowAddToPlaylist(true)}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                className="w-10 h-10 items-center justify-center -mr-2"
              >
                <MoreVertical size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Album Artwork Canvas */}
            <View className="items-center justify-center my-4">
              {currentTrack.artwork ? (
                <Image
                  source={{ uri: currentTrack.artwork }}
                  style={{ width: width * 0.86, height: width * 0.86 }}
                  className="rounded-2xl shadow-2xl bg-zinc-900 border border-white/10"
                />
              ) : (
                <View
                  style={{ width: width * 0.86, height: width * 0.86 }}
                  className="rounded-2xl bg-zinc-900 items-center justify-center border border-white/10"
                >
                  <Text className="text-zinc-600 font-extrabold text-4xl">ELX</Text>
                </View>
              )}
            </View>

            {/* Title, Artist & Heart Favorite */}
            <View className="flex-row items-center justify-between mt-6 mb-4">
              <View className="flex-1 mr-4">
                <Text className="text-white font-extrabold text-2xl" numberOfLines={1}>
                  {currentTrack.title}
                </Text>
                <Text className="text-zinc-400 text-base font-medium mt-1" numberOfLines={1}>
                  {currentTrack.artist}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => toggleFavorite(currentTrack)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                className="w-11 h-11 items-center justify-center"
              >
                <Heart
                  size={26}
                  color={isFav ? '#22c55e' : '#ffffff'}
                  fill={isFav ? '#22c55e' : 'transparent'}
                />
              </TouchableOpacity>
            </View>

            {/* Liner Timeline Scrubber Slider */}
            <View className="my-2">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={(e) => {
                  const { locationX } = e.nativeEvent;
                  const barWidth = width - 48;
                  const seekFraction = Math.max(0, Math.min(1, locationX / barWidth));
                  seekTo(seekFraction * duration);
                }}
                className="h-6 justify-center"
              >
                <View className="h-1 bg-white/20 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-white rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </View>
              </TouchableOpacity>

              <View className="flex-row justify-between mt-1">
                <Text className="text-zinc-400 text-xs font-mono">{formatTime(position)}</Text>
                <Text className="text-zinc-400 text-xs font-mono">
                  {duration > 0 ? formatTime(duration) : '--:--'}
                </Text>
              </View>
            </View>

            {/* Transport Media Controls */}
            <View className="flex-row items-center justify-between mt-4 px-1">
              {/* Shuffle Toggle */}
              <TouchableOpacity
                onPress={cyclePlaybackMode}
                className="w-10 h-10 items-center justify-center"
              >
                <Shuffle
                  size={22}
                  color={playbackMode === 'shuffle' ? '#22c55e' : '#a1a1aa'}
                />
              </TouchableOpacity>

              {/* Skip Previous */}
              <TouchableOpacity
                onPress={skipPrevious}
                className="w-12 h-12 items-center justify-center"
              >
                <SkipBack size={28} color="#ffffff" fill="#ffffff" />
              </TouchableOpacity>

              {/* Main Play / Pause Circle */}
              <TouchableOpacity
                onPress={togglePlayPause}
                activeOpacity={0.85}
                className="w-[72px] h-[72px] rounded-full bg-white items-center justify-center shadow-2xl active:scale-95"
              >
                {isPlaying ? (
                  <Pause size={30} color="#000000" fill="#000000" />
                ) : (
                  <Play size={30} color="#000000" fill="#000000" className="ml-1" />
                )}
              </TouchableOpacity>

              {/* Skip Next */}
              <TouchableOpacity
                onPress={skipNext}
                className="w-12 h-12 items-center justify-center"
              >
                <SkipForward size={28} color="#ffffff" fill="#ffffff" />
              </TouchableOpacity>

              {/* Repeat Mode */}
              <TouchableOpacity
                onPress={cyclePlaybackMode}
                className="w-10 h-10 items-center justify-center"
              >
                {playbackMode === 'repeat-one' ? (
                  <Repeat1 size={22} color="#22c55e" />
                ) : playbackMode === 'repeat-all' ? (
                  <Repeat size={22} color="#22c55e" />
                ) : (
                  <Repeat size={22} color="#a1a1aa" />
                )}
              </TouchableOpacity>
            </View>

            {/* Liner-Style Auxiliary Toolbar: Add to Playlist, Download, Share, Queue, Wordly */}
            <View className="flex-row items-center justify-between mt-6 px-1">
              <TouchableOpacity
                onPress={() => setShowAddToPlaylist(true)}
                className="w-10 h-10 items-center justify-center"
              >
                <ListPlus size={22} color="#ffffff" />
              </TouchableOpacity>

              <View className="flex-row items-center space-x-3">
                {/* Spotify-Style Offline Download Button */}
                <TouchableOpacity
                  onPress={handleDownloadToggle}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  className="w-10 h-10 items-center justify-center"
                >
                  {isDownloadingThis ? (
                    <ActivityIndicator size="small" color="#22c55e" />
                  ) : isDownloadedThis ? (
                    <ArrowDownCircle size={22} color="#000000" fill="#22c55e" />
                  ) : (
                    <ArrowDownCircle size={22} color="#a1a1aa" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowQueueModal(true)}
                  className="w-10 h-10 items-center justify-center"
                >
                  <ListMusic size={22} color="#ffffff" />
                </TouchableOpacity>

                <TouchableOpacity className="w-10 h-10 items-center justify-center">
                  <Share2 size={20} color="#a1a1aa" />
                </TouchableOpacity>
              </View>
            </View>

            {/* LINER-STYLE IN-PLAYER WORDLY / LYRICS PREVIEW CARD */}
            {/* Auto-hide if track has no lyrics! */}
            {hasLyrics ? (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setShowFullWordly(true)}
                className="mt-8 rounded-3xl bg-[#1e3a8a]/80 border border-blue-400/20 p-5 shadow-2xl"
              >
                {/* Header */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Sparkles size={16} color="#38bdf8" className="mr-1.5" />
                    <Text className="text-white font-bold text-base">Lyrics Preview</Text>
                  </View>
                  <ArrowUpRight size={18} color="#ffffff" />
                </View>

                {/* Live Synced Lyric Lines */}
                <View className="my-2 space-y-1">
                  {previewLines.map((line, idx) => {
                    const isLineActive = previewStart + idx === activeIndex;
                    return (
                      <Text
                        key={line.id || idx}
                        numberOfLines={2}
                        className={`leading-snug ${
                          isLineActive
                            ? 'text-white font-extrabold text-xl py-1'
                            : 'text-white/60 font-semibold text-base py-0.5'
                        }`}
                      >
                        {line.text}
                      </Text>
                    );
                  })}
                </View>

                {/* Pill Button: Show Lyrics */}
                <View className="self-start mt-4">
                  <View className="px-5 py-2 rounded-full bg-white shadow">
                    <Text className="text-black font-bold text-sm">
                      Show Lyrics
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Liner-Style Queue Modal */}
      <Modal
        visible={showQueueModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQueueModal(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View className="h-[80%] bg-[#121214] rounded-t-3xl border-t border-zinc-800 p-5">
            {/* Queue Header */}
            <View className="flex-row items-center justify-between pb-4 border-b border-zinc-800">
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => setShowQueueModal(false)}
                  className="w-8 h-8 items-center justify-center mr-2"
                >
                  <ChevronDown size={22} color="#ffffff" />
                </TouchableOpacity>
                <View>
                  <Text className="text-white font-bold text-lg">Queue</Text>
                  <Text className="text-zinc-400 text-xs">{queue.length} tracks</Text>
                </View>
              </View>

              <View className="flex-row items-center space-x-2">
                <TouchableOpacity
                  onPress={cyclePlaybackMode}
                  className="w-8 h-8 items-center justify-center"
                >
                  <Shuffle
                    size={18}
                    color={playbackMode === 'shuffle' ? '#22c55e' : '#a1a1aa'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowQueueModal(false)}
                  className="w-8 h-8 items-center justify-center"
                >
                  <X size={20} color="#a1a1aa" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Track List */}
            <FlatList
              data={queue}
              keyExtractor={(item, index) => `${item.id}_${index}`}
              contentContainerStyle={{ paddingVertical: 12, paddingBottom: 40 }}
              renderItem={({ item, index }) => {
                const isCurrent = index === queueIndex || item.id === currentTrack.id;
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      playTrack(item, queue);
                      setShowQueueModal(false);
                    }}
                    className={`flex-row items-center p-2.5 rounded-xl my-0.5 ${
                      isCurrent ? 'bg-white/10' : ''
                    }`}
                  >
                    {item.artwork ? (
                      <Image
                        source={{ uri: item.artwork }}
                        className="w-11 h-11 rounded-lg bg-zinc-800 mr-3"
                      />
                    ) : (
                      <View className="w-11 h-11 rounded-lg bg-zinc-800 mr-3 items-center justify-center">
                        <Text className="text-zinc-600 text-xs font-bold">ELX</Text>
                      </View>
                    )}

                    <View className="flex-1 mr-2">
                      <Text
                        className={`font-semibold text-sm ${
                          isCurrent ? 'text-primary' : 'text-white'
                        }`}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text className="text-zinc-400 text-xs mt-0.5" numberOfLines={1}>
                        {item.artist}
                      </Text>
                    </View>

                    {isCurrent && isPlaying ? (
                      <View className="w-6 h-6 items-center justify-center mr-2">
                        <Volume2 size={16} color="#38bdf8" />
                      </View>
                    ) : null}

                    <TouchableOpacity className="w-8 h-8 items-center justify-center">
                      <MoreVertical size={16} color="#71717a" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        visible={showAddToPlaylist}
        track={currentTrack}
        onClose={() => setShowAddToPlaylist(false)}
        onRequestCreate={() => setShowCreatePlaylistModal(true)}
      />

      {/* Create / Import Playlist Modal */}
      <CreatePlaylistModal
        visible={showCreatePlaylistModal}
        onClose={() => setShowCreatePlaylistModal(false)}
      />
    </View>
  );
};
