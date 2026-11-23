import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Music } from 'lucide-react-native';

interface CoverCollageProps {
  urls?: string[];
  size?: number;
  borderRadius?: number;
  className?: string;
}

export const CoverCollage: React.FC<CoverCollageProps> = ({
  urls = [],
  size = 56,
  borderRadius = 12,
  className = '',
}) => {
  const validUrls = urls.filter(Boolean);
  const halfSize = size / 2;

  if (validUrls.length >= 4) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius,
          overflow: 'hidden',
          backgroundColor: '#18181b',
        }}
        className={`flex-row flex-wrap ${className}`}
      >
        <Image
          source={{ uri: validUrls[0] }}
          style={{ width: halfSize, height: halfSize }}
          resizeMode="cover"
        />
        <Image
          source={{ uri: validUrls[1] }}
          style={{ width: halfSize, height: halfSize }}
          resizeMode="cover"
        />
        <Image
          source={{ uri: validUrls[2] }}
          style={{ width: halfSize, height: halfSize }}
          resizeMode="cover"
        />
        <Image
          source={{ uri: validUrls[3] }}
          style={{ width: halfSize, height: halfSize }}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (validUrls.length > 0) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius,
          overflow: 'hidden',
          backgroundColor: '#18181b',
        }}
        className={className}
      >
        <Image
          source={{ uri: validUrls[0] }}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        backgroundColor: '#27272a',
      }}
      className={`items-center justify-center border border-zinc-800 ${className}`}
    >
      <Music size={size * 0.45} color="#71717a" />
    </View>
  );
};

