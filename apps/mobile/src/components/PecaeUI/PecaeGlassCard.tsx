import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, ViewStyle, Platform, Animated, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import { usePecaeTheme } from '../../theme';

interface PecaeGlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  padding?: number;
  pulse?: boolean;
}

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export const PecaeGlassCard: React.FC<PecaeGlassCardProps> = ({
  children,
  style,
  intensity = 20,
  padding = 20,
  pulse = false,
}) => {
  const { colors, effects, isDark } = usePecaeTheme();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (pulse) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [pulse]);

  const animatedBorderColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, isDark ? 'rgba(63, 255, 139, 0.6)' : 'rgba(45, 140, 78, 0.6)'],
  });

  const animatedShadowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [isDark ? 0.04 : 0, 0.4],
  });

  const animatedShadowRadius = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 25],
  });

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          borderRadius: effects.radius.md,
          shadowColor: isDark ? colors.brand : colors.brand,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: pulse ? animatedShadowOpacity : (isDark ? 0.04 : 0),
          shadowRadius: pulse ? animatedShadowRadius : 10,
          elevation: isDark ? 2 : 0,
        }, 
        style
      ]}
    >
      <AnimatedBlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.blur,
          {
            borderRadius: effects.radius.md,
            backgroundColor: colors.surface,
            borderColor: pulse ? animatedBorderColor : colors.border,
            borderTopColor: isDark ? 'rgba(63, 255, 139, 0.3)' : 'rgba(255, 255, 255, 0.6)',
            borderLeftColor: isDark ? 'rgba(63, 255, 139, 0.3)' : 'rgba(255, 255, 255, 0.6)',
          },
        ]}
      >
        <View style={[styles.content, { padding }]}>{children}</View>
      </AnimatedBlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: Platform.OS === 'ios' ? 'visible' : 'hidden',
    borderWidth: 0,
  },
  blur: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    width: '100%',
  },
});
