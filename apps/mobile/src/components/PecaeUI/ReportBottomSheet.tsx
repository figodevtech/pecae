import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  TouchableWithoutFeedback, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { usePecaeTheme } from '../../theme';
import { PecaeGlassCard } from './PecaeGlassCard';
import { PecaeInput } from './PecaeInput';
import { PecaeButton } from './PecaeButton';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

export enum ReportCategory {
  FRAUD = 'FRAUD',
  SPAM = 'SPAM',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  OFFENSIVE_BEHAVIOR = 'OFFENSIVE_BEHAVIOR',
  OTHER = 'OTHER'
}

interface ReportBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  listingId?: string;
  reportedUserId?: string;
  chatRoomId?: string;
  targetName: string;
}

export const ReportBottomSheet: React.FC<ReportBottomSheetProps> = ({
  isVisible,
  onClose,
  listingId,
  reportedUserId,
  chatRoomId,
  targetName
}) => {
  const { colors, typography, effects, isDark } = usePecaeTheme();
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { label: 'Fraude ou Golpe', value: ReportCategory.FRAUD },
    { label: 'Spam / Anúncio Duplicado', value: ReportCategory.SPAM },
    { label: 'Conteúdo Impróprio', value: ReportCategory.INAPPROPRIATE_CONTENT },
    { label: 'Comportamento Ofensivo', value: ReportCategory.OFFENSIVE_BEHAVIOR },
    { label: 'Outro Motivo', value: ReportCategory.OTHER },
  ];

  const handleSubmit = async () => {
    if (!category) {
      Alert.alert('Erro', 'Selecione uma categoria para a denúncia.');
      return;
    }

    if (reason.length < 10) {
      Alert.alert('Erro', 'Por favor, descreva o motivo com pelo menos 10 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/reports', {
        category,
        reason,
        listingId,
        reportedUserId,
        chatRoomId
      });
      
      Alert.alert('Sucesso', 'Sua denúncia foi enviada e será analisada por nossa equipe.');
      onClose();
      // Reset state
      setCategory(null);
      setReason('');
    } catch (error) {
      console.error('Erro ao enviar denúncia:', error);
      Alert.alert('Erro', 'Não foi possível enviar a denúncia. Tente novamente mais tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheetContainer, { backgroundColor: isDark ? '#0A0A0A' : '#FFF', borderTopColor: colors.brand + '44' }]}>
              <View style={[styles.handle, { backgroundColor: colors.textMuted + '33' }]} />
              
              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ width: '100%' }}
              >
                <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
                  <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
                      DENUNCIAR {targetName.toUpperCase()}
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
                      Sua denúncia é anônima e ajuda a manter a comunidade Peçaê segura.
                    </Text>
                  </View>

                  <Text style={[styles.label, { color: colors.textPrimary, fontFamily: typography.display }]}>
                    CATEGORIA
                  </Text>
                  <View style={styles.categoryGrid}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.value}
                        onPress={() => setCategory(cat.value)}
                        style={[
                          styles.categoryItem,
                          { 
                            backgroundColor: category === cat.value ? colors.brand + '20' : colors.surface,
                            borderColor: category === cat.value ? colors.brand : colors.border
                          }
                        ]}
                      >
                        <Text style={[
                          styles.categoryLabel, 
                          { 
                            color: category === cat.value ? colors.brand : colors.textPrimary,
                            fontFamily: category === cat.value ? typography.bold : typography.body
                          }
                        ]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.label, { color: colors.textPrimary, fontFamily: typography.display, marginTop: 20 }]}>
                    DETALHES
                  </Text>
                  <PecaeInput
                    placeholder="Descreva o que aconteceu..."
                    multiline
                    numberOfLines={4}
                    value={reason}
                    onChangeText={setReason}
                    style={{ height: 100, textAlignVertical: 'top' }}
                  />

                  <PecaeButton
                    label={isSubmitting ? 'ENVIANDO...' : 'CONFIRMAR DENÚNCIA'}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    style={{ marginTop: 24 }}
                  />
                  
                  <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                    <Text style={[styles.cancelText, { color: colors.textMuted, fontFamily: typography.medium }]}>
                      CANCELAR
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  categoryGrid: {
    gap: 8,
  },
  categoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryLabel: {
    fontSize: 14,
  },
  cancelButton: {
    alignSelf: 'center',
    marginTop: 16,
    padding: 8,
  },
  cancelText: {
    fontSize: 12,
    letterSpacing: 1,
  }
});
