import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { loadEnv } from './env';
import { setupSwagger } from './swagger';
import { uploadsDir } from './uploads/storage';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(uploadsDir(), { prefix: '/uploads/' });
  app.enableCors({
    origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : true,
    credentials: true,
  });
  setupSwagger(app);
  await app.listen(env.PORT);
}

void bootstrap();
