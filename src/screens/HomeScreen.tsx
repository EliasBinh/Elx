import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Search, Flame, Clock, MoreVertical, Play, Music, Cast } from 'lucide-react-native';
import { LinerLogo } from '../components/LinerLogo';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { TrackInfo } from '../types';

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

interface HomeScreenProps {
  onOpenSearch?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenSearch }) => {
  const playTrack = usePlayerStore((s) => s.playTrack);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const addToHistory = useLibraryStore((s) => s.addToHistory);
  const history = useLibraryStore((s) => s.history);

  const handlePlay = (item: TrackInfo) => {
    addToHistory(item);
    playTrack(item, FEATURED_TRACKS);
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header with Search Button */}
      <View className="px-5 pt-3 pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <LinerLogo size={26} color="#ffffff" />
            <Text className="text-white font-black text-lg tracking-wider ml-2.5">LINER</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} className="w-8 h-8 items-center justify-center">
            <Cast size={19} color="#a1a1aa" />
          </TouchableOpacity>
        </View>

        {/* Search Bar Button (Opens Search Tab) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenSearch}
          className="flex-row items-center bg-card border border-zinc-800 rounded-xl px-3.5 py-2.5 shadow-sm"
        >
          <Search size={16} color="#71717a" />
          <Text className="text-zinc-500 text-xs ml-2.5 font-medium">
            Search songs, albums, artists...
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Section 1: Listening right now (Flame icon) */}
        <View className="px-5 pt-3 mb-6">
          <View className="flex-row items-center mb-3.5">
            <Flame size={17} color="#ffffff" fill="#ffffff" />
            <Text className="text-white font-bold text-base ml-2 tracking-tight">
              Listening right now
            </Text>
          </View>

          {/* List of active tracks */}
          <View className="bg-card border border-zinc-800/80 rounded-2xl p-2.5">
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
            <Clock size={17} color="#ffffff" />
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
            <View className="bg-card border border-zinc-800/80 rounded-2xl p-2.5">
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
    </SafeAreaView>
  );
};
