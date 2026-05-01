import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, ScrollView, Alert, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { usePecaeTheme } from '../../src/theme';
import { PecaeBackground } from '../../src/components/PecaeUI/PecaeBackground';
import { PecaeGlassCard } from '../../src/components/PecaeUI/PecaeGlassCard';
import { PecaeInput } from '../../src/components/PecaeUI/PecaeInput';
import { PecaeButton } from '../../src/components/PecaeUI/PecaeButton';
import { useVehicleWizardStore } from '../../src/store/vehicle-wizard-store';
import { VehicleSelector } from '../../src/components/Catalog/VehicleSelector';
import { Step4Inventory } from '../../src/components/VehicleWizard/Step4Inventory';

const { width } = Dimensions.get('window');

const PHOTO_SLOTS = [
  { id: 'front', label: 'Frente' },
  { id: 'rear', label: 'Traseira' },
  { id: 'left', label: 'Lateral Esq.' },
  { id: 'right', label: 'Lateral Dir.' },
  { id: 'interior', label: 'Interior/Motor' },
];

export default function CadastrarSucataScreen() {
  const { colors, typography, effects } = usePecaeTheme();
  const { data, updateData, resetWizard } = useVehicleWizardStore();
  const router = useRouter();
  const [isSelectorVisible, setIsSelectorVisible] = useState(false);

  const handleClose = () => {
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
            router.back();
          }
        }
      ]
    );
  };

  const pickImage = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Negada', 'Precisamos de acesso às suas fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      const newPhotos = [...data.photos];
      const asset = result.assets[0];
      newPhotos[index] = {
        uri: asset.uri,
        type: 'image/jpeg',
        name: `photo_${index}.jpg`,
      };
      updateData({ photos: newPhotos });
    }
  };

  const handleVehicleSelect = (selection: any) => {
    updateData({
      brandId: selection.brand.id,
      modelId: selection.model.id,
      versionId: selection.version.id,
      yearFabId: selection.year.id,
    });
    setIsSelectorVisible(false);
  };

  const handlePublish = () => {
    if (!data.versionId || !data.yearFabId) {
      Alert.alert("Erro", "Selecione o veículo primeiro.");
      return;
    }
    if (data.photos.filter(Boolean).length < 1) {
      Alert.alert("Erro", "Adicione pelo menos uma foto.");
      return;
    }
    if (data.availableParts.length === 0) {
      Alert.alert("Erro", "Selecione pelo menos uma peça disponível.");
      return;
    }

    Alert.alert("Sucesso", "Veículo enviado para análise!");
    resetWizard();
    router.back();
  };

  return (
    <PecaeBackground>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: 'CADASTRO TÉCNICO',
          headerTitleStyle: { 
            fontFamily: typography.display, 
            fontSize: 14, 
            letterSpacing: 2,
            color: colors.brand 
          },
          headerLeft: () => (
            <TouchableOpacity onPress={handleClose} style={styles.headerBtn}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity style={styles.headerBtn}>
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
              <Ionicons name="images-outline" size={18} color={colors.brand} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                GALERIA DE INSPEÇÃO
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
              {PHOTO_SLOTS.map((slot, index) => {
                const photo = data.photos[index];
                return (
                  <TouchableOpacity 
                    key={slot.id} 
                    onPress={() => pickImage(index)}
                    style={styles.photoCardWrapper}
                  >
                    <PecaeGlassCard intensity={15} style={styles.photoCard}>
                      {photo ? (
                        <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                      ) : (
                        <View style={styles.photoPlaceholder}>
                          <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
                          <Text style={[styles.photoLabel, { color: colors.textMuted, fontFamily: typography.medium }]}>
                            {slot.label}
                          </Text>
                        </View>
                      )}
                    </PecaeGlassCard>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Section: Identity */}
          <PecaeGlassCard intensity={10} style={styles.identityCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="car-outline" size={18} color={colors.brand} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                IDENTIDADE DO VEÍCULO
              </Text>
            </View>
            
            <TouchableOpacity 
              onPress={() => setIsSelectorVisible(true)}
              style={[styles.selectorTrigger, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.selectorText, { color: data.versionId ? colors.textPrimary : colors.textMuted, fontFamily: typography.body }]}>
                {data.versionId ? "Alterar Veículo Selecionado" : "Clique para selecionar Marca/Modelo"}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.brand} />
            </TouchableOpacity>

            {data.versionId && (
              <View style={styles.specHud}>
                <View style={styles.specItem}>
                  <Text style={[styles.specLabel, { color: colors.textMuted }]}>ANO</Text>
                  <Text style={[styles.specValue, { color: colors.brand }]}>{data.yearFabId || '--'}</Text>
                </View>
                <View style={styles.specDivider} />
                <View style={styles.specItem}>
                  <Text style={[styles.specLabel, { color: colors.textMuted }]}>COR</Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>{data.color || '--'}</Text>
                </View>
                <View style={styles.specDivider} />
                <View style={styles.specItem}>
                  <Text style={[styles.specLabel, { color: colors.textMuted }]}>PLACA</Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>{data.plate || '--'}</Text>
                </View>
              </View>
            )}
          </PecaeGlassCard>

          {/* Section: Technical Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={18} color={colors.brand} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                DADOS TÉCNICOS
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
              label="Observações do Lote"
              placeholder="Descreva o estado geral do veículo e componentes principais."
              value={data.observations}
              onChangeText={(text) => updateData({ observations: text })}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Section: Inventory */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list-outline" size={18} color={colors.brand} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                INVENTÁRIO DE PEÇAS
              </Text>
            </View>
            <Step4Inventory isInline={true} />
          </View>

          {/* Publish Button */}
          <View style={styles.publishSection}>
            <PecaeButton
              title="ANUNCIAR VEÍCULO"
              onPress={handlePublish}
              style={{ height: 60 }}
              textStyle={{ letterSpacing: 2, fontFamily: typography.display }}
            />
            <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
              Ao publicar, você confirma que o veículo possui procedência legal e documentos para baixa.
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Vehicle Selector Modal */}
      {isSelectorVisible && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, zIndex: 9999, paddingTop: 60 }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>SELECIONAR VEÍCULO</Text>
            <TouchableOpacity onPress={() => setIsSelectorVisible(false)}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <VehicleSelector onSelect={handleVehicleSelect} />
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
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 2,
  },
  photoScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  photoCardWrapper: {
    width: width * 0.4,
    aspectRatio: 1,
    marginRight: 12,
  },
  photoCard: {
    flex: 1,
    padding: 0,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  photoLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  identityCard: {
    padding: 16,
    gap: 16,
  },
  selectorTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectorText: {
    fontSize: 14,
  },
  specHud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    borderRadius: 8,
  },
  specItem: {
    flex: 1,
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold' as any,
    letterSpacing: 1,
    marginBottom: 4,
  },
  specValue: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_700Bold' as any,
  },
  specDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  row: {
    flexDirection: 'row',
  },
  publishSection: {
    marginTop: 20,
    gap: 12,
  },
  disclaimer: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    letterSpacing: 2,
  },
});
