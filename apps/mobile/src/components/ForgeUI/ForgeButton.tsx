import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useForgeTheme } from '../../theme';

interface ForgeButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const ForgeButton: React.FC<ForgeButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  variant = 'primary',
}) => {
  const { colors, typography, effects } = useForgeTheme();

  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
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
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isPrimary ? '#000' : colors.brand} />
        ) : (
          <Text
            style={[
              styles.text,
              {
                color: isPrimary ? '#000' : colors.brand,
                fontFamily: typography.display,
              },
              textStyle,
            ]}
          >
            {title.toUpperCase()}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
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
  text: {
    fontSize: 16,
    letterSpacing: 1.2,
    fontWeight: 'bold',
  },
});
