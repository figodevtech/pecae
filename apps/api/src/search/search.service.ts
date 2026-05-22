import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchFiltersDto } from './dto/search-filters.dto';
import { RedisService } from '../common/redis/redis.service';
import { AdsService } from '../ads/ads.service';
import * as crypto from 'crypto';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly adsService: AdsService,
  ) {}

  async search(filters: SearchFiltersDto) {
    // Generate deterministic cache key via SHA256
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((acc, key) => {
        if ((filters as any)[key] !== undefined) {
          (acc as any)[key] = (filters as any)[key];
        }
        return acc;
      }, {});

    const cacheKey = `search:${crypto
      .createHash('sha256')
      .update(JSON.stringify(sortedFilters))
      .digest('hex')}`;

    // Try to get from cache
    const cachedResult = await this.redis.get<{
      data: any[];
      nextCursor: string | null;
      hasMore: boolean;
    }>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    const {
      brandId,
      modelId,
      versionId,
      yearMin,
      yearMax,
      city,
      state,
      q,
      cursor,
      limit = 10,
    } = filters;

    // Resolve brand name to UUID if not a valid UUID (resilient filters)
    let resolvedBrandId = brandId;
    if (brandId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brandId)) {
      const matchedBrand = await this.prisma.vehicleBrand.findFirst({
        where: {
          name: { contains: brandId, mode: 'insensitive' },
        },
        select: { id: true },
      });
      resolvedBrandId = matchedBrand?.id || '00000000-0000-0000-0000-000000000000';
    }

    // Fetch part categories for mapping IDs to names
    const partCategories = await this.prisma.partCategory.findMany();
    const partCategoryMap = new Map(partCategories.map((pc) => [pc.id, pc.name]));

    const where: any = {
      status: 'ACTIVE', // Status do veículo no catálogo
      deletedAt: null,
      seller: {
        deletedAt: null, // Ocultar veículos de vendedores deletados (LGPD)
      },
      listings: {
        some: {
          status: 'PUBLISHED',
        },
      },
      ...(resolvedBrandId && { version: { model: { brandId: resolvedBrandId } } }),
      ...(modelId && { version: { modelId } }),
      ...(versionId && { versionId }),
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(state && { state: state.toUpperCase() }),
    };

    if (yearMin || yearMax) {
      where.yearFab = {
        yearFab: {
          ...(yearMin && { gte: yearMin }),
          ...(yearMax && { lte: yearMax }),
        },
      };
    }

    // Full-Text Search on Listings title/desc and Vehicle observations/specs
    if (q) {
      const searchQuery = q.trim().split(/\s+/).join(' & ');
      where.OR = [
        { observations: { search: searchQuery } },
        { listings: { some: { title: { search: searchQuery } } } },
        { listings: { some: { description: { search: searchQuery } } } },
        { version: { name: { contains: q, mode: 'insensitive' } } },
        { version: { model: { name: { contains: q, mode: 'insensitive' } } } },
        { version: { model: { brand: { name: { contains: q, mode: 'insensitive' } } } } },
      ];
    }

    // Execute queries concurrently: Organic Search and Sponsored Listings
    const [vehicles, sponsoredListings] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        include: {
          photos: {
            orderBy: { order: 'asc' },
          },
          version: {
            include: {
              model: {
                include: {
                  brand: true,
                },
              },
            },
          },
          yearFab: true,
          seller: {
            select: {
              id: true,
              storeName: true,
              city: true,
              state: true,
              isVerified: true,
            },
          },
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        orderBy: { createdAt: 'desc' },
      }),
      cursor
        ? Promise.resolve([]) // Apenas injeta patrocinados na 1ª página
        : this.adsService.getSponsoredListings({
            brandId: resolvedBrandId,
            modelId,
            year: yearMin || yearMax || undefined,
            city,
            state,
            limit: 2,
          }),
    ]);

    const hasMore = vehicles.length > limit;
    const dataItems = hasMore ? vehicles.slice(0, limit) : vehicles;
    const nextCursor = hasMore ? dataItems[dataItems.length - 1].id : null;

    // Map organic vehicles to final card format
    const organicData = dataItems.map((item) => {
      const partsIds = Array.isArray(item.availableParts)
        ? (item.availableParts as string[])
        : [];
      
      const partNames = partsIds
        .map((id) => partCategoryMap.get(id))
        .filter(Boolean) as string[];

      return {
        id: item.id,
        brand: item.version.model.brand.name,
        model: item.version.model.name,
        version: item.version.name,
        yearFab: item.yearFab.yearFab,
        color: item.color,
        city: item.city,
        state: item.state,
        thumbnail: item.photos[0]?.url || null,
        photos: item.photos.map(p => p.url),
        availablePartsCount: partNames.length,
        availableParts: partNames,
        seller: item.seller,
        isSponsored: false,
        createdAt: item.createdAt,
      };
    });

    // Map sponsored listings to final card format (same as organic card)
    const sponsoredData = sponsoredListings.map((listing: any) => {
      const item = listing.vehicle;
      const partsIds = Array.isArray(item.availableParts)
        ? (item.availableParts as string[])
        : [];
      
      const partNames = partsIds
        .map((id) => partCategoryMap.get(id))
        .filter(Boolean) as string[];

      return {
        id: item.id,
        brand: item.version.model.brand.name,
        model: item.version.model.name,
        version: item.version.name,
        yearFab: item.yearFab.yearFab,
        color: item.color,
        city: item.city,
        state: item.state,
        thumbnail: item.photos[0]?.url || null,
        photos: item.photos.map((p: any) => p.url),
        availablePartsCount: partNames.length,
        availableParts: partNames,
        seller: {
          id: item.sellerProfile.id,
          storeName: item.sellerProfile.storeName,
          city: item.sellerProfile.city,
          state: item.sellerProfile.state,
          isVerified: item.sellerProfile.isVerified,
        },
        isSponsored: true,
        campaignId: listing.campaignId,
        listingId: listing.id,
        createdAt: item.createdAt,
      };
    });

    // Apply Active Deduplication: filter out sponsored vehicle IDs from organic list
    const sponsoredVehicleIds = new Set(sponsoredData.map(s => s.id));
    const dedupedOrganic = organicData.filter(item => !sponsoredVehicleIds.has(item.id));

    // Combine: sponsored listings at the very top of the list
    const data = [...sponsoredData, ...dedupedOrganic];

    const result = {
      data,
      nextCursor,
      hasMore,
    };

    // Cache for 60 seconds (1 minute) to keep ads and listings responsive
    await this.redis.set(cacheKey, result, 60);

    return result;
  }

  async getSuggestions(q: string) {
    if (!q || q.trim() === '') {
      return [];
    }

    const trimmedQ = q.trim();

    // Query brands and models containing q concurrently
    const [brands, models] = await Promise.all([
      this.prisma.vehicleBrand.findMany({
        where: {
          name: { contains: trimmedQ, mode: 'insensitive' },
        },
        take: 5,
      }),
      this.prisma.vehicleModel.findMany({
        where: {
          name: { contains: trimmedQ, mode: 'insensitive' },
        },
        take: 5,
      }),
    ]);

    const suggestions = [
      ...brands.map((b) => ({ text: b.name, type: 'BRAND', id: b.id })),
      ...models.map((m) => ({ text: m.name, type: 'MODEL', id: m.id })),
    ];

    return suggestions;
  }
}
