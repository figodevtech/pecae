import { useColorScheme } from 'react-native';
import { ForgeTokens } from './forge-tokens';

export const useForgeTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? ForgeTokens.colors.dark : ForgeTokens.colors.light;

  return {
    isDark,
    colors,
    typography: ForgeTokens.typography,
    effects: ForgeTokens.effects,
  };
};

export type ForgeTheme = ReturnType<typeof useForgeTheme>;
