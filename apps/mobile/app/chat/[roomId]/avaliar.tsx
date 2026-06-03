import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { 
  PecaeBackground, 
  PecaeGlassCard, 
  PecaeButton, 
  PecaeInput,
  StarRatingPicker
} from '../../../src/components/PecaeUI';
import { usePecaeTheme } from '../../../src/theme';
import { api } from '../../../src/services/api';

export default function EvalSellerScreen() {
  const { roomId, sellerId, storeName } = useLocalSearchParams<{ 
    roomId: string; 
    sellerId: string; 
    storeName?: string; 
  }>();
  const router = useRouter();
  const { colors, typography, effects } = usePecaeTheme();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/reviews', {
        chatRoomId: roomId,
        sellerProfileId: sellerId,
        rating,
        comment: comment.trim() || undefined,
      });
      return data;
    },
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['seller', sellerId] });
      queryClient.invalidateQueries({ queryKey: ['seller-reviews', sellerId] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Erro ao enviar avaliação.';
      const formattedMsg = Array.isArray(msg) ? msg.join('\n') : msg;
      if (Platform.OS === 'web') {
        alert(formattedMsg);
      } else {
        Alert.alert('Falha', formattedMsg);
      }
    }
  });

  const handleSubmit = () => {
    if (rating === 0) {
      if (Platform.OS === 'web') {
        alert('Por favor, selecione uma nota de 1 a 5 estrelas.');
      } else {
        Alert.alert('Atenção', 'Por favor, selecione uma nota de 1 a 5 estrelas.');
      }
      return;
    }
    mutation.mutate();
  };

  if (success) {
    return (
      <PecaeBackground>
        <View style={styles.centerContainer}>
          <PecaeGlassCard intensity={25} style={[styles.successCard, { borderRadius: effects.radius.xl }]}>
            <View style={styles.successIconWrapper}>
              <View style={[styles.glow, { backgroundColor: colors.brand }]} />
              <Ionicons name="checkmark-seal" size={100} color={colors.brand} />
            </View>
            <Text style={[styles.successTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
              TRANSAÇÃO AVALIADA
            </Text>
            <Text style={[styles.successSubtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
              Obrigado por fortalecer o ecossistema PECAÊ com seu feedback.
            </Text>
            <PecaeButton 
              title="FINALIZAR" 
              onPress={() => router.back()} 
              variant="primary"
              style={styles.backButton}
            />
          </PecaeGlassCard>
        </View>
      </PecaeBackground>
    );
  }

  return (
    <PecaeBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.titleColumn}>
            <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
              AVALIAR VENDEDOR
            </Text>
            <Text style={[styles.subtitle, { color: colors.brand, fontFamily: typography.body }]}>
              {storeName?.toUpperCase() || 'VENDEDOR PARCEIRO'}
            </Text>
          </View>
        </View>

        <PecaeGlassCard intensity={15} style={[styles.formCard, { borderRadius: effects.radius.lg }]}>
          <View style={styles.ratingSection}>
            <Text style={[styles.label, { color: colors.textMuted, fontFamily: typography.display }]}>
              QUALIDADE DO ATENDIMENTO
            </Text>
            
            <View style={styles.starsWrapper}>
              <StarRatingPicker 
                rating={rating} 
                onRatingChange={setRating} 
                size={48}
              />
            </View>
            
            <Text style={[styles.ratingFeedback, { color: colors.textPrimary, fontFamily: typography.body }]}>
              {rating === 5 ? 'Excelente!' : rating === 4 ? 'Muito bom' : rating === 3 ? 'Regular' : rating === 2 ? 'Ruim' : rating === 1 ? 'Péssimo' : 'Selecione uma nota'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.commentSection}>
            <View style={styles.commentHeader}>
              <Text style={[styles.label, { color: colors.textMuted, fontFamily: typography.display }]}>
                RELATÓRIO DE EXPERIÊNCIA
              </Text>
              <Text style={[styles.counter, { color: colors.textMuted, fontFamily: typography.body }]}>
                {comment.length}/800
              </Text>
            </View>

            <PecaeInput
              placeholder="Descreva detalhes da negociação, agilidade e estado das peças..."
              value={comment}
              onChangeText={setComment}
              maxLength={800}
              multiline
              numberOfLines={6}
              style={styles.textArea}
            />
          </View>

          <PecaeButton
            title={mutation.isPending ? "PROCESSANDO..." : "ENVIAR AVALIAÇÃO"}
            onPress={handleSubmit}
            disabled={rating === 0 || mutation.isPending}
            loading={mutation.isPending}
            style={styles.submitButton}
            variant="primary"
            testID="submit-eval-button"
          />
        </PecaeGlassCard>
        
        <View style={styles.securityNote}>
          <MaterialCommunityIcons name="shield-check-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.noteText, { color: colors.textMuted, fontFamily: typography.body }]}>
            Sua avaliação será visível publicamente no perfil do vendedor.
          </Text>
        </View>
      </View>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  titleColumn: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 2,
  },
  formCard: {
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 16,
  },
  starsWrapper: {
    marginVertical: 8,
  },
  ratingFeedback: {
    fontSize: 14,
    marginTop: 12,
    opacity: 0.8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 24,
  },
  commentSection: {
    marginBottom: 32,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  counter: {
    fontSize: 10,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  submitButton: {
    marginTop: 8,
    height: 56,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successCard: {
    padding: 40,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  successIconWrapper: {
    marginBottom: 32,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.2,
  },
  successTitle: {
    fontSize: 24,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
    opacity: 0.7,
  },
  backButton: {
    width: '100%',
    height: 56,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  noteText: {
    fontSize: 10,
    opacity: 0.5,
  },
});

