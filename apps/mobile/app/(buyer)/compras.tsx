import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePecaeTheme } from '../../src/theme';
import { PecaeBackground } from '../../src/components/PecaeUI/PecaeBackground';
import { PecaeGlassCard } from '../../src/components/PecaeUI/PecaeGlassCard';

export default function MinhasCompras() {
  const { colors, typography, isDark } = usePecaeTheme();
  const router = useRouter();

  // Mocks de Compras Realizadas
  const comprasMock = [
    {
      id: '1',
      veiculo: 'Honda Civic Touring 2021',
      data: '24 Abr 2026',
      valor: 'R$ 132.900,00',
      status: 'Concluída',
      vendedor: 'AutoParts Premium',
      img: 'https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=400&q=80',
    },
    {
      id: '2',
      veiculo: 'Motor Completo AP 1.8 Turbo',
      data: '15 Mar 2026',
      valor: 'R$ 7.850,00',
      status: 'Concluída',
      vendedor: 'Desmanche do Alemão',
      img: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=400&q=80',
    },
  ];

  return (
    <PecaeBackground>
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            headerShown: true,
            title: 'Minhas Compras',
            headerTransparent: true,
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { fontFamily: typography.display, fontSize: 18 },
          }}
        />

        <View style={styles.headerSpacer} />

        <ScrollView 
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {comprasMock.map((compra) => (
            <PecaeGlassCard 
              key={compra.id} 
              style={styles.card}
              intensity={isDark ? 10 : 35}
            >
              <View style={styles.cardInner}>
                <Image source={{ uri: compra.img }} style={styles.cardImg} />
                <View style={styles.cardBody}>
                  <Text 
                    style={[styles.veiculoTitle, { color: colors.textPrimary, fontFamily: typography.display }]}
                    numberOfLines={2}
                  >
                    {compra.veiculo}
                  </Text>
                  
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textMuted, fontFamily: typography.mono }]}>VENDEDOR</Text>
                    <Text style={[styles.infoValue, { color: colors.textPrimary, fontFamily: typography.body }]}>{compra.vendedor}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textMuted, fontFamily: typography.mono }]}>DATA</Text>
                    <Text style={[styles.infoValue, { color: colors.textPrimary, fontFamily: typography.body }]}>{compra.data}</Text>
                  </View>

                  <View style={[styles.cardFooter, { borderTopColor: colors.border + '30' }]}>
                    <Text style={[styles.price, { color: colors.brand, fontFamily: typography.display }]}>
                      {compra.valor}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: '#22c55e15', borderColor: '#22c55e40' }]}>
                      <Text style={[styles.statusText, { color: '#22c55e', fontFamily: typography.mono }]}>
                        {compra.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity style={[styles.detailsBtn, { borderTopColor: colors.border + '30' }]}>
                <Text style={[styles.detailsBtnText, { color: colors.brand, fontFamily: typography.medium }]}>
                  Ver Detalhes do Pedido
                </Text>
                <Ionicons name="arrow-forward" size={16} color={colors.brand} />
              </TouchableOpacity>
            </PecaeGlassCard>
          ))}
          
          {comprasMock.length === 0 && (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconBox, { backgroundColor: colors.brand + '10' }]}>
                <Ionicons name="cart-outline" size={48} color={colors.brand} />
              </View>
              <Text style={[styles.emptyText, { color: colors.textPrimary, fontFamily: typography.display }]}>
                Nenhuma compra ainda
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted, fontFamily: typography.body }]}>
                Seus pedidos concluídos aparecerão aqui.
              </Text>
              <TouchableOpacity 
                style={[styles.browseButton, { backgroundColor: colors.brand }]}
                onPress={() => router.push('/(tabs)')}
              >
                <Text style={styles.browseButtonText}>Ir para a Loja</Text>
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
    width: 90,
    height: 90,
    borderRadius: 14,
  },
  cardBody: {
    flex: 1,
  },
  veiculoTitle: {
    fontSize: 15,
    marginBottom: 10,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  infoValue: {
    fontSize: 12,
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
    fontSize: 16,
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
