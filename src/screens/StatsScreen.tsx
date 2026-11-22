import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';
import Svg, { Rect, Path, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import { Users, Activity, BarChart3, TrendingUp, Music } from 'lucide-react-native';
import { useStatsStore } from '../store/statsStore';

const { width } = Dimensions.get('window');

export const StatsScreen: React.FC = () => {
  const totalMinutes = useStatsStore((s) => s.totalMinutes);
  const totalSongsPlayed = useStatsStore((s) => s.totalSongsPlayed);
  const getWeeklyTrend = useStatsStore((s) => s.getWeeklyTrend);
  const getTopTracks = useStatsStore((s) => s.getTopTracks);

  const weeklyTrend = getWeeklyTrend();
  const topTracks = getTopTracks(4);

  // Chart dimensions
  const chartWidth = width - 48; // padding px-6
  const chartHeight = 140;
  const barWidth = 26;
  const maxMinutes = Math.max(...weeklyTrend.map((d) => d.minutes), 60);

  // Build SVG path for smooth trend line
  const points = weeklyTrend.map((d, i) => {
    const x = (i / (weeklyTrend.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - (d.minutes / maxMinutes) * (chartHeight - 40) - 20;
    return { x, y };
  });

  const linePath = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaPath = `${linePath} L ${points[points.length - 1]?.x || 0} ${chartHeight} L ${points[0]?.x || 0} ${chartHeight} Z`;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Pulse Check */}
        <View className="mb-5">
          <Text className="text-zinc-500 italic text-xs font-serif">Pulse check</Text>
          <Text className="text-white font-extrabold text-2xl tracking-tight mt-0.5">
            Growth snapshot
          </Text>
        </View>

        {/* Top 3 Stat Cards (Horizontal Scroll or Grid) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-8 -mx-5 px-5"
        >
          {/* Card 1: Total Listening */}
          <View className="bg-card border border-zinc-800/80 rounded-2xl p-4 mr-3 w-56">
            <View className="flex-row items-center justify-between mb-3">
              <View className="w-8 h-8 rounded-lg bg-indigo-500/10 items-center justify-center">
                <Users size={16} color="#818cf8" />
              </View>
              <View className="flex-row items-center bg-indigo-500/15 px-2 py-0.5 rounded-full">
                <TrendingUp size={11} color="#818cf8" />
                <Text className="text-indigo-400 text-[10px] font-bold ml-1">+17.3%</Text>
              </View>
            </View>
            <Text className="text-zinc-500 text-[10px] font-bold tracking-wider uppercase">
              Total Listening
            </Text>
            <Text className="text-white font-black text-2xl mt-1">
              {totalMinutes.toLocaleString()} min
            </Text>
            <Text className="text-zinc-500 text-[11px] mt-1">
              Across all listening sessions
            </Text>
          </View>

          {/* Card 2: Songs Played */}
          <View className="bg-card border border-zinc-800/80 rounded-2xl p-4 mr-3 w-56">
            <View className="flex-row items-center justify-between mb-3">
              <View className="w-8 h-8 rounded-lg bg-emerald-500/10 items-center justify-center">
                <Activity size={16} color="#34d399" />
              </View>
              <View className="flex-row items-center bg-emerald-500/15 px-2 py-0.5 rounded-full">
                <Text className="text-emerald-400 text-[10px] font-bold">Active</Text>
              </View>
            </View>
            <Text className="text-zinc-500 text-[10px] font-bold tracking-wider uppercase">
              Tracks Streamed
            </Text>
            <Text className="text-white font-black text-2xl mt-1">
              {totalSongsPlayed.toLocaleString()}
            </Text>
            <Text className="text-zinc-500 text-[11px] mt-1">
              Syllable lyrics synced
            </Text>
          </View>

          {/* Card 3: Sessions */}
          <View className="bg-card border border-zinc-800/80 rounded-2xl p-4 w-56">
            <View className="flex-row items-center justify-between mb-3">
              <View className="w-8 h-8 rounded-lg bg-sky-500/10 items-center justify-center">
                <BarChart3 size={16} color="#38bdf8" />
              </View>
            </View>
            <Text className="text-zinc-500 text-[10px] font-bold tracking-wider uppercase">
              Global Platform
            </Text>
            <Text className="text-white font-black text-2xl mt-1">
              100% Ad-Free
            </Text>
            <Text className="text-zinc-500 text-[11px] mt-1">
              Powered by YouTube Music
            </Text>
          </View>
        </ScrollView>

        {/* Section 2: Daily Movement / Engagement Trends */}
        <View className="mb-4">
          <Text className="text-zinc-500 italic text-xs font-serif">Daily movement</Text>
          <Text className="text-white font-extrabold text-2xl tracking-tight mt-0.5">
            Engagement trends
          </Text>
          <Text className="text-zinc-500 text-xs mt-1">
            Weekly listening time and activity breakdown.
          </Text>
        </View>

        {/* Chart Card 1: 7-Day Activity Bar Chart */}
        <View className="bg-card border border-zinc-800/80 rounded-2xl p-5 mb-5">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white font-bold text-sm">Listening Minutes / Day</Text>
              <Text className="text-zinc-500 text-xs mt-0.5">Last 7 days activity</Text>
            </View>
            <View className="items-end">
              <Text className="text-indigo-400 font-extrabold text-lg">
                {weeklyTrend.reduce((acc, d) => acc + d.minutes, 0)}m
              </Text>
              <Text className="text-zinc-500 text-[10px]">Total this week</Text>
            </View>
          </View>

          {/* SVG Bar Chart */}
          <View className="items-center py-2">
            <Svg width={chartWidth - 20} height={chartHeight}>
              <Defs>
                <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#818cf8" stopOpacity="1" />
                  <Stop offset="1" stopColor="#4f46e5" stopOpacity="0.7" />
                </LinearGradient>
                <LinearGradient id="activeBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#c084fc" stopOpacity="1" />
                  <Stop offset="1" stopColor="#9333ea" stopOpacity="0.9" />
                </LinearGradient>
              </Defs>

              {weeklyTrend.map((d, index) => {
                const totalBars = weeklyTrend.length;
                const slotWidth = (chartWidth - 20) / totalBars;
                const x = index * slotWidth + (slotWidth - barWidth) / 2;
                const barHeight = Math.max(8, (d.minutes / maxMinutes) * (chartHeight - 30));
                const y = chartHeight - 25 - barHeight;
                const isToday = index === totalBars - 1;

                return (
                  <React.Fragment key={index}>
                    {/* Background track line */}
                    <Rect
                      x={x}
                      y={10}
                      width={barWidth}
                      height={chartHeight - 35}
                      rx={6}
                      fill="#18181b"
                    />
                    {/* Active Bar */}
                    <Rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx={6}
                      fill={isToday ? 'url(#activeBarGrad)' : 'url(#barGrad)'}
                    />
                  </React.Fragment>
                );
              })}
            </Svg>

            {/* Day Labels below bars */}
            <View className="flex-row justify-between w-full px-2 mt-2">
              {weeklyTrend.map((d, index) => {
                const isToday = index === weeklyTrend.length - 1;
                return (
                  <View key={index} className="items-center w-8">
                    <Text
                      className={`text-[11px] font-semibold ${
                        isToday ? 'text-indigo-400 font-bold' : 'text-zinc-500'
                      }`}
                    >
                      {d.dayLabel}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Chart Card 2: Cumulative Curve */}
        <View className="bg-card border border-zinc-800/80 rounded-2xl p-5 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-white font-bold text-sm">Listening Trend Curve</Text>
              <Text className="text-zinc-500 text-xs mt-0.5">Smooth velocity trajectory</Text>
            </View>
            <View className="w-8 h-8 rounded-full bg-indigo-500/10 items-center justify-center">
              <TrendingUp size={16} color="#818cf8" />
            </View>
          </View>

          <Svg width={chartWidth - 20} height={chartHeight}>
            <Defs>
              <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#818cf8" stopOpacity="0.3" />
                <Stop offset="1" stopColor="#818cf8" stopOpacity="0.0" />
              </LinearGradient>
            </Defs>

            {/* Grid line */}
            <Line
              x1="0"
              y1={chartHeight / 2}
              x2={chartWidth - 20}
              y2={chartHeight / 2}
              stroke="#27272a"
              strokeDasharray="4, 4"
            />

            {/* Gradient Area */}
            <Path d={areaPath} fill="url(#areaGrad)" />
            {/* Outline Line */}
            <Path d={linePath} fill="none" stroke="#818cf8" strokeWidth={2.5} />
          </Svg>
        </View>

        {/* Section 3: Top Played Tracks */}
        {topTracks.length > 0 && (
          <View className="bg-card border border-zinc-800/80 rounded-2xl p-5">
            <Text className="text-white font-bold text-base mb-4">Top Tracks This Week</Text>
            {topTracks.map((item, idx) => (
              <View key={item.track.id} className="flex-row items-center py-2.5 border-b border-zinc-900">
                <Text className="text-zinc-500 font-mono text-xs w-6 font-bold">{idx + 1}</Text>
                {item.track.artwork ? (
                  <Image source={{ uri: item.track.artwork }} className="w-10 h-10 rounded-lg bg-zinc-800 mr-3" />
                ) : (
                  <View className="w-10 h-10 rounded-lg bg-zinc-800 mr-3 items-center justify-center">
                    <Music size={16} color="#71717a" />
                  </View>
                )}
                <View className="flex-1 mr-2">
                  <Text className="text-white font-semibold text-xs" numberOfLines={1}>
                    {item.track.title}
                  </Text>
                  <Text className="text-zinc-500 text-[10px] mt-0.5" numberOfLines={1}>
                    {item.track.artist}
                  </Text>
                </View>
                <View className="bg-zinc-800/80 px-2 py-0.5 rounded-full">
                  <Text className="text-zinc-400 text-[10px] font-mono font-medium">{item.count} plays</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

