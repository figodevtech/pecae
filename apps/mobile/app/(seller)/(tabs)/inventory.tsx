import React from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { PecaeBackground, PecaeButton } from '../../../src/components/PecaeUI';
import { usePecaeTheme } from '../../../src/theme';
import { useRouter } from 'expo-router';
import { useVehicles } from '../../../src/hooks/useVehicles';
import { useAuthStore } from '../../../src/store/auth-store';
import { VehicleInventoryCard } from '../../../src/components/VehicleWizard/VehicleInventoryCard';
import { Ionicons } from '@expo/vector-icons';

export default function InventoryScreen() {
  const { colors, typography, isDark } = usePecaeTheme();
  const router = useRouter();
  const { data: vehicles, isLoading, refetch } = useVehicles();

  const handleProfilePress = () => {
    Alert.alert(
      "Perfil",
      "O que você deseja fazer?",
      [
        { text: "Ver Perfil", onPress: () => router.push('/(seller)/(tabs)/perfil') },
        { 
          text: "Sair da Conta", 
          onPress: async () => {
            await useAuthStore.getState().clearAuth();
            router.replace('/(auth)/login');
          }, 
          style: 'destructive' 
        },
        { text: "Cancelar", style: 'cancel' }
      ]
    );
  };

  return (
    <PecaeBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={[
              styles.title, 
              { 
                color: colors.textPrimary, 
                fontFamily: typography.display,
                textShadowColor: colors.brand,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: isDark ? 10 : 0
              }
            ]}>
              MEU INVENTÁRIO
            </Text>
            <TouchableOpacity 
              onPress={handleProfilePress}
              style={[styles.profileButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
              accessibilityLabel="Perfil e Logout"
            >
              <Ionicons name="person-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <PecaeButton 
            title="Cadastrar Sucata" 
            onPress={() => router.push('/(seller)/cadastrar-sucata')}
            style={styles.addButton}
          />
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.brand} />
          </View>
        ) : (
          <FlatList
            data={vehicles}
            renderItem={({ item }) => <VehicleInventoryCard vehicle={item} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.brand} />
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={[styles.emptyText, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Você ainda não possui veículos cadastrados.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60, // Space for header
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    marginBottom: 0,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  addButton: {
    width: '100%',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
  },
});
