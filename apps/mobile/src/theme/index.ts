import { useColorScheme } from 'react-native';
import { PecaeTokens } from './pecae-tokens';
import { useUIStore } from '../store/ui-store';

export const usePecaeTheme = () => {
  const systemColorScheme = useColorScheme();
  const { themeMode } = useUIStore();
  
  const isDark = themeMode === 'dark';
  const colors = isDark ? PecaeTokens.colors.dark : PecaeTokens.colors.light;

  return {
    isDark,
    colors,
    typography: PecaeTokens.typography,
    spacing: PecaeTokens.spacing,
    effects: PecaeTokens.effects,
  };
};

export type PecaeTheme = ReturnType<typeof usePecaeTheme>;

