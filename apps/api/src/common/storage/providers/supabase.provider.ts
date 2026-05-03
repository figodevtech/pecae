import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageProvider, StorageUploadResponse } from '../interfaces/storage-provider.interface';

export class SupabaseStorageProvider implements StorageProvider {
  private supabase: SupabaseClient;

  constructor(url: string, key: string) {
    this.supabase = createClient(url, key);
  }

  async generateUploadUrl(bucket: string, path: string): Promise<StorageUploadResponse> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error) throw error;

    const { data: publicData } = this.supabase.storage.from(bucket).getPublicUrl(path);

    return {
      uploadUrl: data.signedUrl,
      publicUrl: publicData.publicUrl,
      token: data.token,
      path: data.path,
    };
  }

  async generateDownloadUrl(bucket: string, path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  }

  async generateDownloadUrls(bucket: string, paths: string[], expiresIn = 3600): Promise<string[]> {
    if (!paths || paths.length === 0) return [];
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrls(paths, expiresIn);

    if (error) throw error;
    return data.map(item => item.signedUrl).filter((url): url is string => Boolean(url));
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    await this.supabase.storage.from(bucket).remove([path]);
  }
}
