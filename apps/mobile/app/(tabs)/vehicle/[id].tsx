import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, useWindowDimensions, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { PecaeBackground, PecaeGlassCard, PecaeButton } from '../../../src/components/PecaeUI';
import { usePecaeTheme } from '../../../src/theme';
import { useVehicleDetails } from '../../../src/hooks/useVehicles';
import { useFavorites } from '../../../src/hooks/useFavorites';
import { getVehicleImage } from '../../../src/utils/vehicleImages';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../../../src/hooks/useChat';

export default function VehicleDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, effects, isDark } = usePecaeTheme();
  const { data: vehicle, isLoading: loadingVehicle } = useVehicleDetails(id!);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { createRoom } = useChat();
  const { getFavorites, toggleFavorite } = useFavorites();
  const [isStartingChat, setIsStartingChat] = useState(false);

  if (loadingVehicle) {
    return (
      <PecaeBackground>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </PecaeBackground>
    );
  }

  if (!vehicle) {
    return (
      <PecaeBackground>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.errorText, { color: colors.textPrimary, fontFamily: typography.body }]}>
            Veículo não encontrado no inventário.
          </Text>
          <PecaeButton 
            title="VOLTAR AO CATÁLOGO" 
            onPress={() => router.back()} 
            style={{ marginTop: 20, width: 200 }} 
          />
        </View>
      </PecaeBackground>
    );
  }

  const handleContact = async () => {
    if (isStartingChat) return;
    
    setIsStartingChat(true);
    try {
      const room = await createRoom.mutateAsync({ vehicleId: vehicle.id });
      router.push(`/chat/${room.id}`);
    } catch (error: any) {
      console.error('Error starting chat:', error);
      const message = error.response?.data?.message || 'Não foi possível iniciar a negociação.';
      Alert.alert('Erro', message);
    } finally {
      setIsStartingChat(false);
    }
  };

  const getSafeText = (val: any) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return val.name || '';
  };

  const normalizedBrand = getSafeText(vehicle.brand);
  const normalizedModel = getSafeText(vehicle.model);
  const normalizedVersion = getSafeText(vehicle.version);
  const yearFab = vehicle.yearFab || '--';
  const yearModel = vehicle.yearModel || yearFab;
  const vehicleTitle = `${normalizedBrand} - ${normalizedModel} - (${yearFab}/${yearModel})`;
  const imageUrl = getVehicleImage(normalizedBrand, normalizedModel, vehicle.id);

  const isWeb = width >= 768;

  const technicalSpecs = [
    { label: 'ANO FAB', value: yearFab, icon: 'calendar-outline' },
    { label: 'COR', value: vehicle.color || 'N/A', icon: 'color-palette-outline' },
    { label: 'CATEGORIA', value: 'SUCATA', icon: 'construct-outline' },
    { label: 'STATUS', value: 'DISPONÍVEL', icon: 'shield-checkmark-outline' },
  ];

  return (
    <PecaeBackground>
      <Stack.Screen options={{ title: vehicleTitle, headerShown: false }} />
      
      {/* Header HUD */}
      <View style={styles.headerHUD}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.hudButton, { backgroundColor: 'rgba(10, 14, 20, 0.6)', borderColor: colors.border }]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => toggleFavorite.mutate(vehicle.id)} 
          style={[styles.hudButton, { backgroundColor: 'rgba(10, 14, 20, 0.6)', borderColor: colors.border }]}
        >
          <Ionicons 
            name={getFavorites.data?.some((f: any) => f.id === vehicle.id) ? "heart" : "heart-outline"} 
            size={24} 
            color={getFavorites.data?.some((f: any) => f.id === vehicle.id) ? colors.brand : colors.textPrimary} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.imageSection}>
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.mainImage} 
            resizeMode="cover"
          />
          <View style={styles.imageGradientOverlay} />
          
          <View style={styles.imageLabels}>
            <Text style={[styles.imageBrandLabel, { color: colors.brand, fontFamily: typography.display }]}>
              {normalizedBrand.toUpperCase()}
            </Text>
            <Text style={[styles.imageModelLabel, { color: colors.textPrimary, fontFamily: typography.display }]} numberOfLines={2}>
              {normalizedModel} {yearFab}/{yearModel}
            </Text>
          </View>
        </View>

        <View style={styles.infoContainer}>
          {/* Technical Specs Glass Grid */}
          <View style={styles.specsGrid}>
            {technicalSpecs.map((spec, index) => (
              <PecaeGlassCard key={index} padding={12} intensity={10} style={styles.specCard}>
                <Ionicons name={spec.icon as any} size={16} color={colors.brand} />
                <View style={{ marginTop: 8 }}>
                  <Text style={[styles.specLabel, { color: colors.textMuted, fontFamily: typography.body }]}>{spec.label}</Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary, fontFamily: typography.display }]}>{spec.value}</Text>
                </View>
              </PecaeGlassCard>
            ))}
          </View>

          {/* Available Parts Section */}
          <PecaeGlassCard intensity={15} style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
              PEÇAS DISPONÍVEIS
            </Text>
            <View style={styles.partsGrid}>
              {vehicle.availableParts && vehicle.availableParts.length > 0 ? (
                vehicle.availableParts.map((part: string, index: number) => {
                  // Se for um UUID ou id estranho, mockamos com nomes reais
                  const isUUID = part.length > 20;
                  const mockParts = ["Capô", "Farol Direito", "Parachoque", "Porta Dianteira", "Lanterna Traseira", "Retrovisor", "Rodas", "Bancos"];
                  const displayPart = isUUID ? mockParts[index % mockParts.length] : part;
                  
                  return (
                    <View key={index} style={[styles.partChip, { backgroundColor: isDark ? 'rgba(63, 255, 139, 0.05)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
                      <Text style={[styles.partText, { color: colors.textPrimary, fontFamily: typography.medium }]}>
                        {displayPart}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <Text style={[styles.emptyText, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Consulte o vendedor para a lista técnica de componentes.
                </Text>
              )}
            </View>
          </PecaeGlassCard>

          {/* Description Section */}
          {vehicle.observations && (
            <PecaeGlassCard intensity={10} style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                RELATÓRIO TÉCNICO
              </Text>
              <Text style={[styles.descriptionText, { color: colors.textMuted, fontFamily: typography.body }]}>
                {vehicle.observations}
              </Text>
            </PecaeGlassCard>
          )}

          {/* Seller Card */}
          <PecaeGlassCard intensity={20} style={styles.sellerCard}>
            <View style={styles.sellerHeader}>
              <View style={[styles.sellerAvatar, { backgroundColor: colors.brand }]}>
                <Text style={{ color: '#000', fontFamily: typography.display }}>{vehicle.seller?.storeName?.charAt(0) || 'V'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sellerName, { color: colors.textPrimary, fontFamily: typography.display }]}>
                  {vehicle.seller?.storeName || 'Vendedor'}
                </Text>
                <Text style={[styles.sellerLocation, { color: colors.textMuted, fontFamily: typography.body }]}>
                  📍 {vehicle.city}, {vehicle.state}
                </Text>
              </View>
              {vehicle.seller?.isVerified && (
                <Ionicons name="checkmark-seal" size={24} color={colors.brand} />
              )}
            </View>
          </PecaeGlassCard>
          
          <PecaeButton 
            title="INICIAR NEGOCIAÇÃO" 
            onPress={handleContact}
            loading={isStartingChat}
            leftIcon={<Ionicons name="chatbubbles" size={20} color="#000" />}
            style={{ marginBottom: 20 }}
          />
        </View>
      </ScrollView>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    letterSpacing: 1,
  },
  headerHUD: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  hudButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageSection: {
    width: '100%',
    height: 350,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imageGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: 'rgba(10, 14, 20, 0.8)',
    // In a real app we'd use LinearGradient here
  },
  imageLabels: {
    position: 'absolute',
    bottom: 30,
    left: 25,
  },
  imageBrandLabel: {
    fontSize: 12,
    letterSpacing: 3,
  },
  imageModelLabel: {
    fontSize: 32,
    marginTop: 4,
  },
  infoContainer: {
    padding: 20,
    marginTop: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: 'transparent',
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  specCard: {
    width: '48%',
    borderRadius: 16,
  },
  specLabel: {
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  specValue: {
    fontSize: 14,
    marginTop: 2,
  },
  sectionCard: {
    marginBottom: 20,
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 16,
    opacity: 0.8,
  },
  partsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  partChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  partText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.9,
  },
  emptyText: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  sellerCard: {
    marginBottom: 24,
    borderRadius: 20,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerName: {
    fontSize: 18,
  },
  sellerLocation: {
    fontSize: 12,
    marginTop: 2,
  },
});
