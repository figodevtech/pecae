import React from 'react';
import { StyleSheet, View, Platform, ViewStyle, ScrollView, useWindowDimensions } from 'react-native';
import { useResponsive } from '../../theme/breakpoints';

interface PecaeScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
}

export const PecaeScreenContainer: React.FC<PecaeScreenContainerProps> = ({ 
  children, 
  style,
  scrollable = false 
}) => {
  const { isMobile, isTablet, pick } = useResponsive();
  const ContentWrapper = scrollable ? ScrollView : View;
  
  const horizontalPadding = pick({
    mobile: 20,
    tablet: 40,
    desktop: 0, // No desktop o maxWidth cuida da centralização
  });

  return (
    <View style={styles.outerContainer}>
      <ContentWrapper 
        style={[
          styles.innerContainer, 
          { paddingHorizontal: horizontalPadding },
          style
        ]}
        contentContainerStyle={scrollable ? styles.scrollContent : undefined}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ContentWrapper>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 1200, // Aumentado para suportar layouts split no futuro
    alignSelf: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
  }
});
