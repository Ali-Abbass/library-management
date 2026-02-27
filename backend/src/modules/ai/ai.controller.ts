import { Controller, Get, Param, Post, Body, Query, Req, ForbiddenException } from '@nestjs/common';
import { SemanticSearchService } from './semantic-search.service';
import { SimilarBooksService } from './similar.service';
import { ReadingTimeService } from './reading-time.service';
import { GenreTrendsService } from './genre-trends.service';
import { PatronRecommendationsService } from './patron-recommendations.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly semanticSearch: SemanticSearchService,
    private readonly similar: SimilarBooksService,
    private readonly readingTime: ReadingTimeService,
    private readonly trends: GenreTrendsService,
    private readonly patronRecommendations: PatronRecommendationsService
  ) {}

  @Post('semantic-search')
  search(@Body() body: { query: string }) {
    return this.semanticSearch.search(body.query);
  }

  @Post('suggest-query')
  suggestQuery(@Body() body: { query: string }) {
    return this.semanticSearch.suggestQuery(body.query);
  }

  @Get('similar/:bookId')
  similarBooks(@Param('bookId') bookId: string) {
    return this.similar.getSimilar(bookId);
  }

  @Get('reading-time/:bookId')
  readingTimeEstimate(@Param('bookId') bookId: string) {
    return this.readingTime.estimateForBook(bookId);
  }

  @Get('genre-trends')
  genreTrends() {
    return this.trends.getTrends();
  }

  @Get('recommendations')
  async recommendations(@Req() req: { user?: { id: string } }, @Query('refresh') refresh?: string) {
    const userId = req.user?.id;
    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }
    return this.patronRecommendations.recommendForUser(userId, refresh === 'true');
  }
}
