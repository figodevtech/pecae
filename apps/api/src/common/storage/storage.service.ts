import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from './interfaces/storage-provider.interface';
import { SupabaseStorageProvider } from './providers/supabase.provider';
import { MockStorageProvider } from './providers/mock.provider';

@Injectable()
export class StorageService implements OnModuleInit {
  private provider: StorageProvider;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const type = this.configService.get<string>('STORAGE_TYPE', 'supabase');

    if (type === 'supabase') {
      const url = this.configService.get<string>('SUPABASE_URL');
      const key = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
      
      if (url && key && url !== 'your-project-url') {
        this.provider = new SupabaseStorageProvider(url, key);
      }
    }
    
    if (!this.provider) {
      this.provider = new MockStorageProvider();
    }
  }

  async createSignedUploadUrl(bucket: string, path: string) {
    return this.provider.generateUploadUrl(bucket, path);
  }

  async getSignedUrl(bucket: string, path: string, expiresIn = 3600) {
    return this.provider.generateDownloadUrl(bucket, path, expiresIn);
  }

  async getSignedUrls(bucket: string, paths: string[], expiresIn = 3600) {
    return this.provider.generateDownloadUrls(bucket, paths, expiresIn);
  }

  async getPublicUrl(bucket: string, path: string) {
    const data = await this.provider.generateUploadUrl(bucket, path);
    return data.publicUrl;
  }

  getOptimizedUrl(bucket: string, path: string, width: number, quality = 80) {
    return this.provider.generateOptimizedUrl(bucket, path, { width, quality });
  }

  async deleteFile(bucket: string, path: string) {
    if (!this.provider) return;
    await this.provider.deleteFile(bucket, path);
  }

  async uploadFile(bucket: string, path: string, buffer: Buffer, contentType?: string) {
    return this.provider.uploadFile(bucket, path, buffer, contentType);
  }
}
