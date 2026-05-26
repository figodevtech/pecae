import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import { usePecaeTheme } from '../../theme';
import { PecaeGlassCard } from '../PecaeUI/PecaeGlassCard';
import { PecaeButton } from '../PecaeUI/PecaeButton';
import { useVehicleWizardStore } from '../../store/vehicle-wizard-store';
import { api } from '../../services/api';
import { useRouter } from 'expo-router';

export const Step5Review: React.FC = () => {
  const { colors, typography } = usePecaeTheme();
  const { data, prevStep, resetWizard } = useVehicleWizardStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleFinalize = async () => {
    setIsSubmitting(true);
    try {
      const isEditing = !!data.editingId;
      
      // 1. Send metadata (Create or Update)
      const response = isEditing 
        ? await api.patch(`/vehicles/${data.editingId}`, {
            color: data.color,
            observations: data.observations,
            availableParts: data.availableParts,
            title: data.title,
            description: data.description,
          })
        : await api.post('/vehicles', {
            versionId: data.versionId,
            yearFabId: data.yearFabId,
            color: data.color,
            city: data.city,
            state: data.state,
            plate: data.plate?.trim() || undefined,
            observations: data.observations,
            availableParts: data.availableParts,
            title: data.title,
            description: data.description,
            lat: data.lat,
            lng: data.lng,
            customBrandName: data.customBrandName,
            customModelName: data.customModelName,
            customVersionName: data.customVersionName,
            customYearFab: data.customYearFab,
            customYearModel: data.customYearModel,
          });

      const vehicle = isEditing ? { id: data.editingId } : response.data.vehicle;

      // 2. Upload photos
      if (data.photos.length > 0) {
        const { data: uploadUrls } = await api.post(`/vehicles/${vehicle.id}/photos/upload-url`, {
          count: data.photos.length,
        });

        const uploadedPhotos = await Promise.all(
          data.photos.map(async (photo, index) => {
            const isCover = photo.uri === data.coverPhotoUri;
            const photoOrder = isCover ? 0 : index + 1;

            if (photo.uri.startsWith('http')) {
              return {
                url: photo.uri,
                type: 'EXTERNAL',
                order: photoOrder,
              };
            }

            const uploadInfo = uploadUrls.find((u: any) => u.slotIndex === index);
            if (!uploadInfo) return null;

            const isMockUrl = uploadInfo.uploadUrl.includes('/mock-upload/');
            if (!isMockUrl) {
              const fileResponse = await fetch(photo.uri);
              const blob = await fileResponse.blob();

              await fetch(uploadInfo.uploadUrl, {
                method: 'PUT',
                body: blob,
                headers: { 'Content-Type': photo.type },
              });
            }

            return {
              url: uploadInfo.publicUrl,
              type: 'EXTERNAL', 
              order: photoOrder,
            };
          })
        );

        await api.post(`/vehicles/${vehicle.id}/photos/confirm`, {
          photos: uploadedPhotos.filter(Boolean),
        });
      }
      
      if (Platform.OS === 'web') {
        alert('FORJA CONCLUÍDA!\n\nSeu veículo foi cadastrado e está em análise. Você será notificado assim que for publicado.');
        resetWizard();
        router.replace('/(seller)/(seller-tabs)/inventory');
      } else {
        Alert.alert(
          'FORJA CONCLUÍDA!', 
          'Seu veículo foi cadastrado e está em análise. Você será notificado assim que for publicado.',
          [{ text: 'ENTENDIDO', onPress: () => {
            resetWizard();
            router.replace('/(seller)/(seller-tabs)/inventory');
          }}]
        );
      }
    } catch (error: any) {
      console.error('Erro detalhado da falha na submissão:', error);
      if (error.response?.data) {
        console.error('Dados de erro da API:', error.response.data);
      }

      const apiMessage = error.response?.data?.message;
      const formattedMessage = Array.isArray(apiMessage)
        ? apiMessage.join('\n')
        : apiMessage || 'Erro técnico ao processar cadastro.';

      if (Platform.OS === 'web') {
        alert(`FALHA NA FORJA\n\nDetalhes da validação:\n${formattedMessage}`);
      } else {
        Alert.alert(
          'FALHA NA FORJA', 
          `Detalhes da validação:\n${formattedMessage}`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
        REVISÃO FINAL
      </Text>

      <PecaeGlassCard intensity={15} style={styles.reviewCard}>
        <Text style={[styles.sectionTitle, { color: colors.brand, fontFamily: typography.display }]}>
          VEÍCULO DOADOR
        </Text>
        <Text style={[styles.label, { color: colors.textPrimary, fontFamily: typography.display }]}>
          {data.title?.toUpperCase()}
        </Text>
        <View style={styles.specRow}>
          <Text style={[styles.value, { color: colors.textMuted, fontFamily: typography.medium }]}>
            {data.color} • {data.city}/{data.state}
          </Text>
        </View>
        {data.plate && (
          <Text style={[styles.plateText, { color: colors.textMuted, fontFamily: typography.display }]}>
            REGISTRO: {data.plate}
          </Text>
        )}
      </PecaeGlassCard>

      <PecaeGlassCard intensity={15} style={styles.reviewCard}>
        <Text style={[styles.sectionTitle, { color: colors.brand, fontFamily: typography.display }]}>
          INVENTÁRIO DE PEÇAS
        </Text>
        <Text style={[styles.value, { color: colors.textPrimary, fontFamily: typography.body }]}>
          {data.availableParts.length} categorias de componentes identificadas para negociação.
        </Text>
      </PecaeGlassCard>

      <View style={styles.photoSection}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.display, marginBottom: 15 }]}>
          GALERIA TÉCNICA ({data.photos.length})
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
          {data.photos.map((photo, i) => (
            <View key={i} style={styles.photoWrapper}>
              <Image source={{ uri: photo.uri }} style={styles.previewImage} />
              {photo.uri === data.coverPhotoUri && (
                <View style={[styles.coverBadge, { backgroundColor: colors.brand }]}>
                  <Text style={styles.coverText}>CAPA</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <PecaeButton
          title="VOLTAR"
          type="secondary"
          onPress={prevStep}
          disabled={isSubmitting}
          style={styles.button}
        />
        <PecaeButton
          title={isSubmitting ? "FORJANDO..." : "FINALIZAR CADASTRO"}
          onPress={handleFinalize}
          loading={isSubmitting}
          style={styles.button}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 24,
    letterSpacing: 2,
    marginBottom: 25,
  },
  reviewCard: {
    marginBottom: 20,
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 8,
  },
  label: {
    fontSize: 18,
    marginBottom: 6,
  },
  specRow: {
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    lineHeight: 20,
  },
  plateText: {
    fontSize: 12,
    marginTop: 8,
    opacity: 0.8,
  },
  photoSection: {
    marginTop: 10,
    marginBottom: 30,
  },
  photoScroll: {
    flexDirection: 'row',
  },
  photoWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  coverBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coverText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});
