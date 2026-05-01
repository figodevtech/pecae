import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePecaeTheme } from '../../src/theme';
import { PecaeBackground } from '../../src/components/PecaeUI/PecaeBackground';
import { PecaeGlassCard } from '../../src/components/PecaeUI/PecaeGlassCard';
import { useNegotiations } from '../../src/hooks/useNegotiations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Negociacoes() {
  const { colors, typography, isDark } = usePecaeTheme();
  const router = useRouter();
  const { data: negotiations, isLoading, refetch, isRefetching } = useNegotiations();

  const formatCurrency = (value: number | null) => {
    if (value === null) return 'Sob Consulta';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return '#22c55e';
      case 'SOLD': return colors.textMuted;
      case 'EXPIRED': return '#ef4444';
      default: return colors.brand;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'DISPONÍVEL';
      case 'SOLD': return 'VENDIDO';
      case 'EXPIRED': return 'INDISPONÍVEL';
      default: return status;
    }
  };

  return (
    <PecaeBackground>
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            headerShown: true,
            title: 'Minhas Negociações',
            headerTransparent: true,
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { fontFamily: typography.display, fontSize: 18 },
          }}
        />

        <View style={styles.headerSpacer} />

        <ScrollView 
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={isRefetching} 
              onRefresh={refetch} 
              tintColor={colors.brand}
            />
          }
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.brand} />
            </View>
          ) : negotiations && negotiations.length > 0 ? (
            negotiations.map((item) => (
              <PecaeGlassCard 
                key={item.id} 
                style={styles.card}
                intensity={isDark ? 10 : 35}
              >
                <TouchableOpacity 
                  onPress={() => router.push(`/chat/${item.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardInner}>
                    {item.listing.thumbnail ? (
                      <Image source={{ uri: item.listing.thumbnail }} style={styles.cardImg} />
                    ) : (
                      <View style={[styles.cardImg, { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="car-outline" size={32} color={colors.textMuted} />
                      </View>
                    )}
                    <View style={styles.cardBody}>
                      <Text 
                        style={[styles.veiculoTitle, { color: colors.textPrimary, fontFamily: typography.display }]}
                        numberOfLines={1}
                      >
                        {item.listing.title}
                      </Text>
                      
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: colors.textMuted, fontFamily: typography.mono }]}>VENDEDOR</Text>
                        <Text style={[styles.infoValue, { color: colors.textPrimary, fontFamily: typography.body }]} numberOfLines={1}>
                          {item.seller.storeName}
                        </Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: colors.textMuted, fontFamily: typography.mono }]}>ÚLTIMA INTERAÇÃO</Text>
                        <Text style={[styles.infoValue, { color: colors.textPrimary, fontFamily: typography.body }]}>
                          {format(new Date(item.lastInteraction), "dd 'de' MMM", { locale: ptBR })}
                        </Text>
                      </View>

                      {item.lastMessage && (
                        <Text 
                          style={[styles.lastMessage, { color: colors.textMuted, fontFamily: typography.body }]}
                          numberOfLines={1}
                        >
                          "{item.lastMessage}"
                        </Text>
                      )}

                      <View style={[styles.cardFooter, { borderTopColor: colors.border + '30' }]}>
                        <Text style={[styles.price, { color: colors.brand, fontFamily: typography.display }]}>
                          {formatCurrency(item.listing.price)}
                        </Text>
                        <View style={[styles.statusBadge, { 
                          backgroundColor: getStatusColor(item.listing.status) + '15', 
                          borderColor: getStatusColor(item.listing.status) + '40' 
                        }]}>
                          <Text style={[styles.statusText, { color: getStatusColor(item.listing.status), fontFamily: typography.mono }]}>
                            {getStatusLabel(item.listing.status)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  <View style={[styles.detailsBtn, { borderTopColor: colors.border + '30' }]}>
                    <Text style={[styles.detailsBtnText, { color: colors.brand, fontFamily: typography.medium }]}>
                      Continuar Conversa
                    </Text>
                    <Ionicons name="chatbubbles-outline" size={16} color={colors.brand} />
                  </View>
                </TouchableOpacity>
              </PecaeGlassCard>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconBox, { backgroundColor: colors.brand + '10' }]}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.brand} />
              </View>
              <Text style={[styles.emptyText, { color: colors.textPrimary, fontFamily: typography.display }]}>
                Nenhuma negociação
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted, fontFamily: typography.body }]}>
                Inicie um chat em qualquer anúncio para começar uma negociação.
              </Text>
              <TouchableOpacity 
                style={[styles.browseButton, { backgroundColor: colors.brand }]}
                onPress={() => router.push('/(tabs)')}
              >
                <Text style={styles.browseButtonText}>Explorar Veículos</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 100,
    alignItems: 'center',
  },
  card: {
    marginBottom: 20,
    padding: 0,
  },
  cardInner: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  cardImg: {
    width: 100,
    height: 100,
    borderRadius: 14,
  },
  cardBody: {
    flex: 1,
  },
  veiculoTitle: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 8,
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  infoValue: {
    fontSize: 11,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    opacity: 0.8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 8,
  },
  detailsBtnText: {
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
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
  emptyText: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  browseButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  browseButtonText: {
    color: '#000',
    fontWeight: '700',
  },
});
