import React from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useForgeTheme } from '../../theme';

interface ForgeGlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export const ForgeGlassCard: React.FC<ForgeGlassCardProps> = ({
  children,
  style,
  intensity = 20,
}) => {
  const { colors, effects, isDark } = useForgeTheme();

  return (
    <View style={[styles.container, { borderRadius: effects.radius.md }, style]}>
      <BlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.blur,
          {
            borderRadius: effects.radius.md,
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.content}>{children}</View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent', // Base for no-line, color controlled by blur border
  },
  blur: {
    padding: 20,
    borderWidth: 1,
  },
  content: {
    width: '100%',
  },
});
