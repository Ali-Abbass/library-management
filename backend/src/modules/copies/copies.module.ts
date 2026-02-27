import { Module } from '@nestjs/common';
import { CopiesController } from './copies.controller';
import { CopiesService } from './copies.service';
import { CopyRepository } from './repositories/copy.repo';

@Module({
  controllers: [CopiesController],
  providers: [CopiesService, CopyRepository],
  exports: [CopiesService]
})
export class CopiesModule {}
