import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { PecaeBackground } from '../../src/components/PecaeUI/PecaeBackground';
import { PecaeGlassCard } from '../../src/components/PecaeUI/PecaeGlassCard';
import { PecaeButton } from '../../src/components/PecaeUI/PecaeButton';
import { usePecaeTheme } from '../../src/theme';
import { api } from '../../src/services/api';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { PecaeScreenContainer } from '../../src/components/PecaeUI';

export default function VerificationRequestScreen() {
  const { colors, typography } = usePecaeTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedDocs, setSelectedDocs] = useState<{ id: string, uri: string, name: string, type: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data: status, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['verification-status'],
    queryFn: async () => {
      const response = await api.get('/sellers/verification/status');
      return response.data;
    },
  });

  const pickDocument = async () => {
    if (selectedDocs.length >= 5) {
      Alert.alert('Limite atingido', 'Você pode enviar no máximo 5 documentos.');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: false,
      });

      if (!result.canceled) {
        const doc = result.assets[0];
        setSelectedDocs([...selectedDocs, {
          id: Math.random().toString(),
          uri: doc.uri,
          name: doc.name,
          type: doc.mimeType || 'application/octet-stream',
        }]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const takePhoto = async () => {
    if (selectedDocs.length >= 5) return;

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar a foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
      const photo = result.assets[0];
      setSelectedDocs([...selectedDocs, {
        id: Math.random().toString(),
        uri: photo.uri,
        name: `photo_${Date.now()}.jpg`,
        type: 'image/jpeg',
      }]);
    }
  };

  const removeDoc = (id: string) => {
    setSelectedDocs(selectedDocs.filter(d => d.id !== id));
  };

  const handleSubmit = async () => {
    if (selectedDocs.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um documento.');
      return;
    }

    setIsUploading(true);
    try {
      // 1. Solicita URLs assinadas
      const { data: slots } = await api.post('/sellers/verification/request');

      // 2. Upload paralelo para o Storage
      const uploadResults = await Promise.all(
        selectedDocs.map(async (doc, index) => {
          const slot = slots[index];
          const response = await fetch(doc.uri);
          const blob = await response.blob();

          await fetch(slot.uploadUrl, {
            method: 'PUT',
            body: blob,
            headers: {
              'Content-Type': doc.type,
            },
          });

          return slot.path; // Enviamos o path para o backend confirmar
        })
      );

      // 3. Confirma a solicitação na API
      await api.post('/sellers/verification/confirm', {
        documentUrls: uploadResults,
      });

      Alert.alert('Sucesso', 'Sua solicitação foi enviada e será analisada em até 48h.');
      queryClient.invalidateQueries({ queryKey: ['verification-status'] });
      queryClient.invalidateQueries({ queryKey: ['seller-me'] });
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Ocorreu um problema ao enviar seus documentos. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoadingStatus) {
    return (
      <PecaeBackground>
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      </PecaeBackground>
    );
  }

  const latest = status?.latestVerification;

  if (latest?.status === 'PENDING') {
    return (
      <PecaeBackground>
        <PecaeScreenContainer contentContainerStyle={styles.statusContainer}>
          <Ionicons name="time-outline" size={80} color={colors.brand} />
          <Text style={[styles.statusTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>Verificação em Análise</Text>
          <Text style={[styles.statusSub, { color: colors.textMuted, fontFamily: typography.body }]}>
            Nossa equipe está revisando seus documentos. Você será notificado assim que o processo for concluído.
          </Text>
          <PecaeButton title="VOLTAR" onPress={() => router.back()} variant="outline" />
        </PecaeScreenContainer>
      </PecaeBackground>
    );
  }

  return (
    <PecaeBackground>
      <Stack.Screen options={{ title: 'Solicitar Verificação', headerShown: true }} />
      <PecaeScreenContainer scrollable>
        <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>Selo de Verificado</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
          Vendedores verificados têm maior destaque nas buscas e passam mais confiança aos compradores na plataforma.
        </Text>

        <PecaeGlassCard style={styles.infoCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.heading }]}>Documentos Necessários</Text>
          <View style={styles.listItem}>
            <Ionicons name="checkmark-circle" size={18} color={colors.brand} />
            <Text style={[styles.listText, { color: colors.textPrimary, fontFamily: typography.body }]}>Documento de Identidade (RG/CNH)</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="checkmark-circle" size={18} color={colors.brand} />
            <Text style={[styles.listText, { color: colors.textPrimary, fontFamily: typography.body }]}>Comprovante de CNPJ (se PJ)</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="checkmark-circle" size={18} color={colors.brand} />
            <Text style={[styles.listText, { color: colors.textPrimary, fontFamily: typography.body }]}>Selfie segurando o documento</Text>
          </View>
        </PecaeGlassCard>

        <View style={styles.uploadSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.heading }]}>Seus Documentos ({selectedDocs.length}/5)</Text>
          
          <View style={styles.uploadButtons}>
            <TouchableOpacity onPress={pickDocument} style={[styles.uploadBtn, { backgroundColor: colors.surface }]}>
              <Ionicons name="document-attach-outline" size={24} color={colors.brand} />
              <Text style={[styles.uploadBtnText, { color: colors.textPrimary, fontFamily: typography.mono }]}>ARQUIVO</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={takePhoto} style={[styles.uploadBtn, { backgroundColor: colors.surface }]}>
              <Ionicons name="camera-outline" size={24} color={colors.brand} />
              <Text style={[styles.uploadBtnText, { color: colors.textPrimary, fontFamily: typography.mono }]}>CÂMERA</Text>
            </TouchableOpacity>
          </View>

          {selectedDocs.map((doc) => (
            <View key={doc.id} style={[styles.docItem, { backgroundColor: colors.surface }]}>
              <Ionicons name={doc.type.includes('image') ? 'image-outline' : 'document-outline'} size={20} color={colors.textMuted} />
              <Text style={[styles.docName, { color: colors.textPrimary, fontFamily: typography.body }]} numberOfLines={1}>{doc.name}</Text>
              <TouchableOpacity onPress={() => removeDoc(doc.id)}>
                <Ionicons name="close-circle" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <PecaeButton 
            title={isUploading ? 'ENVIANDO...' : 'ENVIAR PARA ANÁLISE'} 
            onPress={handleSubmit}
            loading={isUploading}
            disabled={selectedDocs.length === 0}
          />
        </View>
      </PecaeScreenContainer>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  infoCard: {
    padding: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  listText: {
    fontSize: 14,
    marginLeft: 10,
  },
  uploadSection: {
    marginBottom: 32,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  uploadBtn: {
    flex: 1,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBtnText: {
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 1,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  docName: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
  },
  footer: {
    marginBottom: 60,
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  statusTitle: {
    fontSize: 22,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  statusSub: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    fontSize: 15,
  }
});
