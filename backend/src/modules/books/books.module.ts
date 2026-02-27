import { Module } from '@nestjs/common';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { BookRepository } from './repositories/book.repo';
import { CopiesModule } from '../copies/copies.module';

@Module({
  imports: [CopiesModule],
  controllers: [BooksController],
  providers: [BooksService, BookRepository]
})
export class BooksModule {}
