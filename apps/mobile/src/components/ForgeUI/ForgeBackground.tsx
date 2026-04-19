import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useForgeTheme } from '../../theme';

const { width, height } = Dimensions.get('window');

interface ForgeBackgroundProps {
  children: React.ReactNode;
}

export const ForgeBackground: React.FC<ForgeBackgroundProps> = ({ children }) => {
  const { colors, isDark } = useForgeTheme();

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
});
