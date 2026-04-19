import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useForgeTheme } from '../../theme';

interface ForgeInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const ForgeInput: React.FC<ForgeInputProps> = ({
  label,
  error,
  containerStyle,
  ...props
}) => {
  const { colors, typography, effects, isDark } = useForgeTheme();
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
    paddingHorizontal: 16,
  },
  input: {
    fontSize: 16,
    height: '100%',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});
