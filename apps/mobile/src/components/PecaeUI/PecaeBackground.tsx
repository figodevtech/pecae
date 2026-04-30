import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePecaeTheme } from '../../theme';

const { width, height } = Dimensions.get('window');

interface PecaeBackgroundProps {
  children: React.ReactNode;
}

export const PecaeBackground: React.FC<PecaeBackgroundProps> = ({ children }) => {
  const { colors, isDark } = usePecaeTheme();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.background as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Ambient Glows */}
      <View 
        style={[
          styles.glow, 
          { 
            backgroundColor: colors.brand, 
            opacity: isDark ? 0.08 : 0.04,
            top: -height * 0.2,
            left: -width * 0.2,
          }
        ]} 
      />
      <View 
        style={[
          styles.glow, 
          { 
            backgroundColor: colors.vibrant, 
            opacity: isDark ? 0.05 : 0.03,
            bottom: -height * 0.1,
            right: -width * 0.1,
          }
        ]} 
      />

      {/* Scanlines Pattern (Industrial Feel) */}
      <View style={styles.scanlines} pointerEvents="none" />

      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    // Blur is handled by the overall feel, 
    // in RN we use a large borderRadius and low opacity.
    // For real blur on generic views, we'd need @react-native-masked-view/masked-view + blur
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    opacity: 0.03,
    // Em RN, simulamos scanlines com um background repetido ou bordas
    // Aqui usaremos uma cor sólida com opacidade baixíssima e deixaremos 
    // a textura para um componente de imagem se necessário, 
    // mas o grid/glow já ajuda.
  },
});
