import React, { useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePecaeTheme } from '../../theme';

interface PecaeButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'outline';
  leftIcon?: React.ReactNode;
}

export const PecaeButton: React.FC<PecaeButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  variant = 'primary',
  leftIcon,
}) => {
  const { colors, typography, effects } = usePecaeTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const isPrimary = variant === 'primary';

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: disabled ? 0.6 : 1 }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        style={[styles.button, { borderRadius: effects.radius.md }, style]}
      >
        <LinearGradient
          colors={
            disabled
              ? ['#ccc', '#bbb']
              : isPrimary
              ? [colors.brand, colors.vibrant]
              : ['transparent', 'transparent']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            {
              borderRadius: effects.radius.md,
              borderWidth: variant === 'outline' ? 1 : 0,
              borderColor: colors.brand,
              borderTopWidth: isPrimary ? 1 : 0,
              borderTopColor: 'rgba(255, 255, 255, 0.4)', // Inner highlight
            },
          ]}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={isPrimary ? '#000' : colors.brand} size="small" />
              <Text style={[styles.loadingText, { color: isPrimary ? '#000' : colors.brand, fontFamily: typography.display }]}>
                PROCESSING_FORGE...
              </Text>
            </View>
          ) : (
            <View style={styles.contentRow}>
              {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
              <Text
                numberOfLines={1}
                style={[
                  styles.text,
                  {
                    color: isPrimary ? '#000' : colors.textPrimary,
                    fontFamily: typography.display,
                  },
                  textStyle,
                ]}
              >
                {title.toUpperCase()}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 56,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 9,
    letterSpacing: 1.5,
  },
  iconContainer: {
    marginRight: 10,
  },
  text: {
    fontSize: 14,
    letterSpacing: 2,
  },
});
