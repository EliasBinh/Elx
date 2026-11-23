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
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Search,
  X,
  Music,
  ArrowLeft,
  Check,
  Cast,
  ArrowDownCircle,
  Plus,
} from 'lucide-react-native';
import { searchTracks, prefetchTrackAudioStreamUrl } from '../services/youtube';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { useDownloadStore } from '../store/downloadStore';
import { SearchResultItem, TrackInfo } from '../types';
import { LinerLogo } from '../components/LinerLogo';
import { AddToPlaylistModal } from '../components/playlist/AddToPlaylistModal';
import { CreatePlaylistModal } from '../components/playlist/CreatePlaylistModal';

const RECENT_SEARCHES_KEY = '@elx_recent_searches_v3';

interface RecentSearchItem {
  id: string;
  title: string;
  subtitle: string;
  artwork: string;
  type: 'artist' | 'song' | 'playlist';
  duration?: number;
  isVerified?: boolean;
}

interface GenreCategory {
  id: string;
  title: string;
  query: string;
  bgColor: string;
  image: string;
}

const GENRE_CATEGORIES: GenreCategory[] = [
  {
    id: 'upcoming',
    title: 'Upcoming\nReleases',
    query: 'New Music Releases',
    bgColor: '#15803d',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80',
  },
  {
    id: 'new_release',
    title: 'New\nReleases',
    query: 'New Music Friday',
    bgColor: '#4d7c0f',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80',
  },
  {
    id: 'top_hits',
    title: 'Top Hits\nTrending',
    query: 'Today Top Hits',
    bgColor: '#0891b2',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
  },
  {
    id: 'pop',
    title: 'Pop',
    query: 'Pop hits',
    bgColor: '#2563eb',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&q=80',
  },
  {
    id: 'kpop',
    title: 'K-Pop',
    query: 'K-Pop trending',
    bgColor: '#e11d48',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&q=80',
  },
  {
    id: 'hiphop',
    title: 'Hip Hop\n& Rap',
    query: 'Hip Hop Rap hits',
    bgColor: '#d97706',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&q=80',
  },
  {
    id: 'rnb',
    title: 'R&B &\nSoul',
    query: 'R&B chill',
    bgColor: '#7c3aed',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&q=80',
  },
  {
    id: 'chill',
    title: 'Chill &\nAcoustic',
    query: 'Chill vibes acoustic',
    bgColor: '#4338ca',
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=300&q=80',
  },
  {
    id: 'party',
    title: 'Party &\nDance',
    query: 'Party dance EDM',
    bgColor: '#c026d3',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&q=80',
  },
  {
    id: 'workout',
    title: 'Workout &\nGym',
    query: 'Gym motivation workout',
    bgColor: '#b91c1c',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=80',
  },
  {
    id: 'rock',
    title: 'Rock &\nMetal',
    query: 'Rock metal classics',
    bgColor: '#475569',
    image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&q=80',
  },
  {
    id: 'indie',
    title: 'Indie &\nLofi',
    query: 'Indie lofi songs',
    bgColor: '#be185d',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&q=80',
  },
];

