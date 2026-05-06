import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePecaeTheme } from '../../theme';
import { PecaeGlassCard } from './PecaeGlassCard';

interface PecaeMatchToastProps {
  visible: boolean;
  onClose: () => void;
  onPress: () => void;
  vehicleName: string;
  brand: string;
  imageUrl?: string;
}

const { width } = Dimensions.get('window');

export const PecaeMatchToast: React.FC<PecaeMatchToastProps> = ({
  visible,
  onClose,
  onPress,
  vehicleName,
  brand,
  imageUrl,
}) => {
  const { colors, typography, isDark } = usePecaeTheme();
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 60,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Auto hide after 8 seconds
      const timer = setTimeout(() => {
        hide();
      }, 8000);

      return () => clearTimeout(timer);
    } else {
      hide();
    }
  }, [visible]);

  const hide = () => {
    Animated.timing(slideAnim, {
      toValue: -200,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  if (!visible && slideAnim._value === -200) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <Animated.View style={{ 
          shadowColor: colors.brand,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] }),
          shadowRadius: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 25] }),
          elevation: isDark ? 0 : 5,
        }}>
          <PecaeGlassCard padding={12} intensity={35} style={[styles.toastCard, { borderColor: colors.brand + '44' }]}>
            <View style={styles.content}>
              <View style={[styles.iconBadge, { backgroundColor: colors.brand }]}>
                <Ionicons name="flash" size={16} color="#000" />
              </View>
              
              <View style={styles.imageContainer}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.image} />
                ) : (
                  <View style={[styles.image, { backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="car-outline" size={24} color={colors.textMuted} />
                  </View>
                )}
              </View>
  
              <View style={styles.textContainer}>
                <Text style={[styles.brandText, { color: colors.brand, fontFamily: typography.display }]}>
                  SCAN_MATCH: DETECTADO
                </Text>
                <Text style={[styles.vehicleText, { color: colors.textPrimary, fontFamily: typography.display }]} numberOfLines={1}>
                  {brand.toUpperCase()} {vehicleName.toUpperCase()}
                </Text>
              </View>
  
              <TouchableOpacity onPress={hide} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </PecaeGlassCard>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toastCard: {
    borderRadius: 24,
    borderWidth: 1.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  imageContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1,
  },
  brandText: {
    fontSize: 8,
    letterSpacing: 2,
  },
  vehicleText: {
    fontSize: 13,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
