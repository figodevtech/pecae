import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { SearchService } from './src/search/search.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const searchService = app.get(SearchService);

  // clear redis cache to test DB queries
  const redisService = app.get('RedisService');
  await redisService.delByPrefix('search:');

  const start = Date.now();
  for (let i = 0; i < 100; i++) {
    await searchService.search({ q: 'test' + i, limit: 10 });
  }
  const end = Date.now();
  console.log(`Time taken: ${end - start}ms`);

  await app.close();
}

run();
