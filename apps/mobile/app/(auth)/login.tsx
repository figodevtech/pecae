import React from 'react';
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
  ForgeBackground, 
  ForgeGlassCard, 
  ForgeInput, 
  ForgeButton 
} from '../../src/components/ForgeUI';
import { useForgeTheme } from '../../src/theme';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth-store';

const loginSchema = z.object({
  email: z.string().email('Credencial inválida'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { colors, typography, effects } = useForgeTheme();
  const { setAuth } = useAuthStore();
  
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await api.post('/auth/login', data);
      const { user, tokens } = response.data;
      
      await setAuth(user, tokens.accessToken, tokens.refreshToken);
      router.replace('/(tabs)');
    } catch (error: any) {
      const message = error.response?.data?.message || 'E-mail ou senha incorretos';
      Alert.alert('FALHA NO ACESSO', message);
    }
  };

  return (
    <ForgeBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          {/* Tag de Status Técnica */}
          <View style={[styles.statusTag, { backgroundColor: colors.surface + '80', borderColor: colors.brand + '40' }]}>
            <View style={[styles.statusDot, { backgroundColor: colors.brand }]} />
            <Text style={[styles.statusText, { color: colors.textPrimary, fontFamily: typography.display }]}>
              CORE_AUTH_SERVICE // V1.0
            </Text>
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
              PECAÊ
            </Text>
            <View style={[styles.titleUnderline, { backgroundColor: colors.brand }]} />
            <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
              Acesso ao Terminal de Operações Industriais.
            </Text>
          </View>

          <ForgeGlassCard intensity={20} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                SYSTEM_ACCESS
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
                Insira suas credenciais cadastradas.
              </Text>
            </View>

            <View style={styles.form}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ForgeInput
                    label="CREDENCIAL (E-MAIL)"
                    placeholder="tecnico@pecae.com.br"
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
                  <ForgeInput
                    label="CHAVE DE ACESSO"
                    placeholder="Sua senha"
                    secureTextEntry
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.password?.message}
                    leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />}
                  />
                )}
              />

              <TouchableOpacity 
                onPress={() => Alert.alert('RECUPERAÇÃO', 'Protocolo de redefinição será enviado para seu e-mail.')}
                style={styles.forgotPass}
              >
                <Text style={[styles.forgotPassText, { color: colors.brand, fontFamily: typography.display }]}>
                  // ESQUECEU A CHAVE?
                </Text>
              </TouchableOpacity>

              <ForgeButton
                title="AUTENTICAR"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                variant="primary"
                style={styles.loginButton}
              />
              
              <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.registerLink}>
                <Text style={[styles.registerText, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Não possui acesso? <Text style={{ color: colors.brand, fontFamily: typography.display }}>INICIAR_FORJA</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ForgeGlassCard>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textMuted + '60', fontFamily: typography.body }]}>
              ESTA É UMA ÁREA RESTRITA E MONITORADA.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ForgeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
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
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    letterSpacing: 2,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    letterSpacing: 12,
    textAlign: 'center',
  },
  titleUnderline: {
    width: 60,
    height: 2,
    marginTop: 8,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 1.5,
    opacity: 0.8,
  },
  card: {
    padding: 24,
  },
  cardHeader: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    letterSpacing: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.6,
  },
  form: {
    width: '100%',
  },
  forgotPass: {
    alignSelf: 'flex-end',
    marginBottom: 32,
    marginTop: 8,
  },
  forgotPassText: {
    fontSize: 10,
    letterSpacing: 1,
  },
  loginButton: {
    marginTop: 8,
  },
  registerLink: {
    marginTop: 32,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 9,
    letterSpacing: 2,
    textAlign: 'center',
  },
});
