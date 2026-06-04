import { SellerType } from '@prisma/client';

export class PublicSellerDto {
  id: string;
  storeName: string;
  type: SellerType;
  city: string;
  state: string;
  logo?: string;
  description?: string;
  isVerified: boolean;
  showContactInfo: boolean;
  whatsapp?: string;
  phone?: string;
  stats?: {
    activeListings: number;
    avgResponseTimeMinutes?: number;
  };
}
