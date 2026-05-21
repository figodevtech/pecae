export interface StorageUploadResponse {
  uploadUrl: string;
  publicUrl: string;
  token?: string;
  path: string;
}

export interface StorageProvider {
  generateUploadUrl(bucket: string, path: string): Promise<StorageUploadResponse>;
  generateDownloadUrl(bucket: string, path: string, expiresIn?: number): Promise<string>;
  generateDownloadUrls(bucket: string, paths: string[], expiresIn?: number): Promise<string[]>;
  generateOptimizedUrl(bucket: string, path: string, options: { width: number; quality?: number }): string;
  deleteFile(bucket: string, path: string): Promise<void>;
  uploadFile(bucket: string, path: string, buffer: Buffer, contentType?: string): Promise<string>;
}
