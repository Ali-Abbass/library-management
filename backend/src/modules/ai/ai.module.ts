import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { GeminiClient } from './gemini.client';
import { SemanticSearchService } from './semantic-search.service';
import { SimilarBooksService } from './similar.service';
import { ReadingTimeService } from './reading-time.service';
import { GenreTrendsService } from './genre-trends.service';
import { PatronRecommendationsService } from './patron-recommendations.service';
import { SearchController } from './search.controller';
import { BookRepository } from '../books/repositories/book.repo';
import { LoanRepository } from '../loans/repositories/loan.repo';
import { CopyRepository } from '../copies/repositories/copy.repo';

@Module({
  controllers: [AiController, SearchController],
  providers: [
    GeminiClient,
    SemanticSearchService,
    SimilarBooksService,
    ReadingTimeService,
    GenreTrendsService,
    PatronRecommendationsService,
    BookRepository,
    LoanRepository,
    CopyRepository
  ]
})
export class AiModule {}
