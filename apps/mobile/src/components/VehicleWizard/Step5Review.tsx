import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
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
            plate: data.plate,
            observations: data.observations,
            availableParts: data.availableParts,
            title: data.title,
            description: data.description,
            lat: data.lat,
            lng: data.lng,
          });

      const vehicle = isEditing ? { id: data.editingId } : response.data.vehicle;

      // 2. Upload photos
      if (data.photos.length > 0) {
        // 2a. Get Signed URLs
        const { data: uploadUrls } = await api.post(`/vehicles/${vehicle.id}/photos/upload-url`, {
          count: data.photos.length,
        });

        // 2b. Perform uploads
        const uploadedPhotos = await Promise.all(
          data.photos.map(async (photo, index) => {
            // Skip if photo already has a remote URL (is not a local URI)
            if (photo.uri.startsWith('http')) {
              return {
                url: photo.uri,
                type: 'EXTERNAL',
                order: index,
              };
            }

            const uploadInfo = uploadUrls.find((u: any) => u.slotIndex === index);
            if (!uploadInfo) return null;

            // React Native file upload to signed URL
            const fileResponse = await fetch(photo.uri);
            const blob = await fileResponse.blob();

            await fetch(uploadInfo.uploadUrl, {
              method: 'PUT',
              body: blob,
              headers: { 'Content-Type': photo.type },
            });

            return {
              url: uploadInfo.publicUrl,
              type: 'EXTERNAL', // PhotoType.EXTERNAL (Common for most slots)
              order: index,
            };
          })
        );

        // 2c. Confirm uploads
        await api.post(`/vehicles/${vehicle.id}/photos/confirm`, {
          photos: uploadedPhotos.filter(Boolean),
        });
      }
      
      Alert.alert(
        'Sucesso!', 
        'Seu veículo foi cadastrado e está em análise pela nossa equipe.',
        [{ text: 'OK', onPress: () => {
          resetWizard();
          router.replace('/(seller)/(seller-tabs)/inventory');
        }}]
      );
    } catch (error: any) {
      console.error(error);
      Alert.alert('Erro', error.response?.data?.message || 'Falha ao cadastrar veículo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.heading }]}>
        Revisão Final
      </Text>

      <PecaeGlassCard intensity={15} style={styles.reviewCard}>
        <Text style={[styles.sectionTitle, { color: colors.brand, fontFamily: typography.bold }]}>
          Veículo
        </Text>
        <Text style={[styles.label, { color: colors.textPrimary, fontFamily: typography.medium }]}>
          {data.title}
        </Text>
        <Text style={[styles.value, { color: colors.textMuted, fontFamily: typography.body }]}>
          {data.color} • {data.city}/{data.state}
        </Text>
        {data.plate && (
          <Text style={[styles.value, { color: colors.textMuted, fontFamily: typography.body }]}>
            Placa: {data.plate}
          </Text>
        )}
      </PecaeGlassCard>

      <PecaeGlassCard intensity={15} style={styles.reviewCard}>
        <Text style={[styles.sectionTitle, { color: colors.brand, fontFamily: typography.bold }]}>
          Peças Selecionadas
        </Text>
        <Text style={[styles.value, { color: colors.textPrimary, fontFamily: typography.body }]}>
          {data.availableParts.length} categorias de peças marcadas como disponíveis.
        </Text>
      </PecaeGlassCard>

      <View style={styles.photoPreview}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.bold, marginLeft: 5 }]}>
          Fotos ({data.photos.length})
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
          {data.photos.map((photo, i) => (
            <Image key={i} source={{ uri: photo.uri }} style={styles.previewImage} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <PecaeButton
          title="Voltar"
          type="secondary"
          onPress={prevStep}
          disabled={isSubmitting}
          style={styles.button}
        />
        <PecaeButton
          title={isSubmitting ? "Enviando..." : "Finalizar Cadastro"}
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
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
  },
  reviewCard: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
  },
  photoPreview: {
    marginTop: 10,
    marginBottom: 30,
  },
  photoScroll: {
    flexDirection: 'row',
    marginTop: 10,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 10,
    paddingBottom: 40,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});
