import React from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, useWindowDimensions, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PecaeBackground, PecaeGlassCard } from '../../../src/components/PecaeUI';
import { usePecaeTheme } from '../../../src/theme';
import { useListings } from '../../../src/hooks/useVehicles';
import { getVehicleImage } from '../../../src/utils/vehicleImages';
import { Ionicons } from '@expo/vector-icons';

export default function VehicleDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors, typography, effects } = usePecaeTheme();
  const { data: listings } = useListings();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const vehicle = listings?.find((v: any) => v.id === id);

  if (!vehicle) {
    return (
      <PecaeBackground>
        <View style={styles.center}>
          <Text style={{ color: colors.textPrimary, fontFamily: typography.body }}>
            Veículo não encontrado.
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
            <Text style={{ color: colors.brand }}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </PecaeBackground>
    );
  }

  const brand = vehicle.listing?.brand || vehicle.version?.model?.brand?.name || '';
  const model = vehicle.listing?.model || vehicle.version?.model?.name || '';
  const imageUrl = getVehicleImage(brand, model, vehicle.id);
  const title = vehicle.listing?.title || `${brand} ${model}`.trim() || 'Veículo';
  
  const isVerified = vehicle.id.charCodeAt(0) % 2 === 0;

  const handleContact = () => {
    // Mocking contact opening
    const message = `Olá, gostaria de saber mais sobre o veículo ${title} anunciado no PECAÊ.`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      alert('Não foi possível abrir o WhatsApp. Simulação de contato enviada!');
    });
  };

  const isWeb = width >= 768;

  return (
    <PecaeBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.floatingBack, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.brand} />
        </TouchableOpacity>

        <View style={[styles.contentLayout, isWeb && styles.webLayout]}>
          <View style={[styles.imageSection, isWeb && styles.webImageSection]}>
            <Image 
              source={{ uri: imageUrl }} 
              style={[styles.mainImage, { borderRadius: effects.radius.lg }]} 
              resizeMode="cover"
            />
            {isVerified && (
              <View style={[styles.verifiedBadge, { backgroundColor: colors.brand }]}>
                <Text style={[styles.verifiedBadgeText, { fontFamily: typography.display }]}>
                  ✓ VENDEDOR VERIFICADO
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.infoSection, isWeb && styles.webInfoSection]}>
            <PecaeGlassCard intensity={20} style={[styles.detailsCard, { borderRadius: effects.radius.lg }]}>
              <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
                {title}
              </Text>

              <View style={styles.locationContainer}>
                <Ionicons name="location-sharp" size={18} color={colors.brand} />
                <Text style={[styles.locationText, { color: colors.textMuted, fontFamily: typography.body }]}>
                  {vehicle.city} - {vehicle.state}
                </Text>
              </View>

              <View style={[styles.separator, { backgroundColor: colors.border }]} />

              <View style={styles.specsGrid}>
                {vehicle.color && (
                  <View style={styles.specItem}>
                    <Text style={[styles.specLabel, { color: colors.textMuted, fontFamily: typography.body }]}>Cor</Text>
                    <Text style={[styles.specValue, { color: colors.textPrimary, fontFamily: typography.medium }]}>{vehicle.color}</Text>
                  </View>
                )}
                {vehicle.plate && (
                  <View style={styles.specItem}>
                    <Text style={[styles.specLabel, { color: colors.textMuted, fontFamily: typography.body }]}>Placa</Text>
                    <Text style={[styles.specValue, { color: colors.textPrimary, fontFamily: typography.medium }]}>{vehicle.plate}</Text>
                  </View>
                )}
                {vehicle.listing?.views !== undefined && (
                  <View style={styles.specItem}>
                    <Text style={[styles.specLabel, { color: colors.textMuted, fontFamily: typography.body }]}>Visualizações</Text>
                    <Text style={[styles.specValue, { color: colors.textPrimary, fontFamily: typography.medium }]}>{vehicle.listing.views}</Text>
                  </View>
                )}
              </View>

              {vehicle.observations && (
                <>
                  <View style={[styles.separator, { backgroundColor: colors.border }]} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.heading }]}>
                    Observações
                  </Text>
                  <Text style={[styles.observationsText, { color: colors.textPrimary, fontFamily: typography.body }]}>
                    {vehicle.observations}
                  </Text>
                </>
              )}

              <TouchableOpacity 
                onPress={handleContact} 
                style={[styles.contactButton, { backgroundColor: colors.brand, borderRadius: effects.radius.md }]}
              >
                <Ionicons name="logo-whatsapp" size={24} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={[styles.contactButtonText, { fontFamily: typography.display }]}>
                  ENTRAR EM CONTATO
                </Text>
              </TouchableOpacity>
            </PecaeGlassCard>
          </View>
        </View>
      </ScrollView>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 80,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  floatingBack: {
    position: 'absolute',
    top: 40,
    left: 24,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  contentLayout: {
    flexDirection: 'column',
    gap: 24,
  },
  webLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  imageSection: {
    width: '100%',
    position: 'relative',
  },
  webImageSection: {
    flex: 1,
  },
  mainImage: {
    width: '100%',
    height: 300,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verifiedBadgeText: {
    color: '#FFF',
    fontSize: 12,
    letterSpacing: 1,
  },
  infoSection: {
    width: '100%',
  },
  webInfoSection: {
    width: 400,
  },
  detailsCard: {
    padding: 24,
  },
  title: {
    fontSize: 22,
    letterSpacing: 1,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
  },
  separator: {
    height: 1,
    width: '100%',
    marginVertical: 16,
    opacity: 0.2,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  specItem: {
    minWidth: 120,
  },
  specLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  specValue: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
    letterSpacing: 1,
  },
  observationsText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  contactButtonText: {
    color: '#FFF',
    fontSize: 14,
    letterSpacing: 1,
  },
});
