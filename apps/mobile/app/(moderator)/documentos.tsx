import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  PecaeBackground,
  PecaeGlassCard,
  PecaeButton,
  PecaeScreenContainer,
} from '../../src/components/PecaeUI';
import { usePecaeTheme } from '../../src/theme';
import {
  useModerationVerifications,
  useApproveVerification,
  useRejectVerification,
} from '../../src/hooks/useModeration';
import { PendingVerification } from '../../src/services/moderation';

export default function ModerationVerificationsScreen() {
  const { colors, typography } = usePecaeTheme();
  const [selectedVerification, setSelectedVerification] = useState<PendingVerification | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isDetailVisible, setIsDetailVisible] = useState<boolean>(false);

  const { data: verifications, isLoading, refetch, isFetching } = useModerationVerifications();

  const approveMutation = useApproveVerification();
  const rejectMutation = useRejectVerification();

  const handleApprove = () => {
    if (!selectedVerification) return;
    approveMutation.mutate(selectedVerification.id, {
      onSuccess: (res) => {
        Alert.alert('SUCESSO', res?.message || 'Vendedor aprovado!');
        closeDetails();
      },
      onError: (err: any) => {
        const errMsg = err.response?.data?.message || err.message || 'Falha ao aprovar verificação.';
        Alert.alert('FALHA NA VERIFICAÇÃO', errMsg);
      },
    });
  };

  const handleReject = () => {
    if (!selectedVerification) return;
    if (!rejectionReason.trim()) {
      Alert.alert('ATENÇÃO', 'O motivo da rejeição é obrigatório.');
      return;
    }
    rejectMutation.mutate(
      { id: selectedVerification.id, reason: rejectionReason },
      {
        onSuccess: (res) => {
          Alert.alert('SUCESSO', res?.message || 'Verificação rejeitada.');
          closeDetails();
        },
        onError: (err: any) => {
          const errMsg = err.response?.data?.message || err.message || 'Falha ao rejeitar verificação.';
          Alert.alert('FALHA NA REJEIÇÃO', errMsg);
        },
      }
    );
  };

  const openDetails = (verification: PendingVerification) => {
    setSelectedVerification(verification);
    setRejectionReason('');
    setIsDetailVisible(true);
  };

  const closeDetails = () => {
    setIsDetailVisible(false);
    setSelectedVerification(null);
  };

  const renderItem = ({ item }: { item: PendingVerification }) => {
    return (
      <TouchableOpacity
        style={styles.cardWrapper}
        onPress={() => openDetails(item)}
        activeOpacity={0.7}
      >
        <PecaeGlassCard intensity={15} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: '#111' }]}>
              <Ionicons name="person-circle-outline" size={32} color={colors.brand} />
            </View>

            <View style={styles.headerInfo}>
              <Text style={[styles.sellerName, { color: colors.textPrimary, fontFamily: typography.display }]}>
                {item.sellerProfile?.user?.name || 'Vendedor'}
              </Text>
              <Text style={[styles.sellerEmail, { color: colors.textMuted, fontFamily: typography.body }]}>
                {item.sellerProfile?.user?.email}
              </Text>
              <Text style={[styles.createdDate, { color: colors.textMuted, fontFamily: typography.body }]}>
                Solicitado em: {new Date(item.createdAt).toLocaleDateString('pt-BR')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.brand} />
          </View>
        </PecaeGlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <PecaeBackground>
      <PecaeScreenContainer>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
            FILA DE VERIFICAÇÃO
          </Text>
          <Text style={[styles.subtitle, { color: colors.brand, fontFamily: typography.heading }]}>
            // SELO_VERIFICADO_KYC
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <Text style={{ color: colors.textPrimary, fontFamily: typography.body }}>Carregando verificações...</Text>
          </View>
        ) : (
          <FlatList
            data={verifications || []}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.brand} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="shield-checkmark-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted, fontFamily: typography.heading }]}>
                  Nenhuma verificação pendente encontrada.
                </Text>
              </View>
            }
          />
        )}

        {/* Detailed Modal */}
        <Modal
          visible={isDetailVisible}
          animationType="slide"
          transparent
          onRequestClose={closeDetails}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: '#0A0A0A', borderColor: colors.border }]}>
              {selectedVerification && (
                <ScrollView contentContainerStyle={styles.modalScroll}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                      REVISÃO DE DOCUMENTOS
                    </Text>
                    <TouchableOpacity onPress={closeDetails}>
                      <Ionicons name="close" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  {/* Documents Section */}
                  <Text style={[styles.sectionTitle, { color: colors.brand, fontFamily: typography.heading, marginBottom: 12 }]}>
                    DOCUMENTOS ENVIADOS
                  </Text>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.docSlider}>
                    {selectedVerification.signedUrls?.map((url, index) => (
                      <Image key={index} source={{ uri: url }} style={styles.largeDoc} resizeMode="contain" />
                    ))}
                    {(!selectedVerification.signedUrls || selectedVerification.signedUrls.length === 0) && (
                      <View style={[styles.largeDocPlaceholder, { backgroundColor: '#111' }]}>
                        <Ionicons name="document-text" size={64} color={colors.textMuted} />
                        <Text style={{ color: colors.textMuted, fontFamily: typography.body, marginTop: 8 }}>
                          Sem imagens de documentos.
                        </Text>
                      </View>
                    )}
                  </ScrollView>

                  {/* Info Block */}
                  <PecaeGlassCard intensity={20} style={styles.detailsBlock}>
                    <Text style={[styles.sectionTitle, { color: colors.brand, fontFamily: typography.heading }]}>
                      DADOS DO VENDEDOR
                    </Text>
                    <Text style={[styles.detailText, { color: colors.textPrimary, fontFamily: typography.body }]}>
                      <Text style={{ fontWeight: 'bold' }}>Nome:</Text> {selectedVerification.sellerProfile?.user?.name}
                    </Text>
                    <Text style={[styles.detailText, { color: colors.textPrimary, fontFamily: typography.body }]}>
                      <Text style={{ fontWeight: 'bold' }}>E-mail:</Text> {selectedVerification.sellerProfile?.user?.email}
                    </Text>
                  </PecaeGlassCard>

                  {/* Actions Block */}
                  {selectedVerification.status === 'PENDING' && (
                    <View style={styles.actionBlock}>
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.heading }]}>
                        AÇÕES DE MODERAÇÃO
                      </Text>

                      <PecaeButton
                        title="APROVAR SELO"
                        onPress={handleApprove}
                        loading={approveMutation.isPending}
                        style={{ marginTop: 12 }}
                      />

                      <View style={[styles.divider, { backgroundColor: colors.border }]} />

                      <TextInput
                        style={[styles.textInput, { color: colors.textPrimary, borderColor: '#EF4444' }]}
                        placeholder="Motivo da Rejeição (Obrigatório)"
                        placeholderTextColor={colors.textMuted}
                        value={rejectionReason}
                        onChangeText={setRejectionReason}
                      />
                      <PecaeButton
                        title="REJEITAR SELO"
                        variant="outline"
                        onPress={handleReject}
                        loading={rejectMutation.isPending}
                        style={{ marginTop: 12, borderColor: '#EF4444' }}
                        textStyle={{ color: '#EF4444' }}
                      />
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </PecaeScreenContainer>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    letterSpacing: 1,
    marginTop: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingBottom: 40,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  card: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  sellerName: {
    fontSize: 14,
  },
  sellerEmail: {
    fontSize: 12,
  },
  createdDate: {
    fontSize: 10,
    opacity: 0.6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    letterSpacing: 2,
  },
  modalScroll: {
    paddingBottom: 40,
  },
  docSlider: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  largeDoc: {
    width: 250,
    height: 350,
    borderRadius: 12,
    marginRight: 12,
  },
  largeDocPlaceholder: {
    width: 250,
    height: 350,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsBlock: {
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 4,
  },
  actionBlock: {
    marginTop: 20,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginVertical: 20,
    opacity: 0.3,
  },
});
