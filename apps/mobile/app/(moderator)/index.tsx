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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  PecaeBackground,
  PecaeGlassCard,
  PecaeButton,
  PecaeScreenContainer,
} from '../../src/components/PecaeUI';
import { usePecaeTheme } from '../../src/theme';
import {
  useModerationListings,
  useApproveListing,
  useRejectListing,
} from '../../src/hooks/useModeration';
import { PendingListing } from '../../src/services/moderation';

export default function ModerationListingsScreen() {
  const { colors, typography, effects } = usePecaeTheme();
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');
  const [selectedListing, setSelectedListing] = useState<PendingListing | null>(null);
  const [moderatorNote, setModeratorNote] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isDetailVisible, setIsDetailVisible] = useState<boolean>(false);

  // Filters
  const [sellerId, setSellerId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const { data, isLoading, refetch, isFetching } = useModerationListings({
    status: selectedStatus,
    sellerId: sellerId || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const approveMutation = useApproveListing();
  const rejectMutation = useRejectListing();

  const handleApprove = () => {
    if (!selectedListing) return;
    approveMutation.mutate(
      { id: selectedListing.id, note: moderatorNote },
      {
        onSuccess: (res) => {
          Alert.alert('SUCESSO', res?.message || 'Anúncio aprovado e publicado com sucesso!');
          closeDetails();
        },
        onError: (err: any) => {
          const errMsg = err.response?.data?.message || err.message || 'Falha ao aprovar anúncio.';
          Alert.alert('FALHA NA APROVAÇÃO', errMsg);
        },
      }
    );
  };

  const handleReject = () => {
    if (!selectedListing) return;
    if (!rejectionReason.trim()) {
      Alert.alert('ATENÇÃO', 'O motivo da rejeição é obrigatório.');
      return;
    }
    rejectMutation.mutate(
      { id: selectedListing.id, reason: rejectionReason },
      {
        onSuccess: (res) => {
          Alert.alert('SUCESSO', res?.message || 'Anúncio rejeitado.');
          closeDetails();
        },
        onError: (err: any) => {
          const errMsg = err.response?.data?.message || err.message || 'Falha ao rejeitar anúncio.';
          Alert.alert('FALHA NA REJEIÇÃO', errMsg);
        },
      }
    );
  };

  const openDetails = (listing: PendingListing) => {
    setSelectedListing(listing);
    setModeratorNote('');
    setRejectionReason('');
    setIsDetailVisible(true);
  };

  const closeDetails = () => {
    setIsDetailVisible(false);
    setSelectedListing(null);
  };

  const renderItem = ({ item }: { item: PendingListing }) => {
    const photoUrl = item.vehicle?.photos?.[0]?.url;

    return (
      <TouchableOpacity
        style={styles.cardWrapper}
        onPress={() => openDetails(item)}
        activeOpacity={0.7}
      >
        <PecaeGlassCard intensity={15} style={styles.card}>
          <View style={styles.cardHeader}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.thumbnail} />
            ) : (
              <View style={[styles.thumbnailPlaceholder, { backgroundColor: '#111' }]}>
                <Ionicons name="car-outline" size={24} color={colors.textMuted} />
              </View>
            )}

            <View style={styles.headerInfo}>
              <Text style={[styles.listingTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                {item.title || 'Peça Automotiva'}
              </Text>
              <Text style={[styles.listingMeta, { color: colors.textMuted, fontFamily: typography.heading }]}>
                {item.vehicle?.brandName} {item.vehicle?.modelName} {item.vehicle?.yearFabValue ? `(${item.vehicle.yearFabValue})` : ''}
              </Text>
              <Text style={[styles.listingDate, { color: colors.textMuted, fontFamily: typography.body }]}>
                Criado em: {new Date(item.createdAt).toLocaleDateString('pt-BR')}
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
            FILA DE MODERAÇÃO
          </Text>
          <Text style={[styles.subtitle, { color: colors.brand, fontFamily: typography.heading }]}>
            // ANÚNCIOS_AUTOMOTIVOS
          </Text>
          
          <TouchableOpacity 
            style={styles.reportsNavButton}
            onPress={() => router.push('/(moderator)/reports')}
          >
            <Ionicons name="warning-outline" size={16} color={colors.brand} />
            <Text style={[styles.reportsNavText, { color: colors.brand, fontFamily: typography.display }]}>
              FILA DE DENÚNCIAS
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status Filter */}
        <View style={styles.statusFilters}>
          {['PENDING', 'PUBLISHED', 'REJECTED'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterBtn,
                { borderColor: selectedStatus === status ? colors.brand : colors.border },
                selectedStatus === status && { backgroundColor: 'rgba(74, 222, 128, 0.1)' },
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  {
                    color: selectedStatus === status ? colors.brand : colors.textMuted,
                    fontFamily: typography.display,
                  },
                ]}
              >
                {status === 'PENDING' ? 'PENDENTES' : status === 'PUBLISHED' ? 'APROVADOS' : 'REJEITADOS'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Filters */}
        <PecaeGlassCard intensity={10} style={styles.advancedFilters}>
          <View style={styles.filterRow}>
            <View style={styles.filterInputCol}>
              <Text style={[styles.inputLabel, { color: colors.textMuted, fontFamily: typography.heading }]}>
                VENDEDOR ID
              </Text>
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: 'rgba(0,0,0,0.3)' }]}
                placeholder="Ex: uuid"
                placeholderTextColor={colors.textMuted}
                value={sellerId}
                onChangeText={setSellerId}
              />
            </View>
            <View style={styles.filterInputCol}>
              <Text style={[styles.inputLabel, { color: colors.textMuted, fontFamily: typography.heading }]}>
                DATA INICIAL
              </Text>
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: 'rgba(0,0,0,0.3)' }]}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={colors.textMuted}
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>
          </View>
        </PecaeGlassCard>

        {isLoading ? (
          <View style={styles.centered}>
            <Text style={{ color: colors.textPrimary, fontFamily: typography.body }}>Carregando anúncios...</Text>
          </View>
        ) : (
          <FlatList
            data={data?.items || []}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.brand} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted, fontFamily: typography.heading }]}>
                  Nenhum anúncio encontrado nesta fila.
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
              {selectedListing && (
                <ScrollView contentContainerStyle={styles.modalScroll}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                      DETALHES DO ANÚNCIO
                    </Text>
                    <TouchableOpacity onPress={closeDetails}>
                      <Ionicons name="close" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  {/* Horizontal Photo Slider */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoSlider}>
                    {selectedListing.vehicle?.photos?.map((photo) => (
                      <Image key={photo.id} source={{ uri: photo.url }} style={styles.largePhoto} />
                    ))}
                    {(!selectedListing.vehicle?.photos || selectedListing.vehicle?.photos?.length === 0) && (
                      <View style={[styles.largePhotoPlaceholder, { backgroundColor: '#111' }]}>
                        <Ionicons name="car" size={64} color={colors.textMuted} />
                      </View>
                    )}
                  </ScrollView>

                  {/* Details Block */}
                  <PecaeGlassCard intensity={20} style={styles.detailsBlock}>
                    <Text style={[styles.sectionTitle, { color: colors.brand, fontFamily: typography.heading }]}>
                      VEÍCULO
                    </Text>
                    <Text style={[styles.detailText, { color: colors.textPrimary, fontFamily: typography.body }]}>
                      <Text style={{ fontWeight: 'bold' }}>Placa:</Text> {selectedListing.vehicle?.plate || '***-****'}
                    </Text>
                    <Text style={[styles.detailText, { color: colors.textPrimary, fontFamily: typography.body }]}>
                      <Text style={{ fontWeight: 'bold' }}>Marca/Modelo:</Text> {selectedListing.vehicle?.brandName} {selectedListing.vehicle?.modelName}
                    </Text>
                    <Text style={[styles.detailText, { color: colors.textPrimary, fontFamily: typography.body }]}>
                      <Text style={{ fontWeight: 'bold' }}>Versão:</Text> {selectedListing.vehicle?.versionName || '—'}
                    </Text>
                    <Text style={[styles.detailText, { color: colors.textPrimary, fontFamily: typography.body }]}>
                      <Text style={{ fontWeight: 'bold' }}>Ano:</Text> {selectedListing.vehicle?.yearFabValue ?? '—'}
                    </Text>
                  </PecaeGlassCard>

                  {/* Seller Block */}
                  <PecaeGlassCard intensity={20} style={styles.detailsBlock}>
                    <Text style={[styles.sectionTitle, { color: colors.brand, fontFamily: typography.heading }]}>
                      VENDEDOR
                    </Text>
                    <Text style={[styles.detailText, { color: colors.textPrimary, fontFamily: typography.body }]}>
                      {selectedListing.sellerProfile?.user?.name || 'Vendedor Anônimo'}
                    </Text>
                    <Text style={[styles.detailText, { color: colors.textMuted, fontFamily: typography.body }]}>
                      {selectedListing.sellerProfile?.user?.email}
                    </Text>
                    {selectedListing.sellerProfile?.isVerified && (
                      <View style={[styles.verifiedBadge, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                        <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                        <Text style={{ color: '#22C55E', fontFamily: typography.heading, fontSize: 10, marginLeft: 4 }}>
                          SELO VERIFICADO
                        </Text>
                      </View>
                    )}
                  </PecaeGlassCard>

                  {selectedStatus === 'PENDING' && (
                    <View style={styles.actionBlock}>
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.heading }]}>
                        AÇÕES DE MODERAÇÃO
                      </Text>

                      {/* Approval Section */}
                      <TextInput
                        style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, marginTop: 12 }]}
                        placeholder="Nota do moderador (Opcional)"
                        placeholderTextColor={colors.textMuted}
                        value={moderatorNote}
                        onChangeText={setModeratorNote}
                      />
                      <PecaeButton
                        title="APROVAR ANÚNCIO"
                        onPress={handleApprove}
                        loading={approveMutation.isPending}
                        style={{ marginTop: 12 }}
                      />

                      <View style={[styles.divider, { backgroundColor: colors.border }]} />

                      {/* Rejection Section */}
                      <TextInput
                        style={[styles.textInput, { color: colors.textPrimary, borderColor: '#EF4444' }]}
                        placeholder="Motivo da Rejeição (Obrigatório)"
                        placeholderTextColor={colors.textMuted}
                        value={rejectionReason}
                        onChangeText={setRejectionReason}
                      />
                      <PecaeButton
                        title="REJEITAR ANÚNCIO"
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
  statusFilters: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterBtnText: {
    fontSize: 10,
    letterSpacing: 1,
  },
  advancedFilters: {
    marginBottom: 16,
    padding: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterInputCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 8,
    letterSpacing: 1,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 12,
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
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  listingTitle: {
    fontSize: 14,
  },
  listingMeta: {
    fontSize: 12,
  },
  listingDate: {
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
  photoSlider: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  largePhoto: {
    width: 250,
    height: 180,
    borderRadius: 12,
    marginRight: 12,
  },
  largePhotoPlaceholder: {
    width: 250,
    height: 180,
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
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  actionBlock: {
    marginTop: 20,
  },
  divider: {
    height: 1,
    marginVertical: 20,
    opacity: 0.3,
  },
  reportsNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(63, 255, 139, 0.3)',
    backgroundColor: 'rgba(63, 255, 139, 0.05)',
  },
  reportsNavText: {
    fontSize: 10,
    letterSpacing: 1,
  },
});
