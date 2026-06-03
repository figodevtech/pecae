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
  PecaeBackground,
  PecaeGlassCard,
  PecaeInput,
  PecaeButton,
} from '../../src/components/PecaeUI';
import { usePecaeTheme } from '../../src/theme';
import { api } from '../../src/services/api';

const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors, typography } = usePecaeTheme();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await api.post('/auth/forgot-password', data);
      Alert.alert(
        'SUCESSO',
        'Se este e-mail estiver cadastrado, você receberá um link de recuperação em instantes.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao processar solicitação';
      Alert.alert('FALHA', message);
    }
  };

  return (
    <PecaeBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
              RECOVERY_REQUEST
            </Text>
            <View style={[styles.titleUnderline, { backgroundColor: colors.brand }]} />
            <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
              Inicie o protocolo de redefinição de chave.
            </Text>
          </View>

          <PecaeGlassCard intensity={20} style={styles.card}>
            <View style={styles.form}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PecaeInput
                    label="E-MAIL DE CADASTRO"
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

              <PecaeButton
                title="SOLICITAR RESET"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                variant="primary"
                style={styles.button}
              />
            </View>
          </PecaeGlassCard>
        </View>
      </KeyboardAvoidingView>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: { position: 'absolute', top: 60, left: 24, zIndex: 10 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  header: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 24, letterSpacing: 8, textAlign: 'center' },
  titleUnderline: { width: 40, height: 2, marginTop: 8, marginBottom: 16 },
  subtitle: { fontSize: 12, textAlign: 'center', letterSpacing: 1.5, opacity: 0.8 },
  card: { padding: 24 },
  form: { width: '100%' },
  button: { marginTop: 8 },
});
