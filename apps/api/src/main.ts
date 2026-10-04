import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const origins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim());
  app.enableCors({ origin: origins ?? true, credentials: true });
  setupSwagger(app);
  const port = Number(process.env.PORT ?? 3002);
  await app.listen(port);
}

void bootstrap();
