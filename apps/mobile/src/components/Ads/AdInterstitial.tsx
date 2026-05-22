import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';

let InterstitialAd: any = null;
let AdEventType: any = null;
let TestIds: any = null;

// Carregamento resiliente do módulo nativo do AdMob para evitar crashes no Expo Go
try {
  const GoogleMobileAds = require('react-native-google-mobile-ads');
  InterstitialAd = GoogleMobileAds.InterstitialAd;
  AdEventType = GoogleMobileAds.AdEventType;
  TestIds = GoogleMobileAds.TestIds;
} catch (e) {
  console.warn('Google Mobile Ads Native SDK not found or not available. Falling back to Simulated Ads.');
}

interface AdInterstitialProps {
  visible: boolean;
  userId: string;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

// Chave para Capping Local de 1 Hora
const LAST_INTERSTITIAL_KEY = 'pecae_last_interstitial_time';

// ID de Bloco de Teste Oficial do AdMob para Intersticial
const ADMOB_TEST_ID = 'ca-app-pub-3940256099942544/1033173712';
const adUnitId = __DEV__ ? (TestIds?.INTERSTITIAL || '') : ADMOB_TEST_ID;

// Criar instância global do anúncio AdMob se a biblioteca estiver disponível
let interstitialAdInstance: any = null;
if (InterstitialAd && adUnitId) {
  try {
    interstitialAdInstance = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true, // Conforme regras de CMP da LGPD
    });
  } catch (error) {
    console.warn('Failed to initialize InterstitialAd instance:', error);
  }
}

export const AdInterstitial: React.FC<AdInterstitialProps> = ({ visible, userId, onClose }) => {
  const [countdown, setCountdown] = useState(5);
  const [isCapped, setIsCapped] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Controle Híbrido: Inicializa em modo Simulação caso o SDK nativo falhe ou não exista
  const [useSimulatedAd, setUseSimulatedAd] = useState(!interstitialAdInstance);
  const [admobLoaded, setAdmobLoaded] = useState(false);

  // 1. Validar limites de capping local e backend
  useEffect(() => {
    if (visible && userId) {
      checkCapping();
    }
  }, [visible, userId]);

  // 2. Inicializar ouvintes do AdMob real de forma segura
  useEffect(() => {
    if (!interstitialAdInstance) {
      setUseSimulatedAd(true);
      return;
    }

    const unsubscribeLoaded = interstitialAdInstance.addAdEventListener(
      AdEventType.LOADED,
      () => {
        setAdmobLoaded(true);
        setUseSimulatedAd(false);
      }
    );

    const unsubscribeOpened = interstitialAdInstance.addAdEventListener(
      AdEventType.OPENED,
      () => {
        saveCappingTime();
      }
    );

    const unsubscribeClosed = interstitialAdInstance.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        onClose();
        // Pré-carrega o próximo anúncio
        try {
          interstitialAdInstance.load();
        } catch (err) {}
      }
    );

    const unsubscribeError = interstitialAdInstance.addAdEventListener(
      AdEventType.ERROR,
      (error: any) => {
        console.warn('AdMob Interstitial failed to load, falling back to simulated ad:', error);
        setUseSimulatedAd(true);
      }
    );

    // Tentar carregar
    try {
      interstitialAdInstance.load();
    } catch (e) {
      setUseSimulatedAd(true);
    }

    return () => {
      unsubscribeLoaded();
      unsubscribeOpened();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, []);

  // 3. Efeito de contagem regressiva para o anúncio simulado
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (visible && !isCapped && useSimulatedAd && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [visible, isCapped, useSimulatedAd, countdown]);

  // 4. Tratar exibição do AdMob real
  useEffect(() => {
    if (visible && !isCapped && !useSimulatedAd && admobLoaded && interstitialAdInstance) {
      try {
        interstitialAdInstance.show();
      } catch (error) {
        console.warn('Failed to show AdMob Interstitial, switching to simulated ad:', error);
        setUseSimulatedAd(true);
      }
    }
  }, [visible, isCapped, useSimulatedAd, admobLoaded]);

  // Função para checar capping (Local de 1 hora + Backend)
  const checkCapping = async () => {
    try {
      setLoading(true);
      
      // A. Capping Local de 1 Hora (3600 segundos) para anúncios intersticiais programáticos
      const lastTimeStr = await AsyncStorage.getItem(LAST_INTERSTITIAL_KEY);
      if (lastTimeStr) {
        const lastTime = parseInt(lastTimeStr, 10);
        const now = Date.now();
        if (now - lastTime < 3600000) { // 1 hora em milissegundos
          setIsCapped(true);
          return;
        }
      }

      // B. Validação complementar no Backend
      const response = await api.get(`/ads/interstitial/status/${userId}`);
      setIsCapped(!response.data.allowed);
    } catch (error) {
      console.error('Failed to check interstitial capping:', error);
      // Se a rede falhar, aplica o fallback resiliente permitindo a exibição do ad
      setIsCapped(false);
    } finally {
      setLoading(false);
    }
  };

  // Salvar timestamp do anúncio exibido
  const saveCappingTime = async () => {
    try {
      await AsyncStorage.setItem(LAST_INTERSTITIAL_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to save interstitial capping time:', error);
    }
  };

  const handleCloseSimulated = () => {
    saveCappingTime();
    onClose();
  };

  if (!visible || loading || isCapped) {
    return null;
  }

  // Se o AdMob real estiver carregado e ativo, não renderizamos UI do React Native
  if (!useSimulatedAd && admobLoaded) {
    return null;
  }

  // Layout Simulador de Impacto Premium ("The Digital Forge") com degradê dourado/neon
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.adBadge}>
                <Text style={styles.adBadgeText}>Patrocinado</Text>
              </View>
              {countdown > 0 ? (
                <View style={styles.timerBadge}>
                  <Text style={styles.timerText}>Fechar em {countdown}s</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.closeButton} onPress={handleCloseSimulated}>
                  <Feather name="x" size={24} color="#F1F3FC" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.content}>
              <View style={styles.glowContainer}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop' }}
                  style={styles.adImage}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.title}>PECAÊ Pro Max</Text>
              <Text style={styles.description}>
                Desbloqueie recursos avançados de análise, cotações automáticas e suporte prioritário na forja.
              </Text>

              <TouchableOpacity style={styles.ctaButton} onPress={handleCloseSimulated}>
                <Text style={styles.ctaText}>CONHECER AGORA</Text>
                <Feather name="arrow-right" size={18} color="#0a0e14" />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 14, 20, 0.85)',
  },
  container: {
    width: width * 0.88,
    height: height * 0.72,
    backgroundColor: 'rgba(27, 32, 40, 0.75)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#D4AF37', // Metalizado Dourado "The Digital Forge"
    padding: 24,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  adBadgeText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timerBadge: {
    backgroundColor: 'rgba(241, 243, 252, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  timerText: {
    color: '#A8ABB3',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(241, 243, 252, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(241, 243, 252, 0.15)',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginTop: 20,
  },
  glowContainer: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  adImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    color: '#F1F3FC',
    fontSize: 22,
    fontFamily: 'SpaceGrotesk-Bold',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  description: {
    color: '#A8ABB3',
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  ctaButton: {
    backgroundColor: '#D4AF37',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  ctaText: {
    color: '#0a0e14',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Bold',
    fontWeight: '750',
    letterSpacing: 0.5,
  },
});
