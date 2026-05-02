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

    const where: any = {
      status: 'ACTIVE', // Status do veículo no catálogo
      ...(brandId && { version: { model: { brandId } } }),
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

    // Full-Text Search on Vehicle observations and version/model names
    if (q) {
      const searchQuery = q.trim().split(/\s+/).join(' & ');
      where.OR = [
        { observations: { search: searchQuery } },
        { version: { name: { contains: q, mode: 'insensitive' } } },
        { version: { model: { name: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    // Execute query for Vehicles
    const vehicles = await this.prisma.vehicle.findMany({
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
    });

    const hasMore = vehicles.length > limit;
    const dataItems = hasMore ? vehicles.slice(0, limit) : vehicles;
    const nextCursor = hasMore ? dataItems[dataItems.length - 1].id : null;

    // Map output to match the UI expectations for Vehicle-Centric
    const data = dataItems.map((item) => {
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

    const result = {
      data,
      nextCursor,
      hasMore,
    };

    // Cache for 5 minutes
    await this.redis.set(cacheKey, result, 300);

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
