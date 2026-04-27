export const PecaeTokens = {
  colors: {
    light: {
      brand: '#2D8C4E', // Verde PEÇAE
      vibrant: '#4ADE80', // Verde Vibrante
      dark: '#14532D', // Verde Escuro
      background: ['#E8F5E9', '#C8E6C9'], // Light Green Gradient
      surface: 'rgba(255, 255, 255, 0.4)',
      border: 'rgba(255, 255, 255, 0.5)',
      textPrimary: '#14532D', // Deep Green for text
      textMuted: '#4B5563', 
      error: '#EF4444',
    },
    dark: {
      brand: '#4ADE80', // Verde Vibrante
      vibrant: '#2D8C4E', // Verde PEÇAE
      dark: '#022C22', // Very Dark Green
      background: ['#022C22', '#064E3B'], // Dark Green Gradient
      surface: 'rgba(255, 255, 255, 0.05)', 
      border: 'rgba(255, 255, 255, 0.1)', 
      textPrimary: '#F8FAFC', 
      textMuted: '#94A3B8', 
      error: '#FF4D4D',
    },
  },
  typography: {
    display: 'SpaceGrotesk_700Bold',
    heading: 'SpaceGrotesk_600SemiBold',
    body: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    mono: 'Manrope_400Regular', // Using Manrope as fallback if Mono not loaded
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  effects: {
    blur: 16,
    radius: {
      sm: 8,
      md: 16,
      lg: 24,
      full: 999,
    },
  },
};
