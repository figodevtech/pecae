import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { PecaeBackground } from '../../../src/components/PecaeUI';
import { usePecaeTheme } from '../../../src/theme';

export default function SalesScreen() {
  const { colors } = usePecaeTheme();
  return (
    <PecaeBackground>
      <View style={styles.container}>
        <Text style={{ color: colors.textPrimary }}>Histórico de Vendas</Text>
        <Text style={{ color: colors.textMuted }}>Em breve...</Text>
      </View>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