interface SearchScreenProps {
  onTrackSelected?: () => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ onTrackSelected }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [playlistTargetTrack, setPlaylistTargetTrack] = useState<TrackInfo | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const inputRef = useRef<TextInput | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const playTrack = usePlayerStore((s) => s.playTrack);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const addToHistory = useLibraryStore((s) => s.addToHistory);
  const isDownloaded = useDownloadStore((s) => s.isDownloaded);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const dataStr = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (dataStr) {
        setRecentSearches(JSON.parse(dataStr));
      } else {
        const seedItems: RecentSearchItem[] = [
          {
            id: 'daniel_caesar',
            title: 'Daniel Caesar',
            subtitle: 'Artist',
            artwork: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
            type: 'artist',
            isVerified: true,
          },
          {
            id: 'keshi',
            title: 'keshi',
            subtitle: 'Artist',
            artwork: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
            type: 'artist',
            isVerified: true,
          },
          {
            id: 'drake',
            title: 'Drake',
            subtitle: 'Artist',
            artwork: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
            type: 'artist',
            isVerified: true,
          },
          {
            id: 'frank_ocean',
            title: 'Frank Ocean',
            subtitle: 'Artist',
            artwork: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&q=80',
            type: 'artist',
            isVerified: true,
          },
        ];
        setRecentSearches(seedItems);
        AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(seedItems));
      }
    } catch {
      // ignore
    }
  };

  const saveRecentSearch = async (item: RecentSearchItem) => {
    try {
      const filtered = recentSearches.filter((t) => t.id !== item.id && t.title !== item.title);
      const updated = [item, ...filtered].slice(0, 20);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const removeRecentSearch = async (itemId: string) => {
    try {
      const updated = recentSearches.filter((t) => t.id !== itemId);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearAllRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  const performSearch = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const items = await searchTracks(trimmed);
      setResults(items);
      // Pre-resolve top 2 search results into memory for 0ms instant play on tap!
      items.slice(0, 2).forEach((it) => {
        prefetchTrackAudioStreamUrl(it.id);
      });
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
      setLoading(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(text);
    }, 300);
  };

  const handleSelectTrack = (item: SearchResultItem) => {
    Keyboard.dismiss();
    const track: TrackInfo = {
      id: item.id,
      title: item.title,
      artist: item.artist,
      artwork: item.artwork,
      duration: item.durationSeconds,
    };

    addToHistory(track);
    saveRecentSearch({
      id: item.id,
      title: item.title,
      subtitle: `Song • ${item.artist}`,
      artwork: item.artwork,
      type: 'song',
      duration: item.durationSeconds,
    });

    const queue: TrackInfo[] =
      results.length > 0
        ? results.map((r) => ({
            id: r.id,
            title: r.title,
            artist: r.artist,
            artwork: r.artwork,
            duration: r.durationSeconds,
          }))
        : [track];

    playTrack(track, queue);
    if (onTrackSelected) onTrackSelected();
  };

  const handleSelectRecent = (item: RecentSearchItem) => {
    if (item.type === 'artist' || item.type === 'playlist') {
      setQuery(item.title);
      setIsFocused(true);
      performSearch(item.title);
    } else {
      const track: TrackInfo = {
        id: item.id,
        title: item.title,
        artist: item.subtitle.replace('Song • ', ''),
        artwork: item.artwork,
        duration: item.duration || 210,
      };
      playTrack(track, [track]);
      if (onTrackSelected) onTrackSelected();
    }
  };

  const handleSelectGenre = (genre: GenreCategory) => {
    setIsFocused(true);
    setQuery(genre.query);
    performSearch(genre.query);
  };

  const handleExitSearchMode = () => {
    Keyboard.dismiss();
    setIsFocused(false);
    setQuery('');
    setResults([]);
  };

  const isQueryActive = query.trim().length > 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Search Header */}
      {!isFocused ? (
        /* Top Header when in Explore / Browse Mode */
        <View className="px-5 pt-3 pb-2">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <LinerLogo size={28} color="#ffffff" className="mr-3" />
              <Text className="text-white font-extrabold text-2xl tracking-tight">Search</Text>
            </View>
            <TouchableOpacity className="w-8 h-8 items-center justify-center">
              <Cast size={20} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          {/* Search Bar matching Liner Desktop */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              setIsFocused(true);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            className="flex-row items-center bg-card/90 border border-zinc-800 rounded-xl px-3.5 py-3 shadow-sm"
          >
            <Search size={20} color="#71717a" />
            <Text className="text-zinc-500 font-medium text-sm ml-3">
              Search tracks, albums, artists...
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Header when Search Input is Active */
        <View className="px-4 pt-2 pb-2 flex-row items-center">
          <TouchableOpacity
            onPress={handleExitSearchMode}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="w-9 h-9 items-center justify-center mr-2"
          >
            <ArrowLeft size={22} color="#ffffff" />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-center bg-card/90 border border-zinc-800 rounded-xl px-3.5 py-2">
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={handleQueryChange}
              onSubmitEditing={() => performSearch(query)}
              placeholder="Search tracks, albums, artists..."
              placeholderTextColor="#71717a"
              className="flex-1 text-white text-base py-0.5"
              autoCorrect={false}
              returnKeyType="search"
              autoFocus={true}
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setQuery('');
                  setResults([]);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color="#a1a1aa" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Main Content Area */}
      {!isFocused ? (
        /* Explore / Browse Genre Grid */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 110 }}
        >
          <Text className="text-white font-bold text-lg mb-3">Explore Categories</Text>

          {/* Top Featured Story Banners */}
          <View className="flex-row justify-between mb-4">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleSelectGenre(GENRE_CATEGORIES[0])}
              className="w-[48%] h-36 rounded-xl overflow-hidden bg-gradient-to-b from-amber-700 to-amber-950 p-3 justify-between"
            >
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&q=80',
                }}
                className="absolute inset-0 opacity-40"
              />
              <View className="bg-black/30 self-start px-2 py-0.5 rounded-full">
                <Text className="text-white text-[10px] font-semibold uppercase">Podcast</Text>
              </View>
              <Text className="text-white font-bold text-lg shadow-sm">#yearning</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleSelectGenre(GENRE_CATEGORIES[1])}
              className="w-[48%] h-36 rounded-xl overflow-hidden bg-gradient-to-b from-rose-700 to-rose-950 p-3 justify-between"
            >
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
                }}
                className="absolute inset-0 opacity-40"
              />
              <View className="bg-black/30 self-start px-2 py-0.5 rounded-full">
                <Text className="text-white text-[10px] font-semibold uppercase">New</Text>
              </View>
              <Text className="text-white font-bold text-lg shadow-sm">#admiration</Text>
            </TouchableOpacity>
          </View>

          {/* 2-Column Vibrant Genre Cards */}
          <View className="flex-row flex-wrap justify-between">
            {GENRE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.85}
                onPress={() => handleSelectGenre(cat)}
                style={{ backgroundColor: cat.bgColor }}
                className="w-[48%] h-24 rounded-xl p-3 mb-3.5 overflow-hidden relative shadow-sm border border-white/5"
              >
                <Text className="text-white font-bold text-sm leading-tight pr-6">
                  {cat.title}
                </Text>

                {/* Tilted 3D Album Cover peaking at bottom-right */}
                <Image
                  source={{ uri: cat.image }}
                  style={{ transform: [{ rotate: '-18deg' }] }}
                  className="w-16 h-16 rounded shadow-lg absolute -bottom-2 -right-3"
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : isQueryActive ? (
        /* Active Search Query Results */
        loading ? (
          <View className="flex-1 items-center justify-center p-6">
            <ActivityIndicator size="small" color="#ffffff" />
            <Text className="text-zinc-500 text-xs mt-3 font-medium">Searching...</Text>
          </View>
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 110 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isPlayingThis = currentTrack?.id === item.id;
              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelectTrack(item)}
                  className="flex-row items-center py-2.5 border-b border-zinc-900/60"
                >
                  {item.artwork ? (
                    <Image
                      source={{ uri: item.artwork }}
                      className="w-12 h-12 rounded-lg bg-zinc-800 mr-3"
                    />
                  ) : (
                    <View className="w-12 h-12 rounded-lg bg-zinc-800 mr-3 items-center justify-center">
                      <Music size={20} color="#71717a" />
                    </View>
                  )}

                  <View className="flex-1 mr-3">
                    <Text
                      className={`font-semibold text-sm ${
                        isPlayingThis ? 'text-primary' : 'text-white'
                      }`}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                      {isDownloaded(item.id) ? (
                        <View className="mr-1">
                          <ArrowDownCircle size={12} color="#000000" fill="#22c55e" />
                        </View>
                      ) : null}
                      <Text className="text-zinc-400 text-xs" numberOfLines={1}>
                        {item.artist}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-zinc-500 text-xs font-mono mr-3">
                    {item.durationText}
                  </Text>

                  <TouchableOpacity
                    onPress={() => {
                      setPlaylistTargetTrack({
                        id: item.id,
                        title: item.title,
                        artist: item.artist,
                        artwork: item.artwork,
                        duration: item.durationSeconds,
                      });
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    className="w-8 h-8 items-center justify-center rounded-full active:bg-zinc-800"
                  >
                    <Plus size={18} color="#71717a" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
          />
        ) : (
          <View className="flex-1 items-center justify-center p-8">
            <View className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 items-center justify-center mb-3">
              <Search size={22} color="#71717a" />
            </View>
            <Text className="text-white font-semibold text-base mb-1">No results found</Text>
            <Text className="text-zinc-500 text-xs text-center">
              Try searching for another track or artist.
            </Text>
          </View>
        )
      ) : (
        /* Recent Searches List matching Liner Desktop */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 110 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white font-bold text-xl">Recent searches</Text>
            <TouchableOpacity onPress={clearAllRecentSearches}>
              <Text className="text-zinc-500 text-xs hover:text-white">Clear</Text>
            </TouchableOpacity>
          </View>

          {recentSearches.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => handleSelectRecent(item)}
              className="flex-row items-center py-2.5"
            >
              {item.type === 'artist' ? (
                <View className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 mr-3.5 border border-white/5">
                  <Image source={{ uri: item.artwork }} className="w-full h-full" />
                </View>
              ) : (
                <View className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 mr-3.5 border border-white/5">
                  <Image source={{ uri: item.artwork }} className="w-full h-full" />
                </View>
              )}

              <View className="flex-1 mr-2">
                <View className="flex-row items-center">
                  <Text className="text-white font-semibold text-base mr-1.5" numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.isVerified && (
                    <View className="w-3.5 h-3.5 rounded-full bg-emerald-500 items-center justify-center">
                      <Check size={10} color="#000000" strokeWidth={3} />
                    </View>
                  )}
                </View>
                <Text className="text-zinc-400 text-xs mt-0.5" numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => removeRecentSearch(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="w-8 h-8 items-center justify-center"
              >
                <X size={18} color="#71717a" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

          {/* Centered Pill Button: Clear recent searches */}
          {recentSearches.length > 0 && (
            <View className="items-center mt-6 mb-8">
              <TouchableOpacity
                onPress={clearAllRecentSearches}
                activeOpacity={0.7}
                className="px-6 py-2.5 rounded-full border border-zinc-700 active:bg-zinc-800"
              >
                <Text className="text-white font-semibold text-sm">
                  Clear recent searches
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        visible={!!playlistTargetTrack}
        track={playlistTargetTrack}
        onClose={() => setPlaylistTargetTrack(null)}
        onRequestCreate={() => setShowCreateModal(true)}
      />

      {/* Create / Import Playlist Modal */}
      <CreatePlaylistModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </SafeAreaView>
  );
};
