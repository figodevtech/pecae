import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, useWindowDimensions, ActivityIndicator, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { PecaeBackground, PecaeGlassCard } from '../../../src/components/PecaeUI';
import { usePecaeTheme } from '../../../src/theme';
import { useVehicleDetails } from '../../../src/hooks/useVehicles';
import { usePartCategories } from '../../../src/hooks/useCatalog';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../../../src/hooks/useChat';

export default function VehicleDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, effects } = usePecaeTheme();
  const { data: vehicle, isLoading: loadingVehicle } = useVehicleDetails(id!);
  const { data: categories } = usePartCategories();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { createRoom } = useChat();
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
            Veículo não encontrado.
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
            <Text style={{ color: colors.brand }}>Voltar ao Catálogo</Text>
          </TouchableOpacity>
        </View>
      </PecaeBackground>
    );
  }

  const handleContact = async () => {
    if (isStartingChat) return;
    
    setIsStartingChat(true);
    try {
      // Inicia chat com o contexto do veículo
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

  const isWeb = width >= 768;

  return (
    <PecaeBackground>
      <Stack.Screen options={{ title: `${vehicle.brand} ${vehicle.model}`, headerShown: false }} />
      
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.floatingBack, { backgroundColor: 'rgba(10, 14, 20, 0.8)', borderColor: colors.border }]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={[styles.contentLayout, isWeb && styles.webLayout]}>
          {/* Seção de Imagem */}
          <View style={[styles.imageSection, isWeb && styles.webImageSection]}>
            <Image 
              source={{ uri: vehicle.thumbnail || 'https://via.placeholder.com/800x600?text=Sem+Foto' }} 
              style={[styles.mainImage, { borderRadius: effects.radius.lg }]} 
              resizeMode="cover"
            />
            <View style={[styles.verifiedBadge, { backgroundColor: colors.brand }]}>
              <Text style={[styles.verifiedBadgeText, { fontFamily: typography.bold }]}>
                DOADOR VERIFICADO
              </Text>
            </View>
          </View>

          {/* Seção de Informações Principais */}
          <View style={[styles.infoSection, isWeb && styles.webInfoSection]}>
            <PecaeGlassCard intensity={25} style={styles.detailsCard}>
              <Text style={[styles.brandLabel, { color: colors.brand, fontFamily: typography.bold }]}>
                {vehicle.brand}
              </Text>
              <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
                {vehicle.model} {vehicle.version}
              </Text>

              <View style={styles.locationContainer}>
                <Ionicons name="location-sharp" size={16} color={colors.brand} />
                <Text style={[styles.locationText, { color: colors.textMuted, fontFamily: typography.body }]}>
                  {vehicle.city} - {vehicle.state}
                </Text>
              </View>

              <View style={styles.specsRow}>
                <View style={styles.specBox}>
                  <Text style={[styles.specLabel, { color: colors.textMuted }]}>Ano</Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>{vehicle.yearFab}</Text>
                </View>
                <View style={styles.specBox}>
                  <Text style={[styles.specLabel, { color: colors.textMuted }]}>Cor</Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>{vehicle.color}</Text>
                </View>
              </View>

              <View style={[styles.separator, { backgroundColor: colors.border }]} />

              {/* Grid de Inventário Industrial */}
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                STATUS DO INVENTÁRIO
              </Text>
              
              <View style={styles.inventoryGrid}>
                {categories?.map((cat) => {
                  const isAvailable = vehicle.availableParts.includes(cat.name) || vehicle.availableParts.includes(cat.id);
                  return (
                    <View key={cat.id} style={styles.inventoryItem}>
                      <View style={[
                        styles.statusIndicator, 
                        { backgroundColor: isAvailable ? 'rgba(63, 255, 139, 0.1)' : 'rgba(255, 63, 63, 0.1)' }
                      ]}>
                        <Ionicons 
                          name={isAvailable ? "checkmark-circle" : "close-circle"} 
                          size={16} 
                          color={isAvailable ? colors.brand : '#ff3f3f'} 
                        />
                        <Text style={[
                          styles.inventoryLabel, 
                          { color: isAvailable ? colors.textPrimary : colors.textMuted, fontFamily: typography.body }
                        ]}>
                          {cat.name}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {vehicle.observations && (
                <>
                  <View style={[styles.separator, { backgroundColor: colors.border }]} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                    OBSERVAÇÕES DO DOADOR
                  </Text>
                  <Text style={[styles.observationsText, { color: colors.textMuted, fontFamily: typography.body }]}>
                    {vehicle.observations}
                  </Text>
                </>
              )}

              <TouchableOpacity 
                onPress={handleContact} 
                disabled={isStartingChat}
                style={[
                  styles.contactButton, 
                  { backgroundColor: colors.brand, borderRadius: effects.radius.md },
                  isStartingChat && { opacity: 0.7 }
                ]}
              >
                {isStartingChat ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Ionicons name="chatbubbles" size={24} color="#000" style={{ marginRight: 10 }} />
                    <Text style={[styles.contactButtonText, { fontFamily: typography.bold, color: '#000' }]}>
                      NEGOCIAR PEÇAS
                    </Text>
                  </>
                )}
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
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  floatingBack: {
    position: 'absolute',
    top: 50,
    left: 20,
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
  },
  webLayout: {
    flexDirection: 'row',
    padding: 20,
    gap: 30,
  },
  imageSection: {
    width: '100%',
    height: 350,
    position: 'relative',
  },
  webImageSection: {
    flex: 1,
    height: 600,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    color: '#000',
    fontSize: 10,
    letterSpacing: 1,
  },
  infoSection: {
    marginTop: -30,
    paddingHorizontal: 15,
  },
  webInfoSection: {
    width: 450,
    marginTop: 0,
    paddingHorizontal: 0,
  },
  detailsCard: {
    padding: 24,
    borderRadius: 30,
  },
  brandLabel: {
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    letterSpacing: 1,
    marginBottom: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 14,
  },
  specsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  specBox: {
    flex: 1,
  },
  specLabel: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  specValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    width: '100%',
    marginVertical: 24,
    opacity: 0.1,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 16,
    letterSpacing: 2,
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  inventoryItem: {
    width: '48%',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  inventoryLabel: {
    fontSize: 12,
  },
  observationsText: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 24,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    marginTop: 10,
  },
  contactButtonText: {
    fontSize: 15,
    letterSpacing: 1.5,
  },
});

