import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Image, Alert, ScrollView, SafeAreaView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { usePecaeTheme } from '../../src/theme';
import { useBuyerProfile, useUpdateBuyerProfile } from '../../src/hooks/useBuyer';
import { PecaeBackground } from '../../src/components/PecaeUI/PecaeBackground';
import { PecaeGlassCard } from '../../src/components/PecaeUI/PecaeGlassCard';

interface FormData {
  name: string;
}

export default function PerfilEditar() {
  const { colors, typography, isDark } = usePecaeTheme();
  const router = useRouter();
  
  const { data: profile, isLoading: isLoadingProfile } = useBuyerProfile();
  const updateProfileMutation = useUpdateBuyerProfile();

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: '',
    }
  });

  useEffect(() => {
    if (profile) {
      setValue('name', profile.name || '');
      if (profile.avatar) {
        setAvatarUri(profile.avatar);
      }
    }
  }, [profile, setValue]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à sua galeria para alterar a foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const uploadToSupabase = async (uri: string): Promise<string> => {
    console.log('Simulating upload to Supabase storage...', uri);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(uri);
      }, 1000);
    });
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsUploading(true);
      let finalAvatarUrl = profile?.avatar;

      if (avatarUri && avatarUri !== profile?.avatar && avatarUri.startsWith('file://')) {
        finalAvatarUrl = await uploadToSupabase(avatarUri);
      }

      await updateProfileMutation.mutateAsync({
        name: data.name,
        avatarUrl: finalAvatarUrl,
      });

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar o perfil.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (Platform.OS === 'web') {
      router.replace('/(buyer)/perfil');
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(buyer)/perfil');
    }
  };

  if (isLoadingProfile) {
    return (
      <PecaeBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </PecaeBackground>
    );
  }

  return (
    <PecaeBackground>
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            headerShown: true,
            title: 'Editar Perfil',
            headerTransparent: true,
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { fontFamily: typography.display, fontSize: 18 },
          }}
        />

        <View style={styles.headerSpacer} />

        <ScrollView 
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={[styles.avatar, { borderColor: colors.brand }]} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface + '80', borderColor: colors.border }]}>
                  <Ionicons name="person" size={50} color={colors.textMuted} />
                </View>
              )}
              <TouchableOpacity 
                style={[styles.changeAvatarBtn, { backgroundColor: colors.brand }]}
                onPress={handlePickImage}
              >
                <Ionicons name="camera" size={20} color="#000" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.avatarHint, { color: colors.textMuted, fontFamily: typography.body }]}>
              Toque no ícone para alterar a foto
            </Text>
          </View>

          <PecaeGlassCard style={styles.formCard} intensity={isDark ? 10 : 30}>
            <Text style={[styles.label, { color: colors.brand, fontFamily: typography.display }]}>NOME COMPLETO</Text>
            <Controller
              control={control}
              rules={{
                required: 'Nome é obrigatório',
                minLength: { value: 2, message: 'O nome deve ter no mínimo 2 caracteres' }
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', borderColor: errors.name ? colors.error : colors.border + '50' }]}>
                  <Ionicons name="person-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary, fontFamily: typography.body }]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="Ex: João da Silva"
                    placeholderTextColor={colors.textMuted + '80'}
                  />
                </View>
              )}
              name="name"
            />
            {errors.name && <Text style={[styles.errorText, { color: colors.error, fontFamily: typography.body }]}>{errors.name.message}</Text>}
            
            <View style={styles.spacer} />

            <Text style={[styles.label, { color: colors.textMuted, fontFamily: typography.display }]}>E-MAIL (APENAS VISUALIZAÇÃO)</Text>
            <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)', borderColor: colors.border + '30', opacity: 0.6 }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textMuted, fontFamily: typography.body }]}
                value={profile?.email || ''}
                editable={false}
              />
            </View>
          </PecaeGlassCard>

          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: colors.brand },
              (updateProfileMutation.isPending || isUploading) && { opacity: 0.7 }
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={updateProfileMutation.isPending || isUploading}
          >
            {updateProfileMutation.isPending || isUploading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={[styles.saveButtonText, { fontFamily: typography.display }]}>SALVAR ALTERAÇÕES</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelBtn}
            onPress={handleCancel}
          >
            <Text style={[styles.cancelBtnText, { color: colors.textMuted, fontFamily: typography.body }]}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    height: 80,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
  },
  avatarPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeAvatarBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  avatarHint: {
    marginTop: 16,
    fontSize: 12,
    opacity: 0.6,
  },
  formCard: {
    padding: 20,
    marginBottom: 32,
  },
  label: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  spacer: {
    height: 24,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  saveButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cancelBtn: {
    marginTop: 20,
    alignItems: 'center',
    padding: 10,
  },
  cancelBtnText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
