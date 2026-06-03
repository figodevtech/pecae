import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePecaeTheme } from '../../theme';

interface StatWidgetProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
}

export const StatWidget: React.FC<StatWidgetProps> = ({ icon, value, label }) => {
  const { colors, typography } = usePecaeTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${colors.brand}20` }]}>
        <Ionicons key={icon} name={icon} size={20} color={colors.brand} />
      </View>
      <Text style={[styles.value, { color: colors.textPrimary, fontFamily: typography.display }]}>
        {value}
      </Text>
      <Text style={[styles.label, { color: colors.textMuted, fontFamily: typography.body }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
