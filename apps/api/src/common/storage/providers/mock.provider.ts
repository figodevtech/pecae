import { StorageProvider, StorageUploadResponse } from '../interfaces/storage-provider.interface';
import { Logger } from '@nestjs/common';

export class MockStorageProvider implements StorageProvider {
  private readonly logger = new Logger(MockStorageProvider.name);

  async generateUploadUrl(bucket: string, path: string): Promise<StorageUploadResponse> {
    this.logger.debug(`[MOCK STORAGE] Gerando URL de upload para bucket: ${bucket}, path: ${path}`);
    
    return {
      uploadUrl: `http://localhost:3000/mock-upload/${bucket}/${path}`,
      publicUrl: `https://pecae-mock-storage.com/${bucket}/${path}`,
      token: 'mock-token',
      path: path,
    };
  }

  async generateDownloadUrl(bucket: string, path: string, expiresIn = 3600): Promise<string> {
    this.logger.debug(`[MOCK STORAGE] Gerando URL de download para bucket: ${bucket}, path: ${path}`);
    return `https://pecae-mock-storage.com/${bucket}/${path}?expires=${expiresIn}`;
  }

  async generateDownloadUrls(bucket: string, paths: string[], expiresIn = 3600): Promise<string[]> {
    return paths.map(path => `https://pecae-mock-storage.com/${bucket}/${path}?expires=${expiresIn}`);
  }

  generateOptimizedUrl(bucket: string, path: string, options: { width: number; quality?: number }): string {
    return `https://pecae-mock-storage.com/${bucket}/${path}?width=${options.width}&format=webp&quality=${options.quality || 80}`;
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    this.logger.debug(`[MOCK STORAGE] Deletando arquivo no bucket: ${bucket}, path: ${path}`);
  }

  async uploadFile(bucket: string, path: string, buffer: Buffer, contentType?: string): Promise<string> {
    this.logger.debug(`[MOCK STORAGE] Upload de arquivo de ${buffer.length} bytes para ${bucket}/${path}`);
    return `https://pecae-mock-storage.com/${bucket}/${path}`;
  }
}
