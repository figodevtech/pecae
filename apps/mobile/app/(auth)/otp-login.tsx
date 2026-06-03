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
} from '../../src/components/PecaeUI';
import { usePecaeTheme } from '../../src/theme';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth-store';

const phoneSchema = z.object({
  phone: z.string().min(10, 'Telefone inválido'),
});

const codeSchema = z.object({
  code: z.string().length(6, 'O código deve ter 6 dígitos'),
});

type PhoneFormData = z.infer<typeof phoneSchema>;
type CodeFormData = z.infer<typeof codeSchema>;

export default function OtpLoginScreen() {
  const router = useRouter();
  const { colors, typography } = usePecaeTheme();
  const { setAuth } = useAuthStore();
  
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');

  const phoneForm = useForm<PhoneFormData>({ resolver: zodResolver(phoneSchema) });
  const codeForm = useForm<CodeFormData>({ resolver: zodResolver(codeSchema) });

  const onSendOtp = async (data: PhoneFormData) => {
    try {
      await api.post('/auth/phone/send-otp', { phone: data.phone });
      setPhoneNumber(data.phone);
      setStep('code');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao enviar código';
      Alert.alert('FALHA', message);
    }
  };

  const onVerifyOtp = async (data: CodeFormData) => {
    try {
      const response = await api.post('/auth/phone/verify-otp', {
        phone: phoneNumber,
        code: data.code,
      });
      const { user, tokens } = response.data;
      await setAuth(user, tokens.accessToken, tokens.refreshToken);
      router.replace('/(tabs)');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Código inválido ou expirado';
      Alert.alert('FALHA', message);
    }
  };

  return (
    <PecaeBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => step === 'code' ? setStep('phone') : router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
              {step === 'phone' ? 'OTP_REQUEST' : 'OTP_VERIFICATION'}
            </Text>
            <View style={[styles.titleUnderline, { backgroundColor: colors.brand }]} />
            <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
              {step === 'phone' 
                ? 'Insira seu telefone para receber o código de acesso.' 
                : `Enviamos um código para ${phoneNumber}`}
            </Text>
          </View>

          <PecaeGlassCard intensity={20} style={styles.card}>
            {step === 'phone' ? (
              <View style={styles.form}>
                <Controller
                  control={phoneForm.control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <PecaeInput
                      label="TELEFONE"
                      placeholder="+55 11 99999-9999"
                      keyboardType="phone-pad"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={phoneForm.formState.errors.phone?.message}
                      leftIcon={<Ionicons name="call-outline" size={20} color={colors.textMuted} />}
                    />
                  )}
                />
                <PecaeButton
                  title="SOLICITAR CÓDIGO"
                  onPress={phoneForm.handleSubmit(onSendOtp)}
                  loading={phoneForm.formState.isSubmitting}
                  variant="primary"
                />
              </View>
            ) : (
              <View style={styles.form}>
                <Controller
                  control={codeForm.control}
                  name="code"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <PecaeInput
                      label="CÓDIGO DE 6 DÍGITOS"
                      placeholder="000000"
                      keyboardType="number-pad"
                      maxLength={6}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={codeForm.formState.errors.code?.message}
                      leftIcon={<Ionicons name="key-outline" size={20} color={colors.textMuted} />}
                    />
                  )}
                />
                <PecaeButton
                  title="VERIFICAR E ENTRAR"
                  onPress={codeForm.handleSubmit(onVerifyOtp)}
                  loading={codeForm.formState.isSubmitting}
                  variant="primary"
                />
                <TouchableOpacity 
                  onPress={phoneForm.handleSubmit(onSendOtp)} 
                  style={styles.resendButton}
                >
                  <Text style={[styles.resendText, { color: colors.brand, fontFamily: typography.display }]}>
                    // REENVIAR_CODIGO
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
  subtitle: { fontSize: 12, textAlign: 'center', letterSpacing: 1, opacity: 0.8 },
  card: { padding: 24 },
  form: { width: '100%' },
  resendButton: { marginTop: 24, alignItems: 'center' },
  resendText: { fontSize: 10, letterSpacing: 1 },
});
