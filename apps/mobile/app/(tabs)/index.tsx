import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { ForgeBackground, ForgeGlassCard } from '../../src/components/ForgeUI';
import { useForgeTheme } from '../../src/theme';

export default function BuyerHomeScreen() {
  const { colors, typography } = useForgeTheme();

  return (
    <ForgeBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
            PECAÊ // TERMINAL
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
            Sincronizado com a Rede de Peças Automotivas.
          </Text>
        </View>

        <ForgeGlassCard intensity={20} style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.brand, fontFamily: typography.display }]}>
            SISTEMA OPERACIONAL
          </Text>
          <Text style={[styles.cardText, { color: colors.textPrimary, fontFamily: typography.body }]}>
            Bem-vindo ao terminal de busca. Encontre componentes e veículos com procedência verificada.
          </Text>
        </ForgeGlassCard>

        <View style={styles.placeholderGrid}>
          {[1, 2, 3, 4].map((i) => (
            <ForgeGlassCard key={i} intensity={10} style={styles.gridItem}>
              <View style={[styles.placeholderImage, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
              <Text style={[styles.itemTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                ITEM_00{i}
              </Text>
              <Text style={[styles.itemPrice, { color: colors.brand, fontFamily: typography.mono }]}>
                R$ 0,00
              </Text>
            </ForgeGlassCard>
          ))}
        </View>
      </ScrollView>
    </ForgeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.6,
  },
  card: {
    padding: 20,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 14,
    marginBottom: 8,
    letterSpacing: 2,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  placeholderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: '47%',
    padding: 12,
  },
  placeholderImage: {
    width: '100%',
    height: 100,
    borderRadius: 4,
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 12,
    letterSpacing: 1,
  },
  itemPrice: {
    fontSize: 14,
    marginTop: 4,
  },
});
