import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Switch, TextInput, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useSavedSearches } from '../../src/hooks/useSavedSearches';
import { usePecaeTheme } from '../../src/theme';
import { PecaeBackground } from '../../src/components/PecaeUI/PecaeBackground';
import { PecaeGlassCard } from '../../src/components/PecaeUI/PecaeGlassCard';

export default function BuscasSalvasScreen() {
  const router = useRouter();
  const { colors, typography, isDark } = usePecaeTheme();
  const { getSavedSearches, toggleAlert, deleteSavedSearch, createSavedSearch } = useSavedSearches();
  
  const [newSearch, setNewSearch] = useState('');

  const handleToggleAlert = (id: string, currentStatus: boolean) => {
    toggleAlert.mutate({ id, alertActive: !currentStatus });
  };

  const handleRemoveSearch = (id: string) => {
    deleteSavedSearch.mutate(id);
  };

  const handleAddSearch = () => {
    if (!newSearch.trim()) return;
    createSavedSearch.mutate(
      { query: newSearch, alertActive: true },
      {
        onSuccess: () => {
          setNewSearch('');
        }
      }
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <PecaeGlassCard style={styles.card} intensity={isDark ? 10 : 35}>
        <View style={styles.cardInfo}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
              {item.query || 'Busca sem termo'}
            </Text>
            <TouchableOpacity 
              style={[styles.deleteButton, { backgroundColor: colors.error + '10' }]}
              onPress={() => handleRemoveSearch(item.id)}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.cardDate, { color: colors.textMuted, fontFamily: typography.mono }]}>
            SALVA EM: {new Date(item.createdAt).toLocaleDateString('pt-BR')}
          </Text>
        </View>
        
        <View style={[styles.cardActions, { borderTopColor: colors.border + '30' }]}>
          <View style={styles.toggleContainer}>
            <View style={[styles.alertIconBox, { backgroundColor: item.alertActive ? colors.brand + '15' : colors.textMuted + '15' }]}>
              <Ionicons 
                name={item.alertActive ? "notifications" : "notifications-off"} 
                size={14} 
                color={item.alertActive ? colors.brand : colors.textMuted} 
              />
            </View>
            <Text style={[styles.toggleLabel, { color: colors.textPrimary, fontFamily: typography.medium }]}>
              Receber Alertas
            </Text>
          </View>
          <Switch
            value={item.alertActive}
            onValueChange={() => handleToggleAlert(item.id, item.alertActive)}
            trackColor={{ false: '#CBD5E1', true: colors.brand }}
            thumbColor={'#ffffff'}
          />
        </View>
      </PecaeGlassCard>
    );
  };

  return (
    <PecaeBackground>
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            headerShown: true,
            title: 'Buscas Salvas',
            headerTransparent: true,
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { fontFamily: typography.display, fontSize: 18 },
          }}
        />

        <View style={styles.headerSpacer} />

        <View style={styles.addSection}>
          <PecaeGlassCard style={styles.inputCard} intensity={isDark ? 30 : 60}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, fontFamily: typography.body }]}
                placeholder="Salvar nova busca..."
                placeholderTextColor={colors.textMuted}
                value={newSearch}
                onChangeText={setNewSearch}
              />
              <TouchableOpacity 
                style={[
                  styles.addButton, 
                  { backgroundColor: newSearch.trim() ? colors.brand : colors.textMuted + '20' }
                ]} 
                onPress={handleAddSearch}
                disabled={!newSearch.trim() || createSavedSearch.isPending}
              >
                {createSavedSearch.isPending ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Ionicons name="add" size={24} color={newSearch.trim() ? "#000" : colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>
          </PecaeGlassCard>
        </View>

        <View style={styles.limitInfo}>
          <Text style={[styles.limitText, { color: colors.textMuted, fontFamily: typography.mono }]}>
            {getSavedSearches.data?.length || 0} / 10 BUSCAS UTILIZADAS
          </Text>
        </View>

        {getSavedSearches.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.brand} />
          </View>
        ) : getSavedSearches.isError ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.textPrimary, fontFamily: typography.display }]}>
              Ops! Erro ao carregar
            </Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.brand }]}
              onPress={() => getSavedSearches.refetch()}
            >
              <Text style={styles.retryButtonText}>Recarregar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlashList
            data={getSavedSearches.data || []}
            renderItem={renderItem}
            estimatedItemSize={140}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconBox, { backgroundColor: colors.brand + '10' }]}>
                  <Ionicons name="search-outline" size={48} color={colors.brand} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                  Nenhuma busca salva
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Salve suas buscas para ser alertado quando novos anúncios chegarem ao marketplace.
                </Text>
              </View>
            }
            refreshing={getSavedSearches.isFetching}
            onRefresh={getSavedSearches.refetch}
          />
        )}
      </SafeAreaView>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSpacer: {
    height: 80,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  addSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 8,
  },
  inputCard: {
    padding: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  limitInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'flex-end',
  },
  limitText: {
    fontSize: 9,
    letterSpacing: 1,
    opacity: 0.7,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 20,
    padding: 0,
    marginBottom: 16,
  },
  cardInfo: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
  },
  cardDate: {
    fontSize: 10,
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: {
    fontSize: 14,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#000',
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
  },
});
