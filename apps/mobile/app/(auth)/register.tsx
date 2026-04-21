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
  PecaeBackground, 
  PecaeGlassCard, 
  PecaeInput, 
  PecaeButton,
  PecaeScreenContainer,
} from '../../src/components/PecaeUI';
import { usePecaeTheme } from '../../src/theme';
import { api } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../../src/theme/breakpoints';

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
  const { colors, typography, effects } = usePecaeTheme();
  const { isMobile, pick } = useResponsive();
  
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
    <PecaeBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <PecaeScreenContainer scrollable>
          <View style={styles.header}>
            <View style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={[styles.tagDot, { backgroundColor: colors.brand }]} />
              <Text style={[styles.tagText, { color: colors.textPrimary, fontFamily: typography.display }]}>
                PLATAFORMA_OFICIAL // V1.2
              </Text>
            </View>
            <Text 
              style={[
                styles.title, 
                { 
                  color: colors.textPrimary, 
                  fontFamily: typography.display,
                  fontSize: pick({ mobile: 32, tablet: 42, desktop: 56 }),
                  letterSpacing: pick({ mobile: 6, tablet: 12, desktop: 16 }),
                }
              ]}
            >
              NOVO CADASTRO
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
              Crie sua conta para entrar no ecossistema de peças e sucatas do PEÇAÊ.
            </Text>
          </View>

          <View style={[styles.contentWrapper, !isMobile && styles.desktopLayout]}>
            {!isMobile && (
              <View style={styles.brandingSection}>
                <Text style={[styles.brandingTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                  // THE_DIGITAL_FORGE
                </Text>
                <Text style={[styles.brandingSubtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Conectando compradores e vendedores no maior marketplace de peças automotivas do Brasil.
                </Text>
              </View>
            )}

            <View style={[styles.formSectionWrapper, !isMobile && { maxWidth: 500 }]}>
              <PecaeGlassCard intensity={30}>
                <View style={styles.formSection}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PecaeInput
                    label="NOME COMPLETO"
                    placeholder="Seu nome"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.name?.message}
                    leftIcon={<Ionicons name="person-outline" size={20} color={colors.textMuted} />}
                  />
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PecaeInput
                    label="E-MAIL"
                    placeholder="seu@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.email?.message}
                    leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textMuted} />}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PecaeInput
                    label="SENHA"
                    placeholder="Sua senha secreta"
                    secureTextEntry
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.password?.message}
                    leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />}
                  />
                )}
              />

              <View style={styles.typeSection}>
                <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: typography.display }]}>TIPO DE CONTA</Text>
                <View style={[styles.typeContainer, { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 }]}>
                  <TouchableOpacity 
                    style={[styles.typeButton, selectedType === 'BUYER' && { backgroundColor: colors.brand }]} 
                    onPress={() => setValue('type', 'BUYER')}
                  >
                    <Text style={[styles.typeButtonText, { color: selectedType === 'BUYER' ? '#000' : colors.textPrimary, fontFamily: typography.display }]}>COMPRADOR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.typeButton, selectedType === 'SELLER' && { backgroundColor: colors.brand }]} 
                    onPress={() => setValue('type', 'SELLER')}
                  >
                    <Text style={[styles.typeButtonText, { color: selectedType === 'SELLER' ? '#000' : colors.textPrimary, fontFamily: typography.display }]}>VENDEDOR</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.termsWrapper}>
                <TouchableOpacity 
                  style={[styles.checkbox, { borderColor: colors.brand, backgroundColor: watch('termsAccepted') ? colors.brand : 'transparent' }]} 
                  onPress={() => setValue('termsAccepted', !watch('termsAccepted'))}
                >
                  {watch('termsAccepted') && <Ionicons name="checkmark" size={16} color="#000" />}
                </TouchableOpacity>
                <Text style={[styles.termsText, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Li e concordo com os <Text style={{ color: colors.brand }}>Termos de Uso</Text> e <Text style={{ color: colors.brand }}>Privacidade</Text>.
                </Text>
              </View>
              {errors.termsAccepted && <Text style={[styles.errorText, { color: colors.error, fontFamily: typography.mono }]}>{errors.termsAccepted.message}</Text>}

              <PecaeButton 
                title="CRIAR MINHA CONTA" 
                onPress={handleSubmit(onSubmit)} 
                loading={isSubmitting} 
                style={styles.submitBtn}
              />

              <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.loginNavigation}>
                <Text style={[styles.loginNavText, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Já tem uma conta? <Text style={{ color: colors.brand, fontFamily: typography.display }}>ENTRAR</Text>
                </Text>
              </TouchableOpacity>
            </View>
              </View>
            </PecaeGlassCard>
          </View>
        </View>
        </PecaeScreenContainer>
      </KeyboardAvoidingView>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  desktopLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 60,
    marginTop: 20,
  },
  brandingSection: {
    flex: 1,
    paddingRight: 40,
  },
  brandingTitle: {
    fontSize: 24,
    letterSpacing: 4,
    marginBottom: 16,
  },
  brandingSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.7,
  },
  formSectionWrapper: {
    flex: 1,
    width: '100%',
  },
  header: {
    marginBottom: 32,
    width: '100%',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 40,
  },
  tagDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  tagText: {
    fontSize: 10,
    letterSpacing: 2,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 1.5,
    opacity: 0.8,
    marginTop: 16,
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
