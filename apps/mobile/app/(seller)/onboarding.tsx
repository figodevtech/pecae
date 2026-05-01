import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  PecaeBackground, 
  PecaeGlassCard, 
  PecaeButton, 
  PecaeInput,
  PecaeScreenContainer,
} from '../../src/components/PecaeUI';
import { usePecaeTheme } from '../../src/theme';
import { api } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';

const sellerSchema = z.object({
  storeName: z.string().min(3, 'Nome da loja deve ter pelo menos 3 caracteres'),
  type: z.enum(['PF', 'PJ']),
  cnpj: z.string().optional(),
  description: z.string().min(10, 'Descreva sua loja (mínimo 10 caracteres)'),
  phone: z.string().min(10, 'Telefone inválido'),
  whatsapp: z.string().min(10, 'WhatsApp inválido'),
  address: z.string().min(5, 'Endereço obrigatório'),
  city: z.string().min(2, 'Cidade obrigatória'),
  state: z.string().length(2, 'Estado (UF) deve ter 2 letras'),
  openHours: z.string().optional(),
});

type SellerFormData = z.infer<typeof sellerSchema>;

export default function SellerOnboardingScreen() {
  const router = useRouter();
  const { colors, typography, effects } = usePecaeTheme();
  
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<SellerFormData>({
    resolver: zodResolver(sellerSchema),
    defaultValues: {
      type: 'PF',
    }
  });

  const selectedType = watch('type');

  const onSubmit = async (data: SellerFormData) => {
    try {
      await api.post('/sellers', data);
      Alert.alert('PERFIL CONCLUÍDO', 'Seu perfil de vendedor foi ativado. Bem-vindo à rede.', [
        { text: 'ACESSAR DASHBOARD', onPress: () => router.replace('/(seller)/(seller-tabs)') },
      ]);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao criar perfil de vendedor';
      Alert.alert('ERRO NO PERFIL', message);
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
            <View style={[styles.statusTag, { backgroundColor: colors.surface }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.brand }]} />
              <Text style={[styles.statusText, { color: colors.brand, fontFamily: typography.mono }]}>
                SELLER_ONBOARDING_V1
              </Text>
            </View>
            <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
              PERFIL COMERCIAL
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
              Configure os detalhes da sua loja para começar a anunciar no ecossistema PECAÊ.
            </Text>
          </View>

          <PecaeGlassCard intensity={30} style={styles.card}>
            <View style={styles.form}>
              <View style={styles.typeSelectorContainer}>
                <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: typography.display }]}>
                  TIPO DE ENTIDADE
                </Text>
                <View style={[styles.typeButtonsRow, { backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: effects.radius.md }]}>
                  <TouchableOpacity
                    style={[
                      styles.typeBtn,
                      selectedType === 'PF' && { backgroundColor: colors.surface, borderColor: colors.brand, borderWidth: 1 }
                    ]}
                    onPress={() => setValue('type', 'PF')}
                  >
                    <Text style={[styles.typeBtnText, { color: selectedType === 'PF' ? colors.brand : colors.textMuted, fontFamily: typography.display }]}>PF</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeBtn,
                      selectedType === 'PJ' && { backgroundColor: colors.surface, borderColor: colors.brand, borderWidth: 1 }
                    ]}
                    onPress={() => setValue('type', 'PJ')}
                  >
                    <Text style={[styles.typeBtnText, { color: selectedType === 'PJ' ? colors.brand : colors.textMuted, fontFamily: typography.display }]}>PJ</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {selectedType === 'PJ' && (
                <Controller
                  control={control}
                  name="cnpj"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <PecaeInput
                      label="CNPJ DA OPERAÇÃO"
                      placeholder="00.000.000/0000-00"
                      keyboardType="numeric"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={errors.cnpj?.message}
                      leftIcon={<Ionicons name="card-outline" size={20} color={colors.textMuted} />}
                    />
                  )}
                />
              )}

              <Controller
                control={control}
                name="storeName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PecaeInput
                    label="NOME DA LOJA / DESMONTE"
                    placeholder="Ex: Ferro Velho do Juca"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.storeName?.message}
                    leftIcon={<Ionicons name="business-outline" size={20} color={colors.textMuted} />}
                  />
                )}
              />

              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PecaeInput
                    label="DESCRIÇÃO DA OPERAÇÃO"
                    placeholder="Conte sobre suas especialidades..."
                    multiline
                    numberOfLines={3}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.description?.message}
                    style={{ height: 100 }}
                  />
                )}
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <PecaeInput
                        label="TELEFONE"
                        placeholder="(00) 0000-0000"
                        keyboardType="phone-pad"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        error={errors.phone?.message}
                      />
                    )}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Controller
                    control={control}
                    name="whatsapp"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <PecaeInput
                        label="WHATSAPP"
                        placeholder="(00) 90000-0000"
                        keyboardType="phone-pad"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        error={errors.whatsapp?.message}
                      />
                    )}
                  />
                </View>
              </View>

              <Controller
                control={control}
                name="address"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PecaeInput
                    label="ENDEREÇO COMPLETO"
                    placeholder="Rua, número, bairro..."
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.address?.message}
                    leftIcon={<Ionicons name="location-outline" size={20} color={colors.textMuted} />}
                  />
                )}
              />

              <View style={styles.row}>
                <View style={{ flex: 2, marginRight: 10 }}>
                  <Controller
                    control={control}
                    name="city"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <PecaeInput
                        label="CIDADE"
                        placeholder="Ex: São Paulo"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        error={errors.city?.message}
                      />
                    )}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Controller
                    control={control}
                    name="state"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <PecaeInput
                        label="UF"
                        placeholder="SP"
                        autoCapitalize="characters"
                        maxLength={2}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        error={errors.state?.message}
                      />
                    )}
                  />
                </View>
              </View>

              <Controller
                control={control}
                name="openHours"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PecaeInput
                    label="HORÁRIO DE ATENDIMENTO (OPCIONAL)"
                    placeholder="Ex: Seg-Sex: 08:00 - 18:00"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.openHours?.message}
                    leftIcon={<Ionicons name="time-outline" size={20} color={colors.textMuted} />}
                  />
                )}
              />

              <PecaeButton
                title="FINALIZAR CADASTRO"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                style={styles.submitBtn}
              />
            </View>
          </PecaeGlassCard>
        </PecaeScreenContainer>
      </KeyboardAvoidingView>
    </PecaeBackground>
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
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
    opacity: 0.7,
  },
  card: {
    marginBottom: 40,
  },
  form: {
    padding: 8,
  },
  typeSelectorContainer: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 10,
  },
  typeButtonsRow: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeBtnText: {
    fontSize: 12,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  submitBtn: {
    marginTop: 24,
  },
});
