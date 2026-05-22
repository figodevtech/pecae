import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';

let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;

// Carregamento resiliente do módulo nativo do AdMob para evitar crashes no Expo Go
try {
  const GoogleMobileAds = require('react-native-google-mobile-ads');
  BannerAd = GoogleMobileAds.BannerAd;
  BannerAdSize = GoogleMobileAds.BannerAdSize;
  TestIds = GoogleMobileAds.TestIds;
} catch (e) {
  console.warn('Google Mobile Ads Native SDK not found or not available in AdBanner. Falling back.');
}

interface AdBannerProps {
  size?: 'banner' | 'largeBanner';
}

// Google AdMob Test ID para Banner
const ADMOB_TEST_ID = 'ca-app-pub-3940256099942544/6300978111';
const adUnitId = __DEV__ ? (TestIds?.BANNER || '') : ADMOB_TEST_ID;

export const AdBanner: React.FC<AdBannerProps> = ({ size = 'banner' }) => {
  const [adFailed, setAdFailed] = useState(!BannerAd);
  
  const handlePressSimulated = () => {
    Linking.openURL('https://pecae.com.br');
  };

  const height = size === 'banner' ? 60 : 100;

  // Se a biblioteca nativa estiver disponível e não falhar na carga, exibe o AdMob Real
  if (!adFailed && BannerAd && BannerAdSize && adUnitId) {
    return (
      <View style={[styles.admobContainer, { height }]}>
        <BannerAd
          unitId={adUnitId}
          size={size === 'banner' ? BannerAdSize.ANCHORED_ADAPTIVE_BANNER : BannerAdSize.LARGE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true, // CMP LGPD
          }}
          onAdFailedToLoad={(error: any) => {
            console.warn('AdMob Banner failed to load, falling back to simulated ad:', error);
            setAdFailed(true);
          }}
        />
      </View>
    );
  }

  // Layout Simulador de Impacto Premium ("The Digital Forge") em degradê dourado/neon metalizado
  return (
    <View style={[styles.container, { height }]}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
        <TouchableOpacity style={styles.content} onPress={handlePressSimulated} activeOpacity={0.85}>
          <View style={styles.adBadge}>
            <Text style={styles.adBadgeText}>Patrocinado</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>PECAÊ PREMIUM</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              Busque, compare e compre peças originais com nota e rastreio.
            </Text>
          </View>
          <Feather name="external-link" size={14} color="#D4AF37" style={styles.icon} />
        </TouchableOpacity>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  admobContainer: {
    marginVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  container: {
    marginVertical: 10,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)', // Metalizado Dourado "The Digital Forge"
    backgroundColor: 'rgba(27, 32, 40, 0.55)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  adBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  adBadgeText: {
    color: '#D4AF37',
    fontSize: 9,
    fontWeight: '750',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#F1F3FC',
    fontSize: 13,
    fontFamily: 'SpaceGrotesk-Bold',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#A8ABB3',
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  icon: {
    marginLeft: 8,
  },
});
