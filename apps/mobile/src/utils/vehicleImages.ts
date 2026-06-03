export const vehicleImages: Record<string, string[]> = {
  volkswagen: [
    'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80', // Golf
    'https://images.unsplash.com/photo-1566274360674-bf69fbd59d1a?auto=format&fit=crop&w=800&q=80', // Polo
  ],
  fiat: [
    'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80', // Argo/Generic
    'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=800&q=80', // Generic Hatch
  ],
  chevrolet: [
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80', // Onix/Generic
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80', // Camaro/Premium
  ],
  ford: [
    'https://images.unsplash.com/photo-1583121274602-3e2820bc39ee?auto=format&fit=crop&w=800&q=80', // Mustang
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80', // Focus
  ],
  toyota: [
    'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80', // Corolla
    'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?auto=format&fit=crop&w=800&q=80', // Yaris
  ],
  honda: [
    'https://images.unsplash.com/photo-160357860188d-8a716dfecf1f?auto=format&fit=crop&w=800&q=80', // Civic
    'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=800&q=80', // Fit
  ],
};

export const fallbackImages = [
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-149214453877b-2237f7980731?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=800&q=80',
];

export const getVehicleImage = (brand?: string, model?: string, id?: string): string => {
  if (!brand) {
    const index = id ? Math.abs(hashCode(id)) % fallbackImages.length : 0;
    return fallbackImages[index];
  }

  const normalizedBrand = brand.toLowerCase().trim();
  const images = vehicleImages[normalizedBrand];

  if (images && images.length > 0) {
    const index = id ? Math.abs(hashCode(id)) % images.length : 0;
    return images[index];
  }

  const fallbackIndex = id ? Math.abs(hashCode(id)) % fallbackImages.length : 0;
  return fallbackImages[fallbackIndex];
};

const hashCode = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash;
};
