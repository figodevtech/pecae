import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { PecaeBackground, PecaeGlassCard, PecaeInput, PecaeButton } from '../../src/components/PecaeUI';
import { usePecaeTheme } from '../../src/theme';
import { api } from '../../src/services/api';

const updateSellerSchema = z.object({
  storeName: z.string().min(3, 'Mínimo 3 caracteres'),
  description: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().regex(/^\+55\d{10,11}$/, 'Formato: +5511999999999'),
  address: z.string().min(5, 'Endereço obrigatório'),
  city: z.string().min(2, 'Cidade obrigatória'),
  state: z.string().length(2, 'UF deve ter 2 letras'),
});

type UpdateSellerForm = z.infer<typeof updateSellerSchema>;

export default function EditProfileScreen() {
  const { colors } = usePecaeTheme();
  const PecaeTokens = require('../../src/theme/pecae-tokens').PecaeTokens;
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: seller, isLoading } = useQuery({
    queryKey: ['seller-me'],
    queryFn: async () => {
      const response = await api.get('/sellers/me');
      return response.data;
    },
  });

  const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<UpdateSellerForm>({
    resolver: zodResolver(updateSellerSchema),
    defaultValues: {
      storeName: '',
      description: '',
      phone: '',
      whatsapp: '',
      address: '',
      city: '',
      state: '',
    }
  });

  useEffect(() => {
    if (seller) {
      reset({
        storeName: seller.storeName,
        description: seller.description || '',
        phone: seller.phone || '',
        whatsapp: seller.whatsapp,
        address: seller.address,
        city: seller.city,
        state: seller.state,
      });
    }
  }, [seller]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateSellerForm) => {
      await api.put('/sellers/me', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-me'] });
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      router.back();
    },
    onError: () => {
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
    }
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso às suas fotos para alterar a logo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      handleUploadLogo(result.assets[0]);
    }
  };

  const handleUploadLogo = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploading(true);
      
      // 1. Get presigned URL
      const { data: presigned } = await api.post('/sellers/me/logo', {
        filename: asset.fileName || 'logo.jpg',
      });

      // 2. Upload to Storage
      const response = await fetch(presigned.uploadUrl, {
        method: 'PUT',
        body: await (await fetch(asset.uri)).blob(),
        headers: {
          'Content-Type': asset.mimeType || 'image/jpeg',
        },
      });

      if (!response.ok) throw new Error('Upload failed');

      // 3. Confirm with Backend
      await api.post('/sellers/me/logo/confirm', {
        publicUrl: presigned.publicUrl,
      });

      queryClient.invalidateQueries({ queryKey: ['seller-me'] });
      Alert.alert('Sucesso', 'Logo atualizada com sucesso!');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha no upload da logo.');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <PecaeBackground>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </PecaeBackground>
    );
  }

  return (
    <PecaeBackground>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary, fontFamily: PecaeTokens.typography.display }]}>
            Editar Perfil
          </Text>
        </View>

        <PecaeGlassCard style={styles.logoCard}>
          <TouchableOpacity onPress={pickImage} style={styles.logoPicker} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color={colors.brand} />
            ) : seller?.logo ? (
              <Image source={{ uri: seller.logo }} style={styles.logo} />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: colors.surface }]}>
                <Ionicons name="camera" size={32} color={colors.brand} />
                <Text style={[styles.logoPlaceholderText, { color: colors.textMuted, fontFamily: PecaeTokens.typography.body }]}>Adicionar Logo</Text>
              </View>
            )}
            {!uploading && (
              <View style={[styles.editBadge, { backgroundColor: colors.brand }]}>
                <Ionicons name="pencil" size={12} color={colors.dark} />
              </View>
            )}
          </TouchableOpacity>
        </PecaeGlassCard>

        <View style={styles.form}>
          <Controller
            control={control}
            name="storeName"
            render={({ field: { onChange, onBlur, value } }) => (
              <PecaeInput
                label="Nome da Loja"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.storeName?.message}
                placeholder="Ex: Desmanche do João"
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <PecaeInput
                label="Descrição / Bio"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.description?.message}
                placeholder="Conte sobre sua loja..."
                multiline
                numberOfLines={3}
                style={{ height: 100, textAlignVertical: 'top' }}
              />
            )}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Controller
                control={control}
                name="whatsapp"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PecaeInput
                    label="WhatsApp"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.whatsapp?.message}
                    placeholder="+55..."
                    keyboardType="phone-pad"
                  />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PecaeInput
                    label="Telefone (Opcional)"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.phone?.message}
                    placeholder="(00) 0000-0000"
                    keyboardType="phone-pad"
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, onBlur, value } }) => (
              <PecaeInput
                label="Endereço"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.address?.message}
                placeholder="Rua, número, bairro"
              />
            )}
          />

          <View style={styles.row}>
            <View style={{ flex: 3, marginRight: 10 }}>
              <Controller
                control={control}
                name="city"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PecaeInput
                    label="Cidade"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.city?.message}
                    placeholder="Sua cidade"
                  />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="state"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PecaeInput
                    label="UF"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.state?.message}
                    placeholder="SP"
                    maxLength={2}
                    autoCapitalize="characters"
                  />
                )}
              />
            </View>
          </View>

          <PecaeButton
            title="Salvar Alterações"
            onPress={handleSubmit((data) => updateMutation.mutate(data))}
            loading={updateMutation.isPending}
            disabled={!isDirty || uploading}
            style={styles.saveButton}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  logoCard: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 32,
  },
  logoPicker: {
    position: 'relative',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(63, 255, 139, 0.5)',
  },
  logoPlaceholderText: {
    fontSize: 10,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  editBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0A0E14',
  },
  form: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
  },
  saveButton: {
    marginTop: 16,
  },
});
