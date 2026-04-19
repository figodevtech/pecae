import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ForgeBackground, 
  ForgeGlassCard, 
  ForgeButton 
} from '../../src/components/ForgeUI';
import { useForgeTheme } from '../../src/theme';
import { api } from '../../src/services/api';

const verifySchema = z.object({
  code: z.string().length(6, 'O código deve ter 6 dígitos'),
});

type VerifyFormData = z.infer<typeof verifySchema>;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { colors, typography, effects } = useForgeTheme();
  
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  });

  const onSubmit = async (data: VerifyFormData) => {
    try {
      await api.post('/auth/verify-email', data);
      Alert.alert('ACESSO CONCEDIDO', 'Entidade verificada com sucesso.', [
        { text: 'PROSSEGUIR', onPress: () => router.push('/(auth)/login') },
      ]);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Código inválido ou expirado';
      Alert.alert('FALHA NA SINCRONIZAÇÃO', message);
    }
  };

  const resendCode = async () => {
    try {
      await api.post('/auth/resend-verification');
      Alert.alert('NOTIFICAÇÃO', 'Novo código de acesso enviado.');
    } catch (error: any) {
      Alert.alert('ERRO DE TRANSMISSÃO', 'Não foi possível reenviar o código.');
    }
  };

  return (
    <ForgeBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Text style={[styles.backBtnText, { color: colors.textMuted, fontFamily: typography.display }]}>
            ← VOLTAR
          </Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.statusTag}>
            <View style={[styles.statusDot, { backgroundColor: colors.brand }]} />
            <Text style={[styles.statusText, { color: colors.brand, fontFamily: typography.mono }]}>
              ACCOUNT_PENDING_VERIFICATION
            </Text>
          </View>
          <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
            VERIFICAÇÃO
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
            Insira o código de 6 dígitos enviado ao seu canal de comunicação para sincronizar sua conta.
          </Text>
        </View>

        <ForgeGlassCard intensity={40} style={styles.card}>
          <View style={styles.form}>
            <Text style={[styles.inputLabel, { color: colors.textMuted, fontFamily: typography.display }]}>
              CÓDIGO DE SINCRONIZAÇÃO
            </Text>
            
            <Controller
              control={control}
              name="code"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[
                    styles.codeInput,
                    {
                      color: colors.brand,
                      fontFamily: typography.display,
                      backgroundColor: 'rgba(0,0,0,0.15)',
                      borderColor: errors.code ? colors.error : colors.border,
                      borderWidth: 1,
                      borderRadius: effects.radius.sm,
                    }
                  ]}
                  placeholder="000000"
                  placeholderTextColor="rgba(63, 255, 139, 0.2)"
                  keyboardType="number-pad"
                  maxLength={6}
                  onChangeText={onChange}
                  value={value}
                  autoFocus
                />
              )}
            />
            {errors.code && (
              <Text style={[styles.errorMsg, { color: colors.error, fontFamily: typography.body }]}>
                {errors.code.message}
              </Text>
            )}

            <ForgeButton
              title="Sincronizar Agora"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              style={styles.verifyBtn}
            />

            <TouchableOpacity onPress={resendCode} style={styles.resendAction}>
              <Text style={[styles.resendActionText, { color: colors.textMuted, fontFamily: typography.body }]}>
                Problemas no recebimento? <Text style={{ color: colors.brand, fontFamily: typography.display }}>REENVIAR</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ForgeGlassCard>
      </KeyboardAvoidingView>
    </ForgeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 60,
    left: 24,
  },
  backBtnText: {
    fontSize: 12,
    letterSpacing: 1,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(63, 255, 139, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  card: {
    marginTop: 10,
  },
  form: {
    paddingVertical: 10,
  },
  inputLabel: {
    fontSize: 11,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 2,
  },
  codeInput: {
    height: 70,
    fontSize: 36,
    textAlign: 'center',
    letterSpacing: 12,
    paddingLeft: 12, // Offset for letterSpacing
  },
  errorMsg: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  verifyBtn: {
    marginTop: 24,
  },
  resendAction: {
    marginTop: 24,
    alignItems: 'center',
  },
  resendActionText: {
    fontSize: 13,
  },
});
