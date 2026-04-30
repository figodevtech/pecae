import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Marketplace Flow (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Search & Discovery', () => {
    it('/api/v1/search (GET) - Should allow public access to search', () => {
      return request(app.getHttpServer())
        .get('/api/v1/search?q=motor')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('hasMore');
          expect(res.body).toHaveProperty('nextCursor');
        });
    });

    it('/api/v1/search/suggestions (GET) - Should allow public access to suggestions', () => {
      return request(app.getHttpServer())
        .get('/api/v1/search/suggestions?q=por')
        .expect(200);
    });

    it('/api/v1/listings/:id (GET) - Should allow public access to individual listing', async () => {
      // Note: This assumes there's at least one listing or handles 404 gracefully
      const res = await request(app.getHttpServer()).get('/api/v1/search');
      if (res.body.data && res.body.data.length > 0) {
        const firstId = res.body.data[0].id;
        return request(app.getHttpServer())
          .get(`/api/v1/listings/${firstId}`)
          .expect(200);
      }
    });
  });

  describe('Security Check', () => {
    it('/api/v1/listings (POST) - Should deny access to create listing without token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/listings')
        .send({ title: 'Hack' })
        .expect(401);
    });
  });
});
