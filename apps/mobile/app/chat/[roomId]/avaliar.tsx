import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { 
  PecaeBackground, 
  PecaeScreenContainer, 
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
  const { colors, typography } = usePecaeTheme();
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
      // Invalidate relevant queries (seller and reviews)
      queryClient.invalidateQueries({ queryKey: ['seller', sellerId] });
      queryClient.invalidateQueries({ queryKey: ['seller-reviews', sellerId] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Erro ao enviar avaliação.';
      Alert.alert('Falha', Array.isArray(msg) ? msg.join('\n') : msg);
    }
  });

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Atenção', 'Por favor, selecione uma nota de 1 a 5 estrelas.');
      return;
    }
    mutation.mutate();
  };

  if (success) {
    return (
      <PecaeBackground>
        <PecaeScreenContainer style={styles.successContainer}>
          <PecaeGlassCard style={styles.successCard}>
            <View style={styles.successIconWrapper}>
              <Ionicons name="checkmark-circle" size={80} color={colors.brand} />
            </View>
            <Text style={[styles.successTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
              AVALIAÇÃO ENVIADA!
            </Text>
            <Text style={[styles.successSubtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
              Sua opinião ajuda a manter a comunidade PECAÊ transparente e confiável.
            </Text>
            <PecaeButton 
              title="VOLTAR" 
              onPress={() => router.back()} 
              style={styles.backButton}
            />
          </PecaeGlassCard>
        </PecaeScreenContainer>
      </PecaeBackground>
    );
  }

  return (
    <PecaeBackground>
      <PecaeScreenContainer>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
            AVALIAR VENDEDOR
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
            {storeName || 'Vendedor'}
          </Text>
        </View>

        <PecaeGlassCard style={styles.formCard}>
          <Text style={[styles.label, { color: colors.textMuted, fontFamily: typography.heading }]}>
            QUAL SUA NOTA PARA O ATENDIMENTO?
          </Text>
          
          <StarRatingPicker 
            rating={rating} 
            onRatingChange={setRating} 
            size={44}
          />

          <View style={styles.commentHeader}>
            <Text style={[styles.label, { color: colors.textMuted, fontFamily: typography.heading }]}>
              COMENTÁRIO (OPCIONAL)
            </Text>
            <Text style={[styles.counter, { color: colors.textMuted, fontFamily: typography.body }]}>
              {comment.length}/800
            </Text>
          </View>

          <PecaeInput
            placeholder="Conte-nos como foi sua experiência com este vendedor..."
            value={comment}
            onChangeText={setComment}
            maxLength={800}
            multiline
            numberOfLines={4}
            style={styles.textArea}
            containerStyle={styles.inputContainer}
          />

          <PecaeButton
            title={mutation.isPending ? "Enviando..." : "Enviar Avaliação"}
            onPress={handleSubmit}
            disabled={rating === 0 || mutation.isPending}
            loading={mutation.isPending}
            style={styles.submitButton}
          />
        </PecaeGlassCard>
      </PecaeScreenContainer>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  formCard: {
    padding: 24,
    borderRadius: 24,
  },
  label: {
    fontSize: 12,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  counter: {
    fontSize: 12,
  },
  inputContainer: {
    marginBottom: 24,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  submitButton: {
    marginTop: 8,
  },
  successContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  successCard: {
    padding: 32,
    alignItems: 'center',
    borderRadius: 24,
    width: '90%',
  },
  successIconWrapper: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  backButton: {
    width: '100%',
  }
});
