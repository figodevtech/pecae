import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { usePecaeTheme } from '../../theme';
import { PecaeGlassCard } from '../PecaeUI/PecaeGlassCard';
import { Ionicons } from '@expo/vector-icons';
import { useVehicleActions } from '../../hooks/useVehicles';
import { useVehicleWizardStore } from '../../store/vehicle-wizard-store';
import { useRouter } from 'expo-router';

interface VehicleInventoryCardProps {
  vehicle: any;
}

export const VehicleInventoryCard: React.FC<VehicleInventoryCardProps> = ({ vehicle }) => {
  const { colors, typography } = usePecaeTheme();
  const { markAsSold, deleteVehicle } = useVehicleActions();
  const loadVehicle = useVehicleWizardStore(s => s.loadVehicle);
  const router = useRouter();

  const handleEdit = () => {
    loadVehicle(vehicle);
    router.push('/(seller)/cadastrar-sucata');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return colors.brand;
      case 'PENDING': return colors.warning || '#f1c40f';
      case 'SOLD': return colors.textMuted;
      case 'REJECTED': return colors.error;
      default: return colors.textMuted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'Ativo';
      case 'PENDING': return 'Em Revisão';
      case 'SOLD': return 'Vendido';
      case 'REJECTED': return 'Recusado';
      default: return status;
    }
  };

  const handleSold = () => {
    Alert.alert(
      'Confirmar Venda',
      'Deseja marcar este veículo como vendido? O anúncio será removido da busca pública.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: () => markAsSold.mutate(vehicle.id) 
        }
      ]
    );
  };

  return (
    <PecaeGlassCard intensity={15} style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={{ uri: vehicle.photos?.[0]?.url || 'https://via.placeholder.com/150' }} 
          style={styles.image} 
        />
        
        <View style={styles.info}>
          <View style={styles.statusRow}>
            <View style={[styles.badge, { backgroundColor: getStatusColor(vehicle.listing?.status) }]}>
              <Text style={styles.badgeText}>{getStatusLabel(vehicle.listing?.status)}</Text>
            </View>
            <Text style={[styles.date, { color: colors.textMuted, fontFamily: typography.body }]}>
              {new Date(vehicle.createdAt).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]} numberOfLines={1}>
              {vehicle.title?.toUpperCase() || 'VEÍCULO S/ TÍTULO'}
            </Text>
            <Text style={[styles.idText, { color: colors.brand, fontFamily: typography.mono }]}>
              ID: {vehicle.id.substring(0, 8).toUpperCase()}
            </Text>
          </View>
          
          <Text style={[styles.details, { color: colors.textMuted, fontFamily: typography.body }]}>
            {vehicle.color} • {vehicle.city}/{vehicle.state}
          </Text>
        </View>
      </View>

      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleEdit}>
          <Ionicons name="create-outline" size={20} color={colors.textPrimary} />
          <Text style={[styles.actionText, { color: colors.textPrimary, fontFamily: typography.medium }]}>Editar</Text>
        </TouchableOpacity>

        {vehicle.listing?.status !== 'SOLD' && (
          <TouchableOpacity style={styles.actionBtn} onPress={handleSold}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.brand} />
            <Text style={[styles.actionText, { color: colors.brand, fontFamily: typography.medium }]}>Vendido</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => {
            Alert.alert(
              'Remover Anúncio',
              'Tem certeza que deseja remover este anúncio? Esta ação não pode ser desfeita.',
              [
                { text: 'Cancelar', style: 'cancel' },
                { 
                  text: 'Remover', 
                  style: 'destructive',
                  onPress: () => deleteVehicle.mutate(vehicle.id) 
                }
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={[styles.actionText, { color: colors.error, fontFamily: typography.medium }]}>Remover</Text>
        </TouchableOpacity>
      </View>
    </PecaeGlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    padding: 0,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    padding: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  idText: {
    fontSize: 10,
    opacity: 0.8,
    letterSpacing: 1,
  },
  details: {
    fontSize: 11,
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    height: 44,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 13,
  },
});
