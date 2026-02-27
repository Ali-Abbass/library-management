import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalErrorFilter } from './common/http/error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalFilters(new GlobalErrorFilter());
  app.setGlobalPrefix('api/v1');
  await app.listen(process.env.PORT || 3000);
}

bootstrap();
