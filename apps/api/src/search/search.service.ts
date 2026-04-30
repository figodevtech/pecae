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
      priceMin,
      priceMax,
      cursor,
      limit = 10,
    } = filters;

    // Fetch part categories for mapping IDs to names
    const partCategories = await this.prisma.partCategory.findMany();
    const partCategoryMap = new Map(partCategories.map((pc) => [pc.id, pc.name]));

    const vehicleWhere: any = {
      ...(brandId && { version: { model: { brandId } } }),
      ...(modelId && { version: { modelId } }),
      ...(versionId && { versionId }),
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(state && { state: state.toUpperCase() }),
    };

    if (yearMin || yearMax) {
      vehicleWhere.yearFab = {
        yearFab: {
          ...(yearMin && { gte: yearMin }),
          ...(yearMax && { lte: yearMax }),
        },
      };
    }

    const where: any = {
      status: 'PUBLISHED',
      vehicle: vehicleWhere,
    };

    // Full-Text Search with Prisma fullTextSearch feature
    if (q) {
      // Use search on Listing title/description and Vehicle observations
      where.OR = [
        { title: { search: q.trim().split(/\s+/).join(' & ') } },
        { description: { search: q.trim().split(/\s+/).join(' & ') } },
        { vehicle: { observations: { search: q.trim().split(/\s+/).join(' & ') } } },
      ];
    }

    // Price Filter
    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {
        ...(priceMin !== undefined && { gte: priceMin }),
        ...(priceMax !== undefined && { lte: priceMax }),
      };
    }

    // Execute query with take: limit + 1 for pagination
    const listings = await this.prisma.listing.findMany({
      where,
      include: {
        vehicle: {
          include: {
            photos: {
              where: { order: 0 },
              take: 1,
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
          },
        },
        sellerProfile: {
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
      skip: cursor ? 1 : 0, // Avoid returning the cursor item itself
      orderBy: { publishedAt: 'desc' },
    });

    const hasMore = listings.length > limit;
    const dataItems = hasMore ? listings.slice(0, limit) : listings;
    const nextCursor = hasMore ? dataItems[dataItems.length - 1].id : null;

    let sponsoredData: any[] = [];
    if (!cursor) {
      try {
        const sponsoredListings = await this.adsService.getSponsoredListings(2);
        sponsoredData = sponsoredListings.map((item: any) => {
          const partsIds = Array.isArray(item.vehicle?.availableParts)
            ? (item.vehicle.availableParts as string[])
            : [];
          
          const partNames = partsIds
            .map((id) => partCategoryMap.get(id))
            .filter(Boolean) as string[];

          return {
            id: item.id,
            title: item.title,
            description: item.description,
            publishedAt: item.publishedAt,
            views: item.views,
            favoritesCount: item.favoritesCount,
            sellerId: item.sellerProfileId,
            seller: item.sellerProfile,
            isSponsored: true,
            campaignId: item.campaignId,
            vehicle: item.vehicle ? {
              id: item.vehicle.id,
              color: item.vehicle.color,
              city: item.vehicle.city,
              state: item.vehicle.state,
              observations: item.vehicle.observations,
              brand: item.vehicle.version?.model?.brand?.name || '',
              model: item.vehicle.version?.model?.name || '',
              version: item.vehicle.version?.name || '',
              yearFab: item.vehicle.yearFab?.yearFab || 0,
              thumbnail: item.vehicle.photos?.[0]?.url || null,
              availableParts: partNames,
            } : null,
          };
        });
      } catch (error) {
        console.error('Failed to fetch sponsored listings:', error);
      }
    }

    // Map output according to criteria
    const data = dataItems.map((item) => {
      const partsIds = Array.isArray(item.vehicle.availableParts)
        ? (item.vehicle.availableParts as string[])
        : [];
      
      const partNames = partsIds
        .map((id) => partCategoryMap.get(id))
        .filter(Boolean) as string[];

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        publishedAt: item.publishedAt,
        price: item.price,
        views: item.views,
        favoritesCount: item.favoritesCount,
        sellerId: item.sellerProfileId,
        seller: item.sellerProfile,
        isSponsored: false,
        campaignId: null,
        vehicle: {
          id: item.vehicle.id,
          color: item.vehicle.color,
          city: item.vehicle.city,
          state: item.vehicle.state,
          observations: item.vehicle.observations,
          brand: item.vehicle.version.model.brand.name,
          model: item.vehicle.version.model.name,
          version: item.vehicle.version.name,
          yearFab: item.vehicle.yearFab.yearFab,
          thumbnail: item.vehicle.photos[0]?.url || null,
          availableParts: partNames,
        },
      };
    });

    const result = {
      data: [...sponsoredData, ...data],
      nextCursor,
      hasMore,
    };

    // Cache for 5 minutes (300 seconds)
    await this.redis.set(cacheKey, result, 300);

    return result;
  }

  async getSuggestions(q: string) {
    if (!q || q.trim() === '') {
      return [];
    }

    const trimmedQ = q.trim();

    // Query brands containing q
    const brands = await this.prisma.vehicleBrand.findMany({
      where: {
        name: { contains: trimmedQ, mode: 'insensitive' },
      },
      take: 5,
    });

    // Query models containing q
    const models = await this.prisma.vehicleModel.findMany({
      where: {
        name: { contains: trimmedQ, mode: 'insensitive' },
      },
      take: 5,
    });

    const suggestions = [
      ...brands.map((b) => ({ text: b.name, type: 'BRAND', id: b.id })),
      ...models.map((m) => ({ text: m.name, type: 'MODEL', id: m.id })),
    ];

    return suggestions;
  }
}
