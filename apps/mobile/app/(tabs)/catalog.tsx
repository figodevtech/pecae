import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { PecaeBackground, PecaeGlassCard, PecaeMatchToast } from '../../src/components/PecaeUI';
import { usePecaeTheme } from '../../src/theme';
import { api } from '../../src/services/api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function CatalogScreen() {
  const { colors, typography, effects } = usePecaeTheme();
  const router = useRouter();
  
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMatchToast, setShowMatchToast] = useState(false);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/catalog');
      setVehicles(response.data.items || []);
    } catch (error) {
      console.error('Erro ao buscar catálogo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();

    // Simulação de Match para demonstração de micro-animação (Fase 3)
    const timer = setTimeout(() => {
      setShowMatchToast(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const renderVehicle = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={() => router.push(`/vehicle/${item.listingId}`)}
      style={styles.cardContainer}
    >
      <PecaeGlassCard padding={0} intensity={25} style={styles.card}>
        <View style={styles.imageWrapper}>
          <Image 
            source={{ uri: item.thumbnail || 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=600&q=80' }} 
            style={styles.image}
            resizeMode="cover"
          />
          <BlurView intensity={20} style={styles.versionBadge}>
            <Text style={[styles.versionText, { color: colors.textPrimary, fontFamily: typography.display }]}>
              {item.version?.toUpperCase() || 'STANDARD'}
            </Text>
          </BlurView>
          
          <View style={styles.floatingInfo}>
             <View style={[styles.glowBadge, { backgroundColor: `${colors.brand}22`, borderColor: colors.brand }]}>
                <Text style={[styles.glowText, { color: colors.brand, fontFamily: typography.display }]}>
                  DISPONÍVEL
                </Text>
             </View>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.titleRow}>
            <Text style={[styles.brand, { color: colors.brand, fontFamily: typography.display }]}>
              {item.brand?.toUpperCase() || 'PECAÊ'}
            </Text>
            <Text style={[styles.year, { color: colors.textMuted, fontFamily: typography.display }]}>
              {item.year || '2024'}
            </Text>
          </View>
          
          <Text style={[styles.model, { color: colors.textPrimary, fontFamily: typography.display }]} numberOfLines={1}>
            {item.model?.toUpperCase() || 'VEÍCULOS DOADOR'}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={12} color={colors.brand} />
            <Text style={[styles.location, { color: colors.textMuted, fontFamily: typography.body }]}>
              {item.city?.toUpperCase() || 'SÃO PAULO'}, {item.state?.toUpperCase() || 'SP'}
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.brand }]}
            onPress={() => router.push(`/vehicle/${item.listingId}`)}
          >
            <Text style={[styles.actionButtonText, { fontFamily: typography.display }]}>
              ABRIR FORJA
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#000" />
          </TouchableOpacity>
        </View>
      </PecaeGlassCard>
    </TouchableOpacity>
  );

  return (
    <PecaeBackground>
      <View style={styles.container}>
        <PecaeMatchToast 
          visible={showMatchToast}
          onClose={() => setShowMatchToast(false)}
          onPress={() => {
            setShowMatchToast(false);
            if (vehicles.length > 0) {
              router.push(`/vehicle/${vehicles[0].listingId}`);
            }
          }}
          vehicleName="Civic Type R"
          brand="Honda"
          imageUrl="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=500&auto=format&fit=crop"
        />

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
            CATÁLOGO <Text style={{ color: colors.brand }}>TÉCNICO</Text>
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
            VEÍCULOS DOADORES EM ANÁLISE
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.brand} />
          </View>
        ) : (
          <FlatList
            data={vehicles}
            renderItem={renderVehicle}
            keyExtractor={(item, index) => item.id || index.toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            numColumns={1}
          />
        )}
      </View>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 4,
    opacity: 0.7,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  cardContainer: {
    marginBottom: 25,
  },
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  imageWrapper: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  versionBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  versionText: {
    fontSize: 10,
    letterSpacing: 1,
  },
  floatingInfo: {
    position: 'absolute',
    bottom: 15,
    left: 15,
  },
  glowBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  glowText: {
    fontSize: 9,
    letterSpacing: 1,
  },
  details: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brand: {
    fontSize: 12,
    letterSpacing: 2,
  },
  year: {
    fontSize: 12,
    opacity: 0.8,
  },
  model: {
    fontSize: 22,
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  location: {
    fontSize: 12,
    marginLeft: 4,
    opacity: 0.6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#000',
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
