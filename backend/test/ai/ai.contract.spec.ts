import request from 'supertest';
import { createTestApp, closeTestApp } from '../test-utils';
import { SemanticSearchService } from '../../src/modules/ai/semantic-search.service';
import { SimilarBooksService } from '../../src/modules/ai/similar.service';
import { ReadingTimeService } from '../../src/modules/ai/reading-time.service';
import { GenreTrendsService } from '../../src/modules/ai/genre-trends.service';

describe('AI API Contracts', () => {
  it('supports AI endpoints', async () => {
    const semanticService: Partial<SemanticSearchService> = {
      search: async () => ({ query: 'x', results: [{ id: 'book-1', title: 'Test Book', score: 0.9 }] })
    };
    const similarService: Partial<SimilarBooksService> = {
      getSimilar: async () => [{ id: 'book-2', code: 'BK-2', reason: 'genre:tech' }]
    };
    const readingService: Partial<ReadingTimeService> = {
      estimateForBook: async () => ({ minutes: 120 })
    };
    const trendsService: Partial<GenreTrendsService> = {
      getTrends: async () => [{ genre: 'technology', score: 4 }]
    };

    const app = await createTestApp(
      new Map<unknown, unknown>([
        [SemanticSearchService, semanticService],
        [SimilarBooksService, similarService],
        [ReadingTimeService, readingService],
        [GenreTrendsService, trendsService]
      ])
    );

    const searchRes = await request(app.getHttpServer())
      .post('/api/v1/ai/semantic-search')
      .send({ query: 'modern libraries' })
      .expect(201);
    expect(searchRes.body.results[0].id).toBe('book-1');

    const similarRes = await request(app.getHttpServer()).get('/api/v1/ai/similar/book-1').expect(200);
    expect(similarRes.body[0]).toMatchObject({ id: 'book-2' });

    const readingRes = await request(app.getHttpServer()).get('/api/v1/ai/reading-time/book-1').expect(200);
    expect(readingRes.body.minutes).toBe(120);

    const trendsRes = await request(app.getHttpServer()).get('/api/v1/ai/genre-trends').expect(200);
    expect(trendsRes.body[0].genre).toBe('technology');

    await closeTestApp(app);
  });
});
