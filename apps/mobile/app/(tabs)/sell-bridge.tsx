import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { usePecaeTheme } from '../../src/theme';

export default function SellBridgeScreen() {
  const router = useRouter();
  const { colors } = usePecaeTheme();

  useEffect(() => {
    // Redirect to the actual registration flow
    router.replace('/(seller)/cadastrar-sucata');
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );
}
