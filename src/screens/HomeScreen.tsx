import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Search, X, Flame, Clock, MoreVertical, Play, Music, Sparkles } from 'lucide-react-native';
import { searchTracks } from '../services/youtube';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { SearchResultItem, TrackInfo } from '../types';

const { width } = Dimensions.get('window');

// Real verified YouTube tracks matching Liner Desktop showcase
const FEATURED_TRACKS: TrackInfo[] = [
  {
    id: '_2tkmczXPpU',
    title: 'type london',
    artist: 'ONDA ANDAR',
    artwork: 'https://i.ytimg.com/vi/_2tkmczXPpU/hq720.jpg',
    duration: 104,
  },
  {
    id: 'f3DoKx_R1_s',
    title: 'worry (Slowed)',
    artist: 'LONOWN, riserayss',
    artwork: 'https://i.ytimg.com/vi/f3DoKx_R1_s/hq720.jpg',
    duration: 202,
  },
  {
    id: '0G3xwKGlfoc',
    title: 'addiction (Slowed)',
    artist: 'LONOWN',
    artwork: 'https://i.ytimg.com/vi/0G3xwKGlfoc/hq720.jpg',
    duration: 209,
  },
  {
    id: 'Zrq71nOI3C4',
    title: 'cachalot',
    artist: 'ONDA ANDAR',
    artwork: 'https://i.ytimg.com/vi/Zrq71nOI3C4/hq720.jpg',
    duration: 121,
  },
  {
    id: 'H2vTrHc-OGk',
    title: 'poster boy',
    artist: '2hollis',
    artwork: 'https://i.ytimg.com/vi/H2vTrHc-OGk/hq720.jpg',
    duration: 122,
  },
  {
    id: 'v3U7dyBar0s',
    title: 'the kill 2',
    artist: 'Lex Amarni',
    artwork: 'https://i.ytimg.com/vi/v3U7dyBar0s/hq720.jpg',
    duration: 122,
  },
  {
    id: 'S02J3QifNog',
    title: 'Earrings',
    artist: 'Malcolm Todd',
    artwork: 'https://i.ytimg.com/vi/S02J3QifNog/hq720.jpg',
    duration: 152,
  },
  {
    id: 'mqEZcXdtAUA',
    title: 'Fever',
    artist: 'Buckshot & fakemink',
    artwork: 'https://i.ytimg.com/vi/mqEZcXdtAUA/hq720.jpg',
    duration: 145,
  },
  {
    id: 'rScwLoES2bM',
    title: 'Superpowers',
    artist: 'Daniel Caesar',
    artwork: 'https://i.ytimg.com/vi/rScwLoES2bM/hq720.jpg',
    duration: 175,
  },
  {
    id: 'pKFd12id5oQ',
    title: 'Always',
    artist: 'Daniel Caesar',
    artwork: 'https://i.ytimg.com/vi/pKFd12id5oQ/hq720.jpg',
    duration: 226,
  },
];

const JUMP_BACK_CARDS: TrackInfo[] = [
  {
    id: '5nADiECRQWc',
    title: 'On Ur Time',
    artist: 'Natanya',
    artwork: 'https://i.ytimg.com/vi/5nADiECRQWc/hq720.jpg',
    duration: 215,
  },
  {
    id: '9f5zD7ZSNpQ',
    title: 'After The Storm',
    artist: 'Kali Uchis',
    artwork: 'https://i.ytimg.com/vi/9f5zD7ZSNpQ/hq720.jpg',
    duration: 210,
  },
  {
    id: 'rScwLoES2bM',
    title: 'Superpowers',
    artist: 'Daniel Caesar',
    artwork: 'https://i.ytimg.com/vi/rScwLoES2bM/hq720.jpg',
    duration: 175,
  },
  {
    id: 'pKFd12id5oQ',
    title: 'Always',
    artist: 'Daniel Caesar',
    artwork: 'https://i.ytimg.com/vi/pKFd12id5oQ/hq720.jpg',
    duration: 226,
  },
];

