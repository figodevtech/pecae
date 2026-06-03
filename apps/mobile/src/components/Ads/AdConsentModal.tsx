import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');
const CONSENT_KEY = 'pecae_ad_consent';

interface AdConsentModalProps {
  onConsentGiven: (personalized: boolean) => void;
}

export const AdConsentModal: React.FC<AdConsentModalProps> = ({ onConsentGiven }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    checkConsent();
  }, []);

  const checkConsent = async () => {
    try {
      const consent = await SecureStore.getItemAsync(CONSENT_KEY);
      if (consent === null) {
        setVisible(true);
      } else {
        onConsentGiven(consent === 'true');
      }
    } catch (error) {
      console.error('Failed to read consent from SecureStore:', error);
      setVisible(true);
    }
  };

  const handleConsent = async (personalized: boolean) => {
    try {
      await SecureStore.setItemAsync(CONSENT_KEY, personalized ? 'true' : 'false');
      setVisible(false);
      onConsentGiven(personalized);
    } catch (error) {
      console.error('Failed to save consent to SecureStore:', error);
      setVisible(false);
      onConsentGiven(personalized);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={styles.container}>
            <View style={styles.iconContainer}>
              <Feather name="shield" size={32} color="#3fff8b" />
            </View>

            <Text style={styles.title}>Sua Privacidade</Text>
            <Text style={styles.description}>
              Para mantermos o PECAÊ gratuito, exibimos anúncios. Gostaríamos da sua permissão para mostrar anúncios personalizados com base nos seus interesses.
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={() => handleConsent(true)}
              >
                <Text style={styles.acceptButtonText}>Permitir personalizados</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={() => handleConsent(false)}
              >
                <Text style={styles.rejectButtonText}>Não personalizar</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.footer}>
              Você pode alterar sua escolha a qualquer momento nas configurações do aplicativo.
            </Text>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10, 14, 20, 0.6)',
  },
  container: {
    backgroundColor: '#0a0e14',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(63, 255, 139, 0.15)',
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(63, 255, 139, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#F1F3FC',
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    color: '#A8ABB3',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#3fff8b',
  },
  acceptButtonText: {
    color: '#0a0e14',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    fontWeight: '700',
  },
  rejectButton: {
    backgroundColor: 'rgba(241, 243, 252, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(241, 243, 252, 0.1)',
  },
  rejectButtonText: {
    color: '#A8ABB3',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  footer: {
    color: 'rgba(168, 171, 179, 0.5)',
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 20,
  },
});
