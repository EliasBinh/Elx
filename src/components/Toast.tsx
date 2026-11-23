import React, { useState, useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

type ToastListener = (msg: string) => void;
let toastListener: ToastListener | null = null;

export function showToast(message: string) {
  if (toastListener) {
    toastListener(message);
  }
}

export const Toast: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    toastListener = (msg: string) => {
      setMessage(msg);
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(2600),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMessage(null);
      });
    };

    return () => {
      toastListener = null;
    };
  }, [fadeAnim]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View className="bg-zinc-900/95 border border-zinc-700/80 px-4 py-2.5 rounded-2xl shadow-xl flex-row items-center">
        <Text className="text-white text-xs font-medium text-center">{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 84, // slightly above mini player
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
  },
});

