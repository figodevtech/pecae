import React, { useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PecaeGlassCard } from '../PecaeUI';
import { usePecaeTheme } from '../../theme';
import { api } from '../../services/api';
import { useRouter } from 'expo-router';

interface SponsoredListingCardProps {
  vehicle: any;
  itemWidth: number;
}

export const SponsoredListingCard: React.FC<SponsoredListingCardProps> = ({ 
  vehicle, 
  itemWidth 
}) => {
  const { colors, typography } = usePecaeTheme();
  const router = useRouter();

  const brand = vehicle.version?.model?.brand?.name || '';
  const model = vehicle.version?.model?.name || '';
  const imageUrl = vehicle.thumbnail || (vehicle.photos && vehicle.photos.length > 0 ? vehicle.photos[0] : null);
  const campaignId = vehicle.campaignId;
  const listingId = vehicle.id;

  // Registrar Impressão de forma assíncrona ao renderizar o card
  useEffect(() => {
    if (campaignId && listingId) {
      const trackImpression = async () => {
        try {
          await api.post('/ads/track/impression', {
            campaignId,
            listingId
          });
        } catch (error) {
          // Falha silenciosa para não quebrar a UX
          console.warn('Failed to track ad impression:', error);
        }
      };
      trackImpression();
    }
  }, [campaignId, listingId]);

  const handlePress = async () => {
    // Registrar Clique em paralelo com a navegação
    if (campaignId && listingId) {
      try {
        api.post('/ads/track/click', {
          campaignId,
          listingId
        }).catch(err => console.warn('Failed to track ad click:', err));
      } catch (e) {
        // Ignora
      }
    }
    
    // Navegar para detalhes do veículo
    router.push(`/(tabs)/vehicle/${vehicle.vehicleId || vehicle.id}`);
  };

  return (
    <TouchableOpacity 
      style={[styles.productCardWrapper, { width: itemWidth }]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.imageOverlapContainer}>
        {/* Borda Premium Gradiente Metalizado Dourado (The Digital Forge - Gold Variant) */}
        <LinearGradient
          colors={['#FFD700', '#D4AF37', '#9A7B1C', '#FFD700']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Ambient Glow Dourado de Fundo */}
        <View style={styles.glowOverlay} />

        {/* Corpo Interno do Glass Card */}
        <PecaeGlassCard padding={0} intensity={20} style={styles.productCard}>
          <View style={styles.imagePlaceholder} />
          
          <View style={styles.productInfo}>
            {/* Tag de Marca com tom de Dourado Premium */}
            <Text style={[styles.brandLabel, { fontFamily: typography.display }]}>
              {brand.toUpperCase()}
            </Text>
            
            <Text style={[styles.productTitle, { color: colors.textPrimary, fontFamily: typography.display }]} numberOfLines={1}>
              {model.toUpperCase()}
            </Text>
            
            <View style={styles.productFooter}>
              <Ionicons name="location-outline" size={10} color="#E2C974" />
              <Text style={[styles.productLocation, { fontFamily: typography.medium }]} numberOfLines={1}>
                {vehicle.city?.toUpperCase()}/{vehicle.state?.toUpperCase()}
              </Text>
            </View>

            {/* Botão de Destaque Dourado */}
            <LinearGradient
              colors={['rgba(212, 175, 55, 0.2)', 'rgba(154, 123, 28, 0.1)']}
              style={styles.viewDetailsBtn}
            >
              <Text style={[styles.viewDetailsText, { fontFamily: typography.display }]}>
                ACESSAR PATROCINADO
              </Text>
            </LinearGradient>
          </View>
        </PecaeGlassCard>

        {/* Floating Image Overlap Effect */}
        <View style={styles.floatingImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.floatingImage} resizeMode="contain" />
          ) : (
            <View style={[styles.floatingImage, styles.imageFallBack]}>
              <Ionicons name="car-sport-outline" size={40} color="#D4AF37" />
            </View>
          )}
        </View>

        {/* Badge Patrocinado Transparente com Borda Metálica */}
        <View style={styles.sponsoredBadge}>
          <Ionicons name="sparkles" size={8} color="#000" style={{ marginRight: 2 }} />
          <Text style={styles.sponsoredBadgeText}>PATROCINADO</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  productCardWrapper: {
    marginBottom: 24,
  },
  imageOverlapContainer: {
    position: 'relative',
    paddingTop: 40,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 1.5, // Cria o efeito de borda fina do degradê linear
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(212, 175, 55, 0.04)',
    zIndex: 0,
  },
  productCard: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: 'rgba(20, 24, 30, 0.85)',
    borderWidth: 0, // Desativa borda padrão do PecaeGlassCard para usar a borda degradê do wrapper
  },
  imagePlaceholder: {
    height: 100,
  },
  floatingImageContainer: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: 140,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingImage: {
    width: '100%',
    height: '100%',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  imageFallBack: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  sponsoredBadge: {
    position: 'absolute',
    top: 50,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  sponsoredBadgeText: {
    color: '#000',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  productInfo: {
    padding: 16,
    paddingTop: 0,
    gap: 4,
    zIndex: 1,
  },
  brandLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#D4AF37',
  },
  productTitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  productLocation: {
    fontSize: 10,
    color: '#E2C974',
  },
  viewDetailsBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  viewDetailsText: {
    color: '#D4AF37',
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
