import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { usePecaeTheme } from '../../theme';

interface PecaeInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const PecaeInput: React.FC<PecaeInputProps> = ({
  label,
  error,
  containerStyle,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const { colors, typography, effects, isDark } = usePecaeTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.textMuted, fontFamily: typography.medium }]}>
          {label.toUpperCase()}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            borderRadius: effects.radius.sm,
            borderColor: error ? colors.error : isFocused ? colors.brand : colors.border,
            borderWidth: 1,
          },
        ]}
      >
        <View style={styles.inputRow}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <TextInput
            {...props}
            placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                fontFamily: typography.body,
              },
              props.style,
            ]}
          />
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      </View>
      {error && (
        <Text style={[styles.errorText, { color: colors.error, fontFamily: typography.body }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputWrapper: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
    paddingHorizontal: 12,
  },
  iconLeft: {
    paddingLeft: 12,
  },
  iconRight: {
    paddingRight: 12,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});
