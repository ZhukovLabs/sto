import 'dotenv/config';
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { DEFAULT_CORS_ORIGINS, loadEnv } from './env';
import { setupSwagger } from './swagger';
import { uploadsDir } from './uploads/storage';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // За реверс-прокси настоящий IP клиента приходит в X-Forwarded-For.
  // Без этого request.ip у всех посетителей одинаковый (адрес прокси)
  // и рейт-лимитеры публичных форм лочат весь сайт.
  app.set('trust proxy', 1);
  app.useStaticAssets(uploadsDir(), { prefix: '/uploads/' });
  app.enableCors({
    // Пустой список origins (например, CORS_ORIGINS="" в проде) не должен
    // открывать доступ всем: откатываемся к дефолтным локальным origin-ам.
    origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : DEFAULT_CORS_ORIGINS,
    credentials: true,
  });
  // Swagger описывает всё админ-API — в проде не выставляем.
  if (process.env.NODE_ENV !== 'production') {
    setupSwagger(app);
  }
  await app.listen(env.PORT);
}

const logger = new Logger('Bootstrap');
bootstrap().catch((error: unknown) => {
  logger.error(`Не удалось запустить API: ${error instanceof Error ? error.stack : String(error)}`);
  process.exit(1);
});
