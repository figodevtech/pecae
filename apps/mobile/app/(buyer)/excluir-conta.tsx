import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, SafeAreaView } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth-store';
import { api } from '../../src/services/api';
import { usePecaeTheme } from '../../src/theme';
import { PecaeBackground } from '../../src/components/PecaeUI/PecaeBackground';
import { PecaeGlassCard } from '../../src/components/PecaeUI/PecaeGlassCard';

export default function ExcluirContaScreen() {
  const { colors, typography, isDark } = usePecaeTheme();
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { clearAuth: signOut } = useAuthStore();

  const handleDelete = () => {
    if (!password || password.trim() === '') {
      Alert.alert('Atenção', 'Você precisa informar sua senha atual para excluir a conta.');
      return;
    }

    Alert.alert(
      'Aviso Irreversível',
      'Sua conta será apagada. Por motivos legais, seus dados ficarão retidos por 30 dias antes de serem permanentemente anonimizados, mas seu acesso será imediatamente revogado. Deseja mesmo continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir Conta',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete('/buyers/me', {
        data: { currentPassword: password },
      });
      
      Alert.alert(
        'Conta Excluída',
        'Sua conta foi agendada para exclusão e você foi desconectado.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await signOut();
              router.replace('/(auth)/login');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || 'Erro ao tentar excluir a conta.';
      Alert.alert('Erro', message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PecaeBackground>
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{ 
            headerShown: true,
            title: 'Excluir Conta',
            headerTransparent: true,
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { fontFamily: typography.display, fontSize: 18 },
          }} 
        />

        <KeyboardAvoidingView 
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.headerSpacer} />
          
          <View style={styles.content}>
            <PecaeGlassCard style={styles.warningCard} intensity={isDark ? 15 : 40}>
              <View style={[styles.iconBox, { backgroundColor: colors.error + '15' }]}>
                <Ionicons name="alert-circle" size={32} color={colors.error || '#ef4444'} />
              </View>
              <Text style={[styles.warningTitle, { color: colors.error || '#ef4444', fontFamily: typography.display }]}>
                ZONA DE PERIGO
              </Text>
              <Text style={[styles.warningText, { color: colors.textPrimary, fontFamily: typography.body }]}>
                A exclusão da conta resultará na revogação imediata do acesso. 
                Todas as suas configurações, buscas salvas e favoritos serão apagados permanentemente.
              </Text>
            </PecaeGlassCard>

            <PecaeGlassCard style={styles.formCard} intensity={isDark ? 5 : 20}>
              <Text style={[styles.label, { color: colors.textMuted, fontFamily: typography.display }]}>CONFIRME SUA SENHA</Text>
              <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', borderColor: colors.border + '50' }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, fontFamily: typography.body }]}
                  placeholder="Senha atual"
                  placeholderTextColor={colors.textMuted + '80'}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isDeleting}
                />
              </View>
            </PecaeGlassCard>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.deleteButton, { backgroundColor: colors.error || '#ef4444' }, isDeleting && { opacity: 0.7 }]}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={[styles.deleteButtonText, { fontFamily: typography.display }]}>EXCLUIR MINHA CONTA</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={isDeleting}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textMuted, fontFamily: typography.body }]}>
                Voltar em Segurança
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  headerSpacer: {
    height: 80,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  warningCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 16,
    letterSpacing: 2,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
  formCard: {
    padding: 20,
  },
  label: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 12,
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
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 0 : 24,
  },
  deleteButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cancelButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
