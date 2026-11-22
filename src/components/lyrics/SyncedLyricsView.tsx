import React, { useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useProgress } from 'react-native-track-player';
import { usePlayerStore } from '../../store/playerStore';
import { LyricLine } from '../../types';

export const SyncedLyricsView: React.FC = () => {
  const lyrics = usePlayerStore((s) => s.lyrics);
  const isLoadingLyrics = usePlayerStore((s) => s.isLoadingLyrics);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const { position } = useProgress(100); // 100ms interval for smooth syllable timing
  const flatListRef = useRef<FlatList>(null);

  const currentMs = position * 1000;

  // Find active line index
  let activeIndex = -1;
  if (lyrics && lyrics.lines.length > 0) {
    for (let i = 0; i < lyrics.lines.length; i++) {
      const line = lyrics.lines[i];
      if (currentMs >= line.startTimeMs && currentMs < line.endTimeMs) {
        activeIndex = i;
        break;
      }
    }
    // If before first line or after last
    if (activeIndex === -1 && currentMs > (lyrics.lines[lyrics.lines.length - 1]?.endTimeMs || 0)) {
      activeIndex = lyrics.lines.length - 1;
    }
  }

  // Smooth auto-scroll to current active line
  useEffect(() => {
    if (activeIndex >= 0 && flatListRef.current) {
      try {
        flatListRef.current.scrollToIndex({
          index: activeIndex,
          animated: true,
          viewPosition: 0.4, // Center slightly above midpoint
        });
      } catch (e) {
        // FlatList layout not yet calculated
      }
    }
  }, [activeIndex]);

  if (isLoadingLyrics) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-zinc-400 text-sm font-medium">Loading synchronized lyrics...</Text>
      </View>
    );
  }

  if (!lyrics || lyrics.lines.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-zinc-500 text-sm">No lyrics available for this track.</Text>
      </View>
    );
  }

  const renderItem = ({ item, index }: { item: LyricLine; index: number }) => {
    const isActive = index === activeIndex;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => seekTo(item.startTimeMs / 1000)}
        className={`py-3.5 px-4 ${isActive ? 'opacity-100 scale-105' : 'opacity-40'}`}
      >
        {item.syllables && item.syllables.length > 0 ? (
          // Word/Syllable-level animated rendering
          <View className="flex-row flex-wrap">
            {item.syllables.map((syl, sIdx) => {
              const isSylActive = currentMs >= syl.startTimeMs;
              return (
                <Text
                  key={sIdx}
                  className={`text-xl font-bold transition-all ${
                    isSylActive
                      ? 'text-white'
                      : isActive
                      ? 'text-zinc-400'
                      : 'text-zinc-500'
                  }`}
                  style={{
                    textShadowColor: isSylActive ? 'rgba(255,255,255,0.4)' : 'transparent',
                    textShadowRadius: isSylActive ? 8 : 0,
                  }}
                >
                  {syl.text}
                </Text>
              );
            })}
          </View>
        ) : (
          // Standard line-level synced rendering
          <Text
            className={`text-xl font-bold ${
              isActive ? 'text-white' : 'text-zinc-400'
            }`}
            style={{
              textShadowColor: isActive ? 'rgba(255,255,255,0.5)' : 'transparent',
              textShadowRadius: isActive ? 10 : 0,
            }}
          >
            {item.text}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      ref={flatListRef}
      data={lyrics.lines}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ paddingVertical: 120, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
      onScrollToIndexFailed={() => {}}
    />
  );
};

