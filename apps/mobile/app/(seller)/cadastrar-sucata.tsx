import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, ScrollView, Alert, Dimensions, KeyboardAvoidingView, Platform, BackHandler } from 'react-native';
import { Stack, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { usePecaeTheme } from '../../src/theme';
import { PecaeBackground } from '../../src/components/PecaeUI/PecaeBackground';
import { PecaeGlassCard } from '../../src/components/PecaeUI/PecaeGlassCard';
import { PecaeInput } from '../../src/components/PecaeUI/PecaeInput';
import { PecaeButton } from '../../src/components/PecaeUI/PecaeButton';
import { useVehicleWizardStore } from '../../src/store/vehicle-wizard-store';
import { useBrands, useBrandYears, useModelsByYear } from '../../src/hooks/useCatalog';
import { Step4Inventory } from '../../src/components/VehicleWizard/Step4Inventory';

const { width } = Dimensions.get('window');

// Removed fixed PHOTO_SLOTS to allow free photo addition

export default function CadastrarSucataScreen() {
  const { colors, typography, effects } = usePecaeTheme();
  const { data, updateData, resetWizard } = useVehicleWizardStore();
  const router = useRouter();
  const [isSelectorVisible, setIsSelectorVisible] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleClose = useCallback(() => {
    Alert.alert(
      "Sair do Cadastro",
      "As informações não salvas serão perdidas. Deseja sair?",
      [
        { text: "Continuar Editando", style: "cancel" },
        { 
          text: "Sair", 
          style: "destructive",
          onPress: () => {
            resetWizard();
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(seller)/(seller-tabs)');
            }
          }
        }
      ]
    );
  }, [router, resetWizard]);

  // Handle Android Back Button
  useEffect(() => {
    const backAction = () => {
      handleClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [handleClose]);

  const [selectorConfig, setSelectorConfig] = useState<{
    type: 'brand' | 'year' | 'model';
    title: string;
    data: any[];
    onSelect: (item: any) => void;
  } | null>(null);

  const addPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Negada', 'Precisamos de acesso às suas fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const newPhotos = [...data.photos, ...result.assets.map((asset, i) => ({
        uri: asset.uri,
        type: 'image/jpeg',
        name: `photo_${data.photos.length + i}.jpg`,
      }))];
      updateData({ photos: newPhotos });
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = data.photos.filter((_, i) => i !== index);
    updateData({ photos: newPhotos });
  };

  const { data: brands } = useBrands();
  const { data: brandYears } = useBrandYears(data.brandId);
  const selectedYear = brandYears?.find(y => y.id === data.yearFabId);
  const { data: yearModels } = useModelsByYear(data.brandId, selectedYear?.year, selectedYear?.modelYear);

  const openSelector = (type: 'brand' | 'year' | 'model') => {
    let config: any = null;

    if (type === 'brand') {
      config = {
        type,
        title: 'SELECIONAR MARCA',
        data: brands || [],
        onSelect: (item: any) => {
          updateData({ 
            brandId: item.id, 
            modelId: undefined, 
            versionId: undefined, 
            yearFabId: undefined 
          });
          setIsSelectorVisible(false);
        }
      };
    } else if (type === 'year') {
      config = {
        type,
        title: 'SELECIONAR ANO',
        data: brandYears || [],
        onSelect: (item: any) => {
          updateData({ 
            yearFabId: item.id,
            modelId: undefined,
            versionId: undefined
          });
          setIsSelectorVisible(false);
        }
      };
    } else if (type === 'model') {
      config = {
        type,
        title: 'SELECIONAR MODELO',
        data: yearModels || [],
        onSelect: (item: any) => {
          updateData({ modelId: item.id, versionId: item.id });
          setIsSelectorVisible(false);
        }
      };
    }

    setSelectorConfig(config);
    setIsSelectorVisible(true);
  };

  const handlePublish = async () => {
    if (!data.brandId || !data.yearFabId || !data.modelId) {
      Alert.alert("Erro", "Selecione a marca, o ano e o modelo primeiro.");
      return;
    }
    if (!data.title || data.title.length < 5) {
      Alert.alert("Erro", "Insira um título válido para o anúncio (mínimo 5 caracteres).");
      return;
    }
    if (data.photos.length < 3) {
      Alert.alert("Erro", "Adicione pelo menos 3 fotos do veículo.");
      return;
    }
    if (data.availableParts.length === 0) {
      Alert.alert("Erro", "Selecione pelo menos uma peça disponível.");
      return;
    }

    setIsPublishing(true);
    
    try {
      // 1. Criar o veículo
      const { data: result } = await api.post('/vehicles', {
        versionId: data.versionId || data.modelId, // No mobile simplificado versionId = modelId
        yearFabId: data.yearFabId,
        color: data.color || 'Não informada',
        city: data.city || 'São Paulo',
        state: data.state || 'SP',
        plate: data.plate,
        observations: data.observations,
        availableParts: data.availableParts,
        title: data.title,
        description: data.description,
        lat: data.lat,
        lng: data.lng,
      });

      const vehicleId = result.vehicle.id;

      // 2. Solicitar URLs para fotos
      const { data: slots } = await api.post(`/vehicles/${vehicleId}/photos/upload-url`, {
        count: data.photos.length
      });

      // 3. Upload das fotos (Simulado para o Storage Mock)
      const photoResults = await Promise.all(
        data.photos.map(async (photo, index) => {
          const slot = slots[index];
          
          // No ambiente real, faríamos o PUT do blob aqui
          // Como é MOCK, apenas simulamos o tempo de rede
          await new Promise(resolve => setTimeout(resolve, 500));

          return {
            url: slot.publicUrl,
            type: 'FRONT' as any, // Default type
            order: index
          };
        })
      );

      // 4. Confirmar fotos no backend
      await api.post(`/vehicles/${vehicleId}/photos/confirm`, {
        photos: photoResults
      });

      Alert.alert("SUCESSO", "Veículo forjado com sucesso! O anúncio entrará em análise.", [
        { text: "OK", onPress: () => {
          resetWizard();
          router.replace('/(seller)/(seller-tabs)/inventory');
        }}
      ]);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Falha ao publicar veículo.";
      Alert.alert("ERRO NA FORJA", msg);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <PecaeBackground>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: 'FORJA DIGITAL: CADASTRO',
          headerTitleStyle: { 
            fontFamily: typography.display, 
            fontSize: 12, 
            letterSpacing: 3,
            color: colors.brand 
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={handleClose} 
              style={styles.headerBtn}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              style={styles.headerBtn}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Ionicons name="help-circle-outline" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          )
        }} 
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Section: Photos */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.technicalIndicator, { backgroundColor: colors.brand }]} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                GALERIA DE INSPEÇÃO
              </Text>
              <Text style={[styles.technicalTag, { color: colors.brand, borderColor: colors.brand }]}>LIVE_FEED</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
              {data.photos.map((photo, index) => (
                <View key={index} style={styles.photoCardWrapper}>
                  <PecaeGlassCard intensity={15} style={styles.photoCard}>
                    <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                    <TouchableOpacity 
                      onPress={() => removePhoto(index)}
                      style={[styles.removePhotoBtn, { backgroundColor: colors.surface }]}
                    >
                      <Ionicons name="close" size={16} color={colors.error} />
                    </TouchableOpacity>
                  </PecaeGlassCard>
                </View>
              ))}
              
              <TouchableOpacity onPress={addPhoto} style={styles.photoCardWrapper}>
                <PecaeGlassCard intensity={25} style={[styles.photoCard, { borderColor: colors.brand, borderWidth: 1, borderStyle: 'dashed' }]}>
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="camera-outline" size={32} color={colors.brand} />
                    <Text style={[styles.photoLabel, { color: colors.brand, fontFamily: typography.display, textAlign: 'center', fontSize: 10 }]}>
                      TOQUE PARA{"\n"}ADICIONAR FOTOS
                    </Text>
                  </View>
                </PecaeGlassCard>
              </TouchableOpacity>
            </ScrollView>
            <Text style={[styles.photoHint, { color: colors.textMuted, fontFamily: typography.body }]}>
              * Mínimo de 3 fotos para continuar (restantes: {Math.max(0, 3 - data.photos.length)})
            </Text>
          </View>

          <PecaeGlassCard intensity={10} style={styles.identityCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.technicalIndicator, { backgroundColor: colors.brand }]} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                IDENTIDADE DO VEÍCULO
              </Text>
            </View>
            
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity 
                  onPress={() => openSelector('brand')}
                  style={[styles.miniSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text style={[styles.miniSelectorLabel, { color: colors.textMuted }]}>MARCA</Text>
                  <Text style={[styles.miniSelectorValue, { color: data.brandId ? colors.textPrimary : colors.textMuted }]} numberOfLines={1}>
                    {brands?.find(b => b.id === data.brandId)?.name || "Selecionar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity 
                  onPress={() => openSelector('year')}
                  style={[styles.miniSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  disabled={!data.brandId}
                >
                  <Text style={[styles.miniSelectorLabel, { color: colors.textMuted }]}>ANO FAB.</Text>
                  <Text style={[styles.miniSelectorValue, { color: data.yearFabId ? colors.textPrimary : colors.textMuted }]}>
                    {selectedYear ? selectedYear.year : "----"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <TouchableOpacity 
                  onPress={() => openSelector('year')}
                  style={[styles.miniSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  disabled={!data.brandId}
                >
                  <Text style={[styles.miniSelectorLabel, { color: colors.textMuted }]}>ANO MOD.</Text>
                  <Text style={[styles.miniSelectorValue, { color: data.yearFabId ? colors.textPrimary : colors.textMuted }]}>
                    {selectedYear ? selectedYear.modelYear : "----"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity 
                  onPress={() => openSelector('model')}
                  style={[styles.miniSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  disabled={!data.yearFabId}
                >
                  <Text style={[styles.miniSelectorLabel, { color: colors.textMuted }]}>MODELO</Text>
                  <Text style={[styles.miniSelectorValue, { color: data.modelId ? colors.textPrimary : colors.textMuted }]} numberOfLines={1}>
                    {yearModels?.find(m => m.id === data.modelId)?.name || "Selecionar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </PecaeGlassCard>

          {/* Section: Technical Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.technicalIndicator, { backgroundColor: colors.brand }]} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                ESPECIFICAÇÕES TÉCNICAS
              </Text>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <PecaeInput
                  label="Cor Principal"
                  placeholder="Prata"
                  value={data.color}
                  onChangeText={(text) => updateData({ color: text })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <PecaeInput
                  label="Placa"
                  placeholder="ABC-1234"
                  value={data.plate}
                  onChangeText={(text) => updateData({ plate: text.toUpperCase() })}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 2, marginRight: 10 }}>
                <PecaeInput
                  label="Cidade"
                  placeholder="São Paulo"
                  value={data.city}
                  onChangeText={(text) => updateData({ city: text })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <PecaeInput
                  label="UF"
                  placeholder="SP"
                  value={data.state}
                  onChangeText={(text) => updateData({ state: text.toUpperCase() })}
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <PecaeInput
              label="Observações do Lote (Interno)"
              placeholder="Descreva o estado geral do veículo e componentes principais."
              value={data.observations}
              onChangeText={(text) => updateData({ observations: text })}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 24 }}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.display, marginBottom: 16 }]}>
                DADOS DO ANÚNCIO (PÚBLICO)
              </Text>
              
              <PecaeInput
                label="Título do Anúncio"
                placeholder="Ex: Sucata Uno Vivace 2015 Inteira"
                value={data.title}
                onChangeText={(text) => updateData({ title: text })}
              />

              <PecaeInput
                label="Descrição do Anúncio"
                placeholder="Descreva o estado para os compradores..."
                value={data.description}
                onChangeText={(text) => updateData({ description: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Section: Inventory */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.technicalIndicator, { backgroundColor: colors.brand }]} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                INVENTÁRIO RÁPIDO
              </Text>
              <Text style={[styles.technicalTag, { color: colors.brand, borderColor: colors.brand }]}>V2.0</Text>
            </View>
            <Step4Inventory isInline={true} />
          </View>

          {/* Publish Button */}
          <View style={styles.publishSection}>
            <PecaeButton
              title={isPublishing ? "PROCESSANDO..." : "ANUNCIAR VEÍCULO"}
              onPress={handlePublish}
              loading={isPublishing}
              disabled={isPublishing}
              style={{ height: 60 }}
              textStyle={{ letterSpacing: 2, fontFamily: typography.display }}
            />
            
            <View style={styles.trustIndicator}>
              <Ionicons name="shield-checkmark" size={14} color={colors.brand} />
              <Text style={[styles.trustText, { color: colors.brand, fontFamily: typography.bold }]}>
                CONEXÃO SEGURA & DADOS CRIPTOGRAFADOS
              </Text>
            </View>

            <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
              Ao publicar, você confirma que o veículo possui procedência legal e documentos para baixa.
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Selection Modal */}
      {isSelectorVisible && selectorConfig && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, zIndex: 9999, paddingTop: 60 }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
              {selectorConfig.title}
            </Text>
            <TouchableOpacity onPress={() => setIsSelectorVisible(false)}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
            {selectorConfig.data.map((item: any) => (
              <TouchableOpacity 
                key={item.id} 
                onPress={() => selectorConfig.onSelect(item)}
              >
                <PecaeGlassCard intensity={15} style={{ padding: 16, borderRadius: 12 }}>
                  <Text style={{ color: colors.textPrimary, fontFamily: typography.body }}>
                    {selectorConfig.type === 'year' ? `${item.year}/${item.modelYear}` : item.name}
                  </Text>
                </PecaeGlassCard>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 100,
    paddingBottom: 40,
    gap: 24,
  },
  headerBtn: {
    padding: 8,
    zIndex: 10,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  technicalIndicator: {
    width: 3,
    height: 12,
    borderRadius: 2,
  },
  technicalTag: {
    fontSize: 9,
    fontFamily: 'SpaceGrotesk_700Bold' as any,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 'auto',
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 2.5,
  },
  photoScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  publishSection: {
    marginTop: 10,
    gap: 16,
    paddingBottom: 20,
  },
  trustIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    opacity: 0.8,
  },
  trustText: {
    fontSize: 9,
    letterSpacing: 1,
  },
  photoCardWrapper: {
    width: width * 0.42,
    aspectRatio: 4/3,
    marginRight: 14,
  },
  photoCard: {
    flex: 1,
    padding: 0,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
    gap: 10,
  },
  photoLabel: {
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  photoHint: {
    fontSize: 10,
    marginTop: 8,
    opacity: 0.6,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  identityCard: {
    padding: 16,
    gap: 16,
    borderRadius: 16,
  },
  miniSelector: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  miniSelectorLabel: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold' as any,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.5,
  },
  miniSelectorValue: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_700Bold' as any,
    letterSpacing: 0.5,
  },
  disclaimer: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
    opacity: 0.5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 14,
    letterSpacing: 3,
  },
});
