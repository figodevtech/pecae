import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { usePecaeTheme } from '../../theme';
import { PecaeGlassCard } from '../PecaeUI/PecaeGlassCard';
import { Ionicons } from '@expo/vector-icons';
import { useVehicleActions, VehicleListing } from '../../hooks/useVehicles';
import { useVehicleWizardStore } from '../../store/vehicle-wizard-store';
import { useRouter } from 'expo-router';

interface VehicleInventoryCardProps {
  vehicle: VehicleListing;
}

export const VehicleInventoryCard: React.FC<VehicleInventoryCardProps> = ({ vehicle }) => {
  const { colors, typography, effects } = usePecaeTheme();
  const { markAsSold, markAsRemoved, deleteVehicle } = useVehicleActions();
  const loadVehicle = useVehicleWizardStore(s => s.loadVehicle);
  const router = useRouter();

  const handleEdit = () => {
    loadVehicle(vehicle);
    router.push('/(seller)/cadastrar-sucata');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return colors.brand;
      case 'PENDING': return '#f1c40f';
      case 'DRAFT': return '#e67e22'; // Laranja vibrante industrial para rascunho
      case 'SOLD': return colors.textMuted;
      case 'INACTIVE': return colors.error;
      default: return colors.textMuted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'ATIVO';
      case 'PENDING': return 'EM REVISÃO';
      case 'DRAFT': return 'RASCUNHO';
      case 'SOLD': return 'VENDIDO';
      case 'INACTIVE': return 'RETIRADO';
      default: return status;
    }
  };

  const handleSold = () => {
    Alert.alert(
      'Confirmar Venda',
      'Deseja marcar esta sucata como vendida? Ela não aparecerá mais nas buscas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: () => markAsSold.mutate(vehicle.id) 
        }
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir Registro',
      'Deseja excluir permanentemente esta sucata do seu inventário?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => deleteVehicle.mutate(vehicle.id) 
        }
      ]
    );
  };

  return (
    <PecaeGlassCard intensity={15} style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={{ uri: vehicle.photos?.[0]?.url || 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80' }} 
          style={[styles.image, { borderRadius: effects.radius.md }]} 
        />
        
        <View style={styles.info}>
          <View style={styles.statusRow}>
            <View style={[styles.badge, { backgroundColor: getStatusColor(vehicle.status) + '20', borderColor: getStatusColor(vehicle.status) }]}>
              <Text style={[styles.badgeText, { color: getStatusColor(vehicle.status) }]}>
                {getStatusLabel(vehicle.status)}
              </Text>
            </View>
            <Text style={[styles.date, { color: colors.textMuted, fontFamily: typography.mono }]}>
              {new Date(vehicle.createdAt).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]} numberOfLines={1}>
              {vehicle.brand} {vehicle.model}
            </Text>
          </View>
          
          <Text style={[styles.details, { color: colors.textMuted, fontFamily: typography.body }]}>
            {vehicle.version} • {vehicle.yearFab} • {vehicle.color}
          </Text>

          <View style={styles.inventoryStatus}>
             <Ionicons name="list" size={14} color={colors.brand} />
             <Text style={[styles.inventoryText, { color: colors.brand, fontFamily: typography.bold }]}>
               {vehicle.availableParts.length} PEÇAS DISPONÍVEIS
             </Text>
          </View>
        </View>
      </View>

      <View style={[styles.actions, { borderTopColor: colors.border + '20' }]}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleEdit}>
          <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
          <Text style={[styles.actionText, { color: colors.textPrimary, fontFamily: typography.medium }]}>EDITAR</Text>
        </TouchableOpacity>

        {vehicle.status === 'ACTIVE' ? (
          <TouchableOpacity style={styles.actionBtn} onPress={handleSold}>
            <Ionicons name="checkmark-done" size={18} color={colors.brand} />
            <Text style={[styles.actionText, { color: colors.brand, fontFamily: typography.bold }]}>VENDIDO</Text>
          </TouchableOpacity>
        ) : (
           <TouchableOpacity style={styles.actionBtn} onPress={() => markAsRemoved.mutate(vehicle.id)}>
            <Ionicons name="refresh-outline" size={18} color={colors.brand} />
            <Text style={[styles.actionText, { color: colors.brand, fontFamily: typography.medium }]}>REATIVAR</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
          <Text style={[styles.actionText, { color: colors.error, fontFamily: typography.medium }]}>EXCLUIR</Text>
        </TouchableOpacity>
      </View>
    </PecaeGlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
  },
  image: {
    width: 90,
    height: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  info: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 9,
    opacity: 0.6,
  },
  titleRow: {
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    letterSpacing: 0.5,
  },
  details: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 8,
  },
  inventoryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inventoryText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    height: 50,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 11,
    letterSpacing: 1,
  },
});
