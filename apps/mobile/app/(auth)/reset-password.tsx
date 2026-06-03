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
import { useRouter, useLocalSearchParams } from 'expo-router';
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

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string().min(8, 'Confirme sua senha'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { colors, typography } = usePecaeTheme();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      Alert.alert('ERRO', 'Token de redefinição ausente.');
      return;
    }

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: data.newPassword,
      });
      Alert.alert(
        'SUCESSO',
        'Sua chave de acesso foi redefinida com sucesso.',
        [{ text: 'ENTRAR', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao redefinir senha';
      Alert.alert('FALHA', message);
    }
  };

  return (
    <PecaeBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(auth)/login')}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
              KEY_REDEFINITION
            </Text>
            <View style={[styles.titleUnderline, { backgroundColor: colors.brand }]} />
            <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
              Crie uma nova chave de acesso segura.
            </Text>
          </View>

          <PecaeGlassCard intensity={20} style={styles.card}>
            <View style={styles.form}>
              <Controller
                control={control}
                name="newPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PecaeInput
                    label="NOVA CHAVE"
                    placeholder="Mínimo 8 caracteres"
                    secureTextEntry
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.newPassword?.message}
                    leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />}
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PecaeInput
                    label="CONFIRMAR CHAVE"
                    placeholder="Repita a nova chave"
                    secureTextEntry
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.confirmPassword?.message}
                    leftIcon={<Ionicons name="checkmark-shield-outline" size={20} color={colors.textMuted} />}
                  />
                )}
              />

              <PecaeButton
                title="REDEFINIR CHAVE"
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
