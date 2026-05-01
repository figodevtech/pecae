import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePecaeTheme } from '../../src/theme';
import { PecaeBackground } from '../../src/components/PecaeUI/PecaeBackground';
import { PecaeGlassCard } from '../../src/components/PecaeUI/PecaeGlassCard';
import { useNegotiations, Negotiation } from '../../src/hooks/useNegotiations';

export default function Negociacoes() {
  const { colors, typography, isDark } = usePecaeTheme();
  const { data: negotiations, isLoading, refetch, isRefetching } = useNegotiations();

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
              <NegotiationItem key={item.id} negotiation={item} />
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
                Fale com um vendedor sobre um veículo para iniciar uma negociação.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </PecaeBackground>
  );
}

const NegotiationItem: React.FC<{ negotiation: Negotiation }> = ({ negotiation }) => {
  const { colors, typography, effects, isDark } = usePecaeTheme();
  const router = useRouter();

  const title = negotiation.vehicle 
    ? `${negotiation.vehicle.brand} ${negotiation.vehicle.model}`.toUpperCase()
    : (negotiation.listing?.title || 'NEGOCIAÇÃO').toUpperCase();

  const subtitle = negotiation.vehicle
    ? negotiation.vehicle.version
    : negotiation.seller.storeName;

  const thumbnail = negotiation.vehicle?.thumbnail || 'https://via.placeholder.com/150?text=PECAÊ';

  return (
    <TouchableOpacity 
      onPress={() => router.push({
        pathname: '/(tabs)/chat/[id]',
        params: { 
          id: negotiation.id,
          vehicleId: negotiation.vehicle?.id
        }
      })}
      activeOpacity={0.7}
      style={styles.itemWrapper}
    >
      <PecaeGlassCard intensity={isDark ? 10 : 35} style={styles.itemContainer}>
        <Image 
          source={{ uri: thumbnail }} 
          style={[styles.thumbnail, { borderRadius: effects.radius.sm }]} 
        />
        <View style={styles.itemInfo}>
          <View style={styles.itemHeader}>
            <Text style={[styles.itemTitle, { color: colors.textPrimary, fontFamily: typography.display }]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={[styles.itemTime, { color: colors.textMuted, fontFamily: typography.body }]}>
              {new Date(negotiation.lastInteraction).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </Text>
          </View>
          
          <View style={styles.sellerRow}>
            <Ionicons name="storefront-outline" size={12} color={colors.brand} />
            <Text style={[styles.itemSeller, { color: colors.brand, fontFamily: typography.bold }]} numberOfLines={1}>
              {negotiation.seller.storeName}
            </Text>
          </View>

          <Text style={[styles.subtitle, { color: colors.textPrimary, fontFamily: typography.body }]} numberOfLines={1}>
            {subtitle}
          </Text>

          {negotiation.lastMessage && (
            <Text style={[styles.lastMessage, { color: colors.textMuted, fontFamily: typography.body }]} numberOfLines={1}>
              "{negotiation.lastMessage}"
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={styles.chevron} />
      </PecaeGlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSpacer: {
    height: 100,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 100,
    alignItems: 'center',
  },
  itemWrapper: {
    marginBottom: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  thumbnail: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  itemTime: {
    fontSize: 10,
    opacity: 0.6,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  itemSeller: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.6,
  },
  chevron: {
    marginLeft: 'auto',
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
    opacity: 0.7,
  },
});
