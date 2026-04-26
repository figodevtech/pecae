import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);
  private readonly CACHE_TTL = 86400; // 24 hours (24 * 60 * 60)

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * List all vehicle brands with cache
   */
  async getBrands() {
    const cacheKey = 'catalog:brands';
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) return cached;

    const brands = await this.prisma.vehicleBrand.findMany({
      orderBy: { name: 'asc' },
    });

    await this.redis.set(cacheKey, brands, this.CACHE_TTL);
    return brands;
  }

  /**
   * List models for a specific brand with cache
   */
  async getModels(brandId: string) {
    const cacheKey = `catalog:brand:${brandId}:models`;
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) return cached;

    const models = await this.prisma.vehicleModel.findMany({
      where: { brandId },
      orderBy: { name: 'asc' },
    });

    await this.redis.set(cacheKey, models, this.CACHE_TTL);
    return models;
  }

  /**
   * List versions for a specific model with cache
   */
  async getVersions(modelId: string) {
    const cacheKey = `catalog:model:${modelId}:versions`;
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) return cached;

    const versions = await this.prisma.vehicleVersion.findMany({
      where: { modelId },
      orderBy: { name: 'asc' },
    });

    await this.redis.set(cacheKey, versions, this.CACHE_TTL);
    return versions;
  }

  /**
   * List years for a specific version with cache
   */
  async getYears(versionId: string) {
    const cacheKey = `catalog:version:${versionId}:years`;
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) return cached;

    const years = await this.prisma.vehicleYear.findMany({
      where: { versionId },
      orderBy: { yearFab: 'desc' },
    });

    await this.redis.set(cacheKey, years, this.CACHE_TTL);
    return years;
  }

  /**
   * List all part categories with cache
   */
  async getPartCategories() {
    const cacheKey = 'catalog:part-categories';
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) return cached;

    const categories = await this.prisma.partCategory.findMany({
      orderBy: { name: 'asc' },
    });

    await this.redis.set(cacheKey, categories, this.CACHE_TTL);
    return categories;
  }

  /**
   * Invalidates all catalog cache
   */
  async invalidateCatalogCache() {
    await this.redis.delByPrefix('catalog:');
    this.logger.log('Catalog cache invalidated.');
  }

  /**
   * Get brand by name
   */
  async getBrandByName(name: string) {
    return this.prisma.vehicleBrand.findFirst({
      where: { name },
    });
  }

  /**
   * List distinct years for a brand with cache
   */
  async getYearsByBrand(brandId: string) {
    const cacheKey = `catalog:brand:${brandId}:years`;
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) return cached;

    const years = await this.prisma.vehicleYear.findMany({
      where: {
        version: {
          model: {
            brandId,
          },
        },
      },
      select: {
        yearFab: true,
        yearModel: true,
      },
      distinct: ['yearFab', 'yearModel'],
      orderBy: [
        { yearFab: 'desc' },
        { yearModel: 'desc' },
      ],
    });

    await this.redis.set(cacheKey, years, this.CACHE_TTL);
    return years;
  }

  /**
   * List models for a brand and specific years with cache
   */
  async getModelsByBrandAndYear(brandId: string, yearFab: number, yearModel: number) {
    const cacheKey = `catalog:brand:${brandId}:yearFab:${yearFab}:yearModel:${yearModel}:models`;
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) return cached;

    const models = await this.prisma.vehicleModel.findMany({
      where: {
        brandId,
        versions: {
          some: {
            years: {
              some: {
                yearFab,
                yearModel,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    await this.redis.set(cacheKey, models, this.CACHE_TTL);
    return models;
  }
}

