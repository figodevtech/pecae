import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ForgeBackground, 
  ForgeGlassCard, 
  ForgeInput, 
  ForgeButton 
} from '../../src/components/ForgeUI';
import { useForgeTheme } from '../../src/theme';
import { api } from '../../src/services/api';

const registerSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  type: z.enum(['BUYER', 'SELLER']),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'Você deve aceitar os termos de uso',
  }),
});

type RegisterFormData = z.infer<typeof registerSchema>;export default function RegisterScreen() {
  const router = useRouter();
  const { colors, typography, effects } = useForgeTheme();
  
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      type: 'BUYER',
      termsAccepted: false,
    },
  });

  const selectedType = watch('type');
  const termsAccepted = watch('termsAccepted');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await api.post('/auth/register', data);
      Alert.alert('Sucesso', 'Cadastro realizado! Verifique seu e-mail.', [
        { text: 'OK', onPress: () => router.push('/(auth)/verify-email') },
      ]);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao realizar cadastro';
      Alert.alert('Erro', message);
    }
  };

  return (
    <ForgeBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.tag}>
              <Text style={[styles.tagText, { color: colors.brand, fontFamily: typography.mono }]}>
                SYSTEM_ACCESS: v1.0.4
              </Text>
            </View>
            <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
              FORJA DIGITAL
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
              Crie sua conta para entrar no ecossistema industrial de peças originais.
            </Text>
          </View>

          <ForgeGlassCard intensity={30}>
            <View style={styles.formSection}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ForgeInput
                    label="Credencial (Nome)"
                    placeholder="Ex: João da Silva"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.name?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ForgeInput
                    label="Canal de Comunicação (E-mail)"
                    placeholder="exemplo@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.email?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ForgeInput
                    label="Chave de Segurança (Senha)"
                    placeholder="Mínimo 8 caracteres"
                    secureTextEntry
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.password?.message}
                  />
                )}
              />

              <View style={styles.typeSection}>
                <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: typography.display }]}>
                  CONFIGURAÇÃO DE PERFIL
                </Text>
                
                <View style={[styles.typeContainer, { backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: effects.radius.md }]}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      selectedType === 'BUYER' && { 
                        backgroundColor: colors.surface,
                        borderColor: colors.brand,
                        borderWidth: 1,
                      }
                    ]}
                    onPress={() => setValue('type', 'BUYER')}
                  >
                    <Text style={[
                       styles.typeButtonText, 
                       { color: selectedType === 'BUYER' ? colors.brand : colors.textMuted, fontFamily: typography.medium }
                    ]}>COMPRADOR</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      selectedType === 'SELLER' && { 
                        backgroundColor: colors.surface,
                        borderColor: colors.brand,
                        borderWidth: 1,
                      }
                    ]}
                    onPress={() => setValue('type', 'SELLER')}
                  >
                    <Text style={[
                      styles.typeButtonText, 
                      { color: selectedType === 'SELLER' ? colors.brand : colors.textMuted, fontFamily: typography.medium }
                    ]}>VENDEDOR</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.termsWrapper} 
                onPress={() => setValue('termsAccepted', !termsAccepted)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox, 
                  { borderColor: colors.border },
                  termsAccepted && { backgroundColor: colors.brand, borderColor: colors.brand }
                ]} />
                <Text style={[styles.termsText, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Declaro que li e concordo com os termos de operação.
                </Text>
              </TouchableOpacity>
              {errors.termsAccepted && <Text style={[styles.errorText, { color: colors.error }]}>{errors.termsAccepted.message}</Text>}

              <ForgeButton
                title="Sincronizar Dados"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                style={styles.submitBtn}
              />
              
              <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.loginNavigation}>
                <Text style={[styles.loginNavText, { color: colors.textMuted, fontFamily: typography.body }]}>
                  RECONHECER ACESSO? <Text style={{ color: colors.brand, fontFamily: typography.display }}>ENTRAR</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ForgeGlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </ForgeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(63, 255, 139, 0.1)',
    borderRadius: 4,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 10,
    letterSpacing: 2,
  },
  title: {
    fontSize: 32,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    lineHeight: 24,
  },
  formSection: {
    gap: 8,
  },
  typeSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    marginBottom: 12,
    letterSpacing: 1,
  },
  typeContainer: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    letterSpacing: 1,
  },
  termsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  termsText: {
    fontSize: 14,
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
  },
  submitBtn: {
    marginTop: 8,
  },
  loginNavigation: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginNavText: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
