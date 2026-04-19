export const ForgeTokens = {
  colors: {
    light: {
      brand: '#2D8C4E',
      vibrant: '#4ADE80',
      dark: '#14532D',
      background: ['#E8F5E9', '#C8E6C9'],
      surface: 'rgba(255, 255, 255, 0.4)',
      border: 'rgba(255, 255, 255, 0.5)',
      textPrimary: '#1E293B',
      textMuted: '#475569',
      error: '#EF4444',
    },
    dark: {
      brand: '#3FFF8B',
      vibrant: '#7AE6FF',
      dark: '#0A0E14',
      background: ['#022C22', '#0A0E14'],
      surface: 'rgba(27, 32, 40, 0.6)',
      border: 'rgba(63, 255, 139, 0.15)',
      textPrimary: '#F1F3FC',
      textMuted: '#A8ABB3',
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
