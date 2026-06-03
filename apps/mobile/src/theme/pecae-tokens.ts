export const PecaeTokens = {
  colors: {
    light: {
      brand: '#2D8C4E', // Verde PEÇAE
      vibrant: '#4ADE80', // Verde Vibrante
      dark: '#14532D', // Verde Escuro
      background: '#F1F5F1', // Cleaner light background
      backgroundGradient: ['#F1F5F1', '#E8F5E9'],
      surface: 'rgba(255, 255, 255, 0.95)', // More solid for light mode visibility
      border: 'rgba(0, 0, 0, 0.08)', // Soft but defined border
      textPrimary: '#0F172A', // Slate 900 for high contrast
      textMuted: '#475569', // Slate 600
      error: '#EF4444',
    },
    dark: {
      brand: '#3fff8b', // Vibrant Electric Green
      vibrant: '#7ae6ff', // Tech Accent (Blue/Cyan)
      dark: '#0a0e14', // Base Obsidian
      background: '#0a0e14',
      backgroundGradient: ['#022C22', '#0a0e14'],
      surface: 'rgba(27, 32, 40, 0.6)', // Glass Obsidian
      border: 'rgba(63, 255, 139, 0.15)', // Tonal highlight
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
