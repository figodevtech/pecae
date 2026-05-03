import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';
import { SupabaseStorageProvider } from './providers/supabase.provider';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'STORAGE_TYPE') return 'supabase';
              if (key === 'SUPABASE_URL') return 'http://localhost';
              if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // check if createSignedUrls exists
  it('generateUrls', async () => {
      // test whether we can call generateDownloadUrls
      expect(typeof service.getSignedUrls).toBe('function');
  })
});
