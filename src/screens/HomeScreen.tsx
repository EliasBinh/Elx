import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Search, X, Music, Play } from 'lucide-react-native';
import { searchTracks } from '../services/youtube';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { SearchResultItem, TrackInfo } from '../types';

export const HomeScreen: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);

  const playTrack = usePlayerStore((s) => s.playTrack);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const addToHistory = useLibraryStore((s) => s.addToHistory);
  const history = useLibraryStore((s) => s.history);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const items = await searchTracks(text);
      setResults(items);
    } catch (e) {
      console.warn('Search failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };

  const handlePlay = (item: SearchResultItem | TrackInfo) => {
    const track: TrackInfo = {
      id: item.id,
      title: item.title,
      artist: item.artist,
      artwork: item.artwork,
      duration: 'durationSeconds' in item ? item.durationSeconds : item.duration,
    };

    addToHistory(track);

    // Build queue from currently visible results
    const queue: TrackInfo[] = results.map((r) => ({
      id: r.id,
      title: r.title,
      artist: r.artist,
      artwork: r.artwork,
      duration: r.durationSeconds,
    }));

    playTrack(track, queue.length > 0 ? queue : [track]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5 pt-4 pb-2">
        {/* App Title */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white font-black text-2xl tracking-tight">ELX</Text>
          <View className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700">
            <Text className="text-zinc-400 text-[10px] font-bold">OG</Text>
          </View>
        </View>

        {/* Minimalist Search Bar */}
        <View className="flex-row items-center bg-card border border-zinc-800 rounded-xl px-3.5 py-2.5">
          <Search size={18} color="#71717a" />
          <TextInput
            value={query}
            onChangeText={handleSearch}
            placeholder="Search songs, albums, artists..."
            placeholderTextColor="#71717a"
            className="flex-1 ml-2.5 text-white text-sm"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={18} color="#71717a" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#38bdf8" />
        </View>
      ) : results.length > 0 ? (
        // Search Results List
        <FlatList
          data={results}
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

                <Text className="text-zinc-600 text-xs font-mono">{item.durationText}</Text>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        // Idle State: Recently Played or Recommendations
        <View className="flex-1 px-5 pt-4">
          <Text className="text-zinc-400 font-semibold text-xs tracking-wider uppercase mb-3">
            {history.length > 0 ? 'Recently Played' : 'Discover'}
          </Text>

          {history.length > 0 ? (
            <FlatList
              data={history}
              keyExtractor={(item, index) => `${item.id}_${index}`}
              contentContainerStyle={{ paddingBottom: 100 }}
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

                    <Play size={16} color="#71717a" />
                  </TouchableOpacity>
                );
              }}
            />
          ) : (
            <View className="flex-1 items-center justify-center pb-20">
              <Music size={40} color="#27272a" />
              <Text className="text-zinc-500 text-sm mt-3 font-medium">Search to stream any song on YouTube Music</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

