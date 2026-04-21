import { useWindowDimensions } from 'react-native';

export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  large: 1440,
};

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isMobile = width < breakpoints.tablet;
  const isTablet = width >= breakpoints.tablet && width < breakpoints.desktop;
  const isDesktop = width >= breakpoints.desktop;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    // Helper para retornar valores baseados na tela
    pick: <T>(values: { mobile: T; tablet?: T; desktop?: T }) => {
      if (isDesktop && values.desktop !== undefined) return values.desktop;
      if (isTablet && values.tablet !== undefined) return values.tablet;
      return values.mobile;
    },
  };
};
