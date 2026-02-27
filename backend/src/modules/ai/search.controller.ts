import { Body, Controller, Post } from '@nestjs/common';
import { SemanticSearchService } from './semantic-search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly semanticSearch: SemanticSearchService) {}

  @Post('semantic')
  search(@Body() body: { query: string }) {
    return this.semanticSearch.search(body.query);
  }
}
