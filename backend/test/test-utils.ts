import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { GlobalErrorFilter } from '../src/common/http/error.filter';

type OverrideMap = Map<unknown, unknown>;

export async function createTestApp(overrides?: OverrideMap): Promise<INestApplication> {
  process.env.AUTH_BYPASS = 'true';

  const moduleBuilder = Test.createTestingModule({
    imports: [AppModule]
  });

  overrides?.forEach((value, token) => {
    moduleBuilder.overrideProvider(token).useValue(value);
  });

  const moduleRef = await moduleBuilder.compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalFilters(new GlobalErrorFilter());
  app.setGlobalPrefix('api/v1');
  await app.init();
  return app;
}

export async function closeTestApp(app: INestApplication) {
  await app.close();
}
