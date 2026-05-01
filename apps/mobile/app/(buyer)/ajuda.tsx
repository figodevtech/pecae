import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePecaeTheme } from '../../src/theme';
import { PecaeBackground } from '../../src/components/PecaeUI/PecaeBackground';
import { PecaeGlassCard } from '../../src/components/PecaeUI/PecaeGlassCard';

export default function MenuAjuda() {
  const { colors, typography, isDark } = usePecaeTheme();
  const router = useRouter();

  const faqs = [
    {
      pergunta: 'Como funciona a compra segura?',
      resposta: 'Todas as transações na plataforma PECAÊ passam por análise de segurança cadastral e proteção ao comprador.',
    },
    {
      pergunta: 'Como entro em contato com o suporte?',
      resposta: 'Você pode enviar um e-mail para suporte@pecae.com.br ou usar o chat interno disponível no painel de pedidos.',
    },
    {
      pergunta: 'Quais os prazos de entrega?',
      resposta: 'Os prazos dependem diretamente do vendedor e transportadora selecionada no momento da compra.',
    },
    {
      pergunta: 'Como cancelar um pedido?',
      resposta: 'O cancelamento pode ser solicitado diretamente no detalhe do pedido em até 7 dias após o recebimento.',
    },
  ];

  return (
    <PecaeBackground>
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            headerShown: true,
            title: 'Central de Ajuda',
            headerTransparent: true,
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { fontFamily: typography.display, fontSize: 18 },
          }}
        />

        <View style={styles.headerSpacer} />

        <ScrollView 
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionTitle, { color: colors.brand, fontFamily: typography.display }]}>
            PERGUNTAS FREQUENTES
          </Text>

          {faqs.map((faq, index) => (
            <PecaeGlassCard 
              key={index} 
              style={styles.faqCard}
              intensity={isDark ? 10 : 35}
            >
              <Text style={[styles.faqQuestion, { color: colors.textPrimary, fontFamily: typography.display }]}>
                {faq.pergunta}
              </Text>
              <Text style={[styles.faqAnswer, { color: colors.textMuted, fontFamily: typography.body }]}>
                {faq.resposta}
              </Text>
            </PecaeGlassCard>
          ))}

          <PecaeGlassCard style={styles.contactCard} intensity={isDark ? 30 : 60}>
            <View style={[styles.contactIconBox, { backgroundColor: colors.brand + '15' }]}>
              <Ionicons name="chatbubbles" size={32} color={colors.brand} />
            </View>
            <Text style={[styles.contactTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
              AINDA PRECISA DE AJUDA?
            </Text>
            <Text style={[styles.contactDesc, { color: colors.textMuted, fontFamily: typography.body }]}>
              Nosso time de suporte está disponível para tirar suas dúvidas em tempo real.
            </Text>
            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: colors.brand }]}>
              <Text style={[styles.contactBtnText, { fontFamily: typography.display }]}>
                INICIAR CHAT AGORA
              </Text>
            </TouchableOpacity>
          </PecaeGlassCard>

          <View style={styles.otherOptions}>
            <TouchableOpacity style={styles.optionRow}>
              <Ionicons name="document-text-outline" size={20} color={colors.textMuted} />
              <Text style={[styles.optionText, { color: colors.textPrimary, fontFamily: typography.body }]}>Termos de Uso</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            
            <View style={[styles.separator, { backgroundColor: colors.border + '30' }]} />

            <TouchableOpacity style={styles.optionRow}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
              <Text style={[styles.optionText, { color: colors.textPrimary, fontFamily: typography.body }]}>Política de Privacidade</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSpacer: {
    height: 80,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 16,
    paddingLeft: 4,
    opacity: 0.6,
  },
  faqCard: {
    padding: 16,
    marginBottom: 12,
  },
  faqQuestion: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
  },
  contactCard: {
    padding: 24,
    alignItems: 'center',
    marginTop: 24,
  },
  contactIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 16,
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  contactDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  contactBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  contactBtnText: {
    fontSize: 13,
    color: '#000',
    fontWeight: '700',
  },
  otherOptions: {
    marginTop: 32,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
  },
  separator: {
    height: 1,
  },
});
