import Constants from 'expo-constants';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const BUCKET_NAME = 'vehicles';

export type ImageTransformOptions = {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'origin';
};

/**
 * Gera uma URL otimizada do Supabase para uma imagem.
 * Se a URL já for completa (externa), retorna ela mesma.
 */
export const getOptimizedUrl = (
  path: string | null | undefined,
  options: ImageTransformOptions = {}
): string => {
  if (!path) return '';

  // Se já for uma URL completa, não transforma (pode ser de um provider externo)
  if (path.startsWith('http')) return path;

  const { width, height, quality = 80, format = 'webp' } = options;

  // URL de renderização do Supabase: /storage/v1/render/image/public/[bucket]/[path]
  const baseUrl = `${SUPABASE_URL}/storage/v1/render/image/public/${BUCKET_NAME}/${path}`;
  
  const params = new URLSearchParams();
  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  if (quality) params.append('quality', quality.toString());
  if (format !== 'origin') params.append('format', format);

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};
