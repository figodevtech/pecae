export class SellerPublicDto {
  id: string;
  storeName: string;
  city: string;
  state: string;
  avatar: string | null;
  isVerified: boolean;
  rating: number | null;
}

export class VehiclePhotoDto {
  id: string;
  url: string;
  order: number;
  type: string;
}

export class AvailablePartDto {
  name: string;
  icon: string;
}

export class VehicleDetailDto {
  id: string;
  color: string;
  city: string;
  state: string;
  observations: string | null;
  year: number;
  modelName: string;
  brandName: string;
  versionName: string;
  photos: VehiclePhotoDto[];
  availableParts: AvailablePartDto[];
}

export class ListingDetailResponseDto {
  id: string;
  title: string;
  description: string | null;
  views: number;
  favoritesCount: number;
  createdAt: Date;
  publishedAt: Date | null;
  vehicle: VehicleDetailDto;
  seller: SellerPublicDto;
}
