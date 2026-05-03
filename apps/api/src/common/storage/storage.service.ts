import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from './interfaces/storage-provider.interface';
import { SupabaseStorageProvider } from './providers/supabase.provider';

@Injectable()
export class StorageService implements OnModuleInit {
  private provider: StorageProvider;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const type = this.configService.get<string>('STORAGE_TYPE', 'supabase');

    if (type === 'supabase') {
      const url = this.configService.get<string>('SUPABASE_URL');
      const key = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
      
      if (url && key) {
        this.provider = new SupabaseStorageProvider(url, key);
      }
    }
    
    // In the future, add S3 or Local providers here
    // else if (type === 's3') { ... }
  }

  async createSignedUploadUrl(bucket: string, path: string) {
    this.ensureProvider();
    return this.provider.generateUploadUrl(bucket, path);
  }

  async getSignedUrl(bucket: string, path: string, expiresIn = 3600) {
    this.ensureProvider();
    return this.provider.generateDownloadUrl(bucket, path, expiresIn);
  }

  async getSignedUrls(bucket: string, paths: string[], expiresIn = 3600) {
    this.ensureProvider();
    return this.provider.generateDownloadUrls(bucket, paths, expiresIn);
  }

  async getPublicUrl(bucket: string, path: string) {
    this.ensureProvider();
    const data = await this.provider.generateUploadUrl(bucket, path);
    return data.publicUrl;
  }

  async deleteFile(bucket: string, path: string) {
    if (!this.provider) return;
    await this.provider.deleteFile(bucket, path);
  }

  private ensureProvider() {
    if (!this.provider) {
      throw new Error('Storage provider not configured. Check STORAGE_TYPE in .env');
    }
  }
}
