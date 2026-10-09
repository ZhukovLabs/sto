import 'dotenv/config';
import 'reflect-metadata';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createOpenApiDocument } from './swagger';

process.env.SKIP_DB_CONNECT = '1';

async function generate(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  const document = createOpenApiDocument(app);
  const outPath = resolve(__dirname, '../../../../packages/types/openapi.json');
  mkdirSync(resolve(outPath, '..'), { recursive: true });
  writeFileSync(outPath, JSON.stringify(document, null, 2));
  await app.close();
}

void generate()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
