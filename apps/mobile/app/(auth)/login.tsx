import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Ionicons } from '@expo/vector-icons';
import {
  PecaeBackground,
  PecaeGlassCard,
  PecaeInput,
  PecaeButton,
  PecaeScreenContainer,
} from '../../src/components/PecaeUI';
import { usePecaeTheme } from '../../src/theme';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth-store';
import { useGoogleAuth } from '../../src/hooks/useGoogleAuth';
import { useResponsive } from '../../src/theme/breakpoints';

const loginSchema = z.object({
  email: z.string().email('Credencial inválida'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { colors, typography } = usePecaeTheme();
  const { setAuth } = useAuthStore();
  const { isMobile, isDesktop, pick } = useResponsive();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  // ─── Email/Password Login ────────────────────────────────────

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await api.post('/auth/login', data);
      const { user, tokens } = response.data;
      await setAuth(user, tokens.accessToken, tokens.refreshToken);
      
      // Lógica de Redirecionamento Inteligente
      if (user.type === 'SELLER' || user.type === 'BOTH') {
        if (!user.hasProfile) {
          router.replace('/(seller)/onboarding');
        } else {
          router.replace('/(seller)/(tabs)');
        }
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'E-mail ou senha incorretos';
      Alert.alert('FALHA NO ACESSO', message);
    }
  };

  // ─── Google OAuth ────────────────────────────────────────────

  const { signIn: signInWithGoogle, loading: googleLoading } = useGoogleAuth({
    onSuccess: async (data) => {
      await setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      
      const { user } = data;
      if (user.type === 'SELLER' || user.type === 'BOTH') {
        if (!user.hasProfile) {
          router.replace('/(seller)/onboarding');
        } else {
          router.replace('/(seller)/(tabs)');
        }
      } else {
        router.replace('/(tabs)');
      }
    },
    onError: (message) => Alert.alert('FALHA GOOGLE', message),
  });


  return (
    <PecaeBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <PecaeScreenContainer scrollable>
          <View
            style={[
              styles.statusTag,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: colors.brand }]} />
            <Text
              style={[
                styles.statusText,
                { color: colors.textPrimary, fontFamily: typography.display },
              ]}
            >
              PLATAFORMA_OFICIAL // V1.2
            </Text>
          </View>

          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { 
                  color: colors.textPrimary, 
                  fontFamily: typography.display,
                  fontSize: pick({ mobile: 32, tablet: 42, desktop: 56 }),
                  letterSpacing: pick({ mobile: 6, tablet: 12, desktop: 16 }),
                },
              ]}
            >
              PEÇAÊ
            </Text>
            <View style={[styles.titleUnderline, { backgroundColor: colors.brand }]} />
            <Text
              style={[
                styles.subtitle,
                { color: colors.textMuted, fontFamily: typography.body },
              ]}
            >
              O maior ecossistema de peças e sucatas.
            </Text>
          </View>

          <View style={[
            styles.contentWrapper,
            !isMobile && styles.desktopLayout
          ]}>
            {!isMobile && (
              <View style={styles.brandingSection}>
                <Text style={[styles.brandingTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                  // THE_DIGITAL_FORGE
                </Text>
                <Text style={[styles.brandingSubtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Construindo o futuro do mercado automotivo com tecnologia e sustentabilidade.
                </Text>
              </View>
            )}

            <View style={[styles.formSection, !isMobile && { maxWidth: 450 }]}>
              <PecaeGlassCard intensity={20} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text
                  style={[
                    styles.cardTitle,
                    { color: colors.textPrimary, fontFamily: typography.display },
                  ]}
                >
                  IDENTIFICAÇÃO
                </Text>
                <Text
                  style={[
                    styles.cardSubtitle,
                    { color: colors.textMuted, fontFamily: typography.body },
                  ]}
                >
                  Bem-vindo de volta! Entre com seus dados.
                </Text>
              </View>

              <View style={styles.form}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <PecaeInput
                      label="E-MAIL"
                      placeholder="seu@email.com.br"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={errors.email?.message}
                      leftIcon={
                        <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
                      }
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <PecaeInput
                      label="SENHA"
                      placeholder="Digite sua senha"
                      secureTextEntry
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={errors.password?.message}
                      leftIcon={
                        <Ionicons
                          name="lock-closed-outline"
                          size={20}
                          color={colors.textMuted}
                        />
                      }
                    />
                  )}
                />

                <TouchableOpacity
                  onPress={() => router.push('/(auth)/forgot-password')}
                  style={styles.forgotPass}
                >
                  <Text
                    style={[
                      styles.forgotPassText,
                      { color: colors.brand, fontFamily: typography.display },
                    ]}
                  >
                    // ESQUECEU A SENHA?
                  </Text>
                </TouchableOpacity>

                <PecaeButton
                  title="ENTRAR"
                  onPress={handleSubmit(onSubmit)}
                  loading={isSubmitting}
                  variant="primary"
                  style={styles.loginButton}
                />

                <View style={styles.dividerRow}>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                  <Text
                    style={[styles.dividerText, { color: colors.textMuted, fontFamily: typography.body }]}
                  >
                    ou continue com
                  </Text>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                </View>

                <PecaeButton
                  title="GOOGLE"
                  onPress={signInWithGoogle}
                  loading={googleLoading}
                  variant="secondary"
                  style={styles.oauthButton}
                  leftIcon={
                    <Ionicons name="logo-google" size={18} color={colors.textPrimary} />
                  }
                />

                <TouchableOpacity
                  onPress={() => router.push('/(auth)/register')}
                  style={styles.registerLink}
                >
                  <Text
                    style={[
                      styles.registerText,
                      { color: colors.textMuted, fontFamily: typography.body },
                    ]}
                  >
                    Ainda não tem conta?{' '}
                    <Text style={{ color: colors.brand, fontFamily: typography.display }}>
                      CRIAR CONTA
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </PecaeGlassCard>
          </View>
        </View>

          <View style={styles.footer}>
            <Text
              style={[
                styles.footerText,
                { color: colors.textMuted, opacity: 0.5, fontFamily: typography.body },
              ]}
            >
              © 2026 PEÇAÊ - MARKETPLACE DE PEÇAS USADAS.
            </Text>
          </View>
        </PecaeScreenContainer>
      </KeyboardAvoidingView>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  desktopLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 40,
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
  formSection: {
    flex: 1,
    width: '100%',
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'center',
    marginBottom: 40,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  statusText: { fontSize: 10, letterSpacing: 2 },
  header: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 42, letterSpacing: 12, textAlign: 'center' },
  titleUnderline: { width: 60, height: 2, marginTop: 8, marginBottom: 16 },
  subtitle: { fontSize: 12, textAlign: 'center', letterSpacing: 1.5, opacity: 0.8 },
  card: { padding: 24 },
  cardHeader: { marginBottom: 24 },
  cardTitle: { fontSize: 18, letterSpacing: 4 },
  cardSubtitle: { fontSize: 12, marginTop: 4, opacity: 0.6 },
  form: { width: '100%' },
  forgotPass: { alignSelf: 'flex-end', marginBottom: 32, marginTop: 8 },
  forgotPassText: { fontSize: 10, letterSpacing: 1 },
  loginButton: { marginTop: 8 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, opacity: 0.3 },
  dividerText: { fontSize: 10, letterSpacing: 1, opacity: 0.6 },
  oauthButton: { marginBottom: 12 },
  registerLink: { marginTop: 24, alignItems: 'center' },
  registerText: { fontSize: 12, letterSpacing: 0.5 },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 10, letterSpacing: 1, textAlign: 'center' },
});