export const HomeScreen: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const playTrack = usePlayerStore((s) => s.playTrack);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const addToHistory = useLibraryStore((s) => s.addToHistory);
  const history = useLibraryStore((s) => s.history);

  const performSearch = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const items = await searchTracks(trimmed);
      setResults(items);
    } catch (e) {
      console.warn('Search failed:', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!text.trim()) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    // Debounce 350ms
    debounceTimerRef.current = setTimeout(() => {
      performSearch(text);
    }, 350);
  };

  const clearSearch = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setLoading(false);
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

    const queue: TrackInfo[] =
      results.length > 0
        ? results.map((r) => ({
            id: r.id,
            title: r.title,
            artist: r.artist,
            artwork: r.artwork,
            duration: r.durationSeconds,
          }))
        : FEATURED_TRACKS;

    playTrack(track, queue);
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isSearching = query.trim().length > 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Liner Header */}
      <View className="px-5 pt-3 pb-3">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Image
              source={require('../../assets/icon.png')}
              className="w-8 h-8 rounded-lg mr-2.5"
            />
            <Text className="text-white font-black text-xl tracking-tight">ELX</Text>
          </View>
          <View className="px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60">
            <Text className="text-zinc-400 text-[10px] font-bold tracking-wider">LINER CORE</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-card/90 border border-zinc-800 rounded-xl px-3.5 py-2.5 shadow-sm">
          <Search size={18} color="#71717a" />
          <TextInput
            value={query}
            onChangeText={handleQueryChange}
            onSubmitEditing={() => performSearch(query)}
            placeholder="Search songs, albums, artists..."
            placeholderTextColor="#71717a"
            className="flex-1 ml-2.5 text-white text-sm"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={18} color="#a1a1aa" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content Area */}
      {isSearching ? (
        loading ? (
          <View className="flex-1 items-center justify-center p-6">
            <ActivityIndicator size="small" color="#38bdf8" />
            <Text className="text-zinc-400 text-xs mt-3 font-medium">Searching YouTube Music...</Text>
          </View>
        ) : results.length > 0 ? (
          // Search Results
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, paddingBottom: 110 }}
            renderItem={({ item }) => {
              const isPlayingThis = currentTrack?.id === item.id;
              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handlePlay(item)}
                  className="flex-row items-center py-3 border-b border-zinc-900/80"
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

                  <Text className="text-zinc-500 text-xs font-mono">{item.durationText}</Text>
                </TouchableOpacity>
              );
            }}
          />
        ) : (
          // No Results Found
          <View className="flex-1 items-center justify-center p-8">
            <View className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 items-center justify-center mb-3">
              <Search size={24} color="#71717a" />
            </View>
            <Text className="text-white font-semibold text-base mb-1">No songs found</Text>
            <Text className="text-zinc-500 text-xs text-center">
              Try searching with a different song name or artist title.
            </Text>
          </View>
        )
      ) : (
        // Liner Desktop Style Home Feed
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Section 1: Listening right now (Flame icon) */}
          <View className="px-5 pt-2 mb-6">
            <View className="flex-row items-center mb-3.5">
              <Flame size={18} color="#ffffff" fill="#ffffff" />
              <Text className="text-white font-bold text-base ml-2 tracking-tight">
                Listening right now
              </Text>
            </View>

            {/* List of active tracks */}
            <View className="bg-card/70 border border-zinc-800/60 rounded-2xl p-2.5">
              {FEATURED_TRACKS.map((item) => {
                const isPlayingThis = currentTrack?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.7}
                    onPress={() => handlePlay(item)}
                    className="flex-row items-center py-2.5 px-2 rounded-xl"
                  >
                    <Image
                      source={{ uri: item.artwork }}
                      className="w-11 h-11 rounded-lg bg-zinc-800 mr-3"
                    />
                    <View className="flex-1 mr-2">
                      <Text
                        className={`font-semibold text-sm ${
                          isPlayingThis ? 'text-primary' : 'text-white'
                        }`}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text className="text-zinc-400 text-xs mt-0.5" numberOfLines={1}>
                        {item.artist}
                      </Text>
                    </View>

                    <Text className="text-zinc-500 text-xs font-mono mr-2">
                      {formatSeconds(item.duration)}
                    </Text>
                    <MoreVertical size={16} color="#71717a" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section 2: Jump back in (Clock icon) */}
          <View className="mb-6">
            <View className="flex-row items-center px-5 mb-3.5">
              <Clock size={18} color="#ffffff" />
              <Text className="text-white font-bold text-base ml-2 tracking-tight">
                Jump back in
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {JUMP_BACK_CARDS.map((card) => {
                const isPlayingThis = currentTrack?.id === card.id;
                return (
                  <TouchableOpacity
                    key={card.id}
                    activeOpacity={0.8}
                    onPress={() => handlePlay(card)}
                    className="mr-4 w-36"
                  >
                    <Image
                      source={{ uri: card.artwork }}
                      className="w-36 h-36 rounded-2xl bg-zinc-800 mb-2 border border-white/5"
                    />
                    <Text
                      className={`font-semibold text-xs ${
                        isPlayingThis ? 'text-primary' : 'text-white'
                      }`}
                      numberOfLines={1}
                    >
                      {card.title}
                    </Text>
                    <Text className="text-zinc-500 text-[11px] mt-0.5" numberOfLines={1}>
                      {card.artist}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Section 3: Recently Played */}
          {history.length > 0 && (
            <View className="px-5 mb-6">
              <Text className="text-zinc-400 font-semibold text-xs tracking-wider uppercase mb-3">
                Recently Played
              </Text>
              <View className="bg-card/70 border border-zinc-800/60 rounded-2xl p-2.5">
                {history.slice(0, 5).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.7}
                    onPress={() => handlePlay(item)}
                    className="flex-row items-center py-2.5 px-2 rounded-xl"
                  >
                    <Image
                      source={{ uri: item.artwork }}
                      className="w-10 h-10 rounded-lg bg-zinc-800 mr-3"
                    />
                    <View className="flex-1 mr-2">
                      <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text className="text-zinc-400 text-xs mt-0.5" numberOfLines={1}>
                        {item.artist}
                      </Text>
                    </View>
                    <Play size={16} color="#71717a" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
