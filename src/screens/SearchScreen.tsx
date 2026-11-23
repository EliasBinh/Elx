import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search, X, Music, Clock, Trash2, MoreVertical, Cast } from 'lucide-react-native';
import { searchTracks } from '../services/youtube';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { SearchResultItem, TrackInfo } from '../types';

const RECENT_SEARCHES_KEY = '@elx_recent_searches';

interface SearchScreenProps {
  onTrackSelected?: () => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ onTrackSelected }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<TrackInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const playTrack = usePlayerStore((s) => s.playTrack);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const addToHistory = useLibraryStore((s) => s.addToHistory);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const dataStr = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (dataStr) {
        setRecentSearches(JSON.parse(dataStr));
      }
    } catch (e) {
      // ignore
    }
  };

  const saveRecentSearch = async (track: TrackInfo) => {
    try {
      const filtered = recentSearches.filter((t) => t.id !== track.id);
      const updated = [track, ...filtered].slice(0, 15);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const removeRecentSearch = async (trackId: string) => {
    try {
      const updated = recentSearches.filter((t) => t.id !== trackId);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const clearAllRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      // ignore
    }
  };

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

    debounceTimerRef.current = setTimeout(() => {
      performSearch(text);
    }, 350);
  };

  const clearQuery = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setLoading(false);
  };

  const handleSelectTrack = (item: SearchResultItem | TrackInfo) => {
    Keyboard.dismiss();
    const track: TrackInfo = {
      id: item.id,
      title: item.title,
      artist: item.artist,
      artwork: item.artwork,
      duration: 'durationSeconds' in item ? item.durationSeconds : item.duration,
    };

    addToHistory(track);
    saveRecentSearch(track);

    const queue: TrackInfo[] =
      results.length > 0
        ? results.map((r) => ({
            id: r.id,
            title: r.title,
            artist: r.artist,
            artwork: r.artwork,
            duration: r.durationSeconds,
          }))
        : [track, ...recentSearches];

    playTrack(track, queue);
    if (onTrackSelected) onTrackSelected();
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isQueryActive = query.trim().length > 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Search Header */}
      <View className="px-5 pt-3 pb-3 flex-row items-center">
        <View className="flex-1 flex-row items-center bg-card/90 border border-zinc-800 rounded-xl px-3.5 py-2.5 shadow-sm mr-2.5">
          <Search size={18} color="#71717a" />
          <TextInput
            value={query}
            onChangeText={handleQueryChange}
            onSubmitEditing={() => performSearch(query)}
            placeholder="Search"
            placeholderTextColor="#71717a"
            className="flex-1 ml-2.5 text-white text-sm"
            autoCorrect={false}
            returnKeyType="search"
            autoFocus={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearQuery} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={18} color="#a1a1aa" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity activeOpacity={0.7} className="w-9 h-9 items-center justify-center">
          <Cast size={20} color="#a1a1aa" />
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {isQueryActive ? (
        loading ? (
          <View className="flex-1 items-center justify-center p-6">
            <ActivityIndicator size="small" color="#ffffff" />
            <Text className="text-zinc-500 text-xs mt-3 font-medium">Searching YouTube Music...</Text>
          </View>
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, paddingBottom: 110 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isPlayingThis = currentTrack?.id === item.id;
              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelectTrack(item)}
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
          <View className="flex-1 items-center justify-center p-8">
            <View className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 items-center justify-center mb-3">
              <Search size={22} color="#71717a" />
            </View>
            <Text className="text-white font-semibold text-base mb-1">No songs found</Text>
            <Text className="text-zinc-500 text-xs text-center">
              Try searching with another track or artist name.
            </Text>
          </View>
        )
      ) : (
        /* Liner Desktop Style Recent Searches overlay/list */
        <View className="flex-1 px-5 pt-2">
          {recentSearches.length > 0 ? (
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-zinc-400 font-semibold text-xs tracking-wider uppercase">
                  Recent searches
                </Text>
                <TouchableOpacity onPress={clearAllRecentSearches}>
                  <Text className="text-zinc-500 text-xs hover:text-white">Clear</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={recentSearches}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 110 }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const isPlayingThis = currentTrack?.id === item.id;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleSelectTrack(item)}
                      className="flex-row items-center py-2.5 px-2 rounded-xl border-b border-zinc-900/60"
                    >
                      {item.artwork ? (
                        <Image source={{ uri: item.artwork }} className="w-11 h-11 rounded-lg bg-zinc-800 mr-3" />
                      ) : (
                        <View className="w-11 h-11 rounded-lg bg-zinc-800 mr-3 items-center justify-center">
                          <Music size={18} color="#71717a" />
                        </View>
                      )}

                      <View className="flex-1 mr-2">
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

                      <Text className="text-zinc-500 text-xs font-mono mr-3">
                        {formatSeconds(item.duration)}
                      </Text>

                      <TouchableOpacity
                        onPress={() => removeRecentSearch(item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        className="p-1"
                      >
                        <X size={15} color="#71717a" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          ) : (
            <View className="flex-1 items-center justify-center pb-20">
              <View className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 items-center justify-center mb-3">
                <Search size={22} color="#71717a" />
              </View>
              <Text className="text-white font-semibold text-base mb-1">Search YouTube Music</Text>
              <Text className="text-zinc-500 text-xs text-center max-w-xs">
                Find songs, artists, albums, or live tracks to stream ad-free.
              </Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

