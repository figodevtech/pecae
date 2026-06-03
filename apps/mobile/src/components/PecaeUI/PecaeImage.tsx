import React from 'react';
import { Image, ImageProps } from 'expo-image';
import { StyleSheet, ViewStyle } from 'react-native';
import { getOptimizedUrl, ImageTransformOptions } from '../../utils/image-utils';

interface PecaeImageProps extends Omit<ImageProps, 'source'> {
  path: string | null | undefined;
  width?: number;
  height?: number;
  quality?: number;
  blurhash?: string | null;
  transformOptions?: ImageTransformOptions;
  containerStyle?: ViewStyle;
}

/**
 * Componente de imagem otimizado para o Peçaê.
 * Utiliza expo-image para alta performance, suporte a blurhash e transformações do Supabase.
 */
export const PecaeImage: React.FC<PecaeImageProps> = ({
  path,
  width,
  height,
  quality,
  blurhash,
  transformOptions,
  containerStyle,
  style,
  priority = 'normal',
  ...props
}) => {
  const optimizedUrl = getOptimizedUrl(path, {
    width,
    height,
    quality,
    ...transformOptions,
  });

  return (
    <Image
      source={optimizedUrl}
      placeholder={{ blurhash: blurhash || 'LEHV6nWB2yk8pyo0adRj00WBjtWV' }} // Default blurhash
      contentFit="cover"
      transition={200}
      priority={priority}
      style={[styles.image, style]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});
