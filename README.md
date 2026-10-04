# СТО — монорепозиторий

Сайт автосервиса: публичная часть, админка и API в одном репозитории.

## Структура

```
apps/
  web/     — публичный сайт (Next.js, App Router, порт 3000)
  admin/   — админка (Next.js, порт 3001)
  api/     — backend (NestJS + Prisma + PostgreSQL, порт 3002)
packages/
  ui/      — дизайн-система: токены Tailwind v4 + React-компоненты
  types/   — типы, генерируемые из OpenAPI-контрактов api
```

## Быстрый старт

Требуется: Node 20+, pnpm 10+, Docker (для PostgreSQL).

```bash
pnpm install

pnpm db:up                                # поднять PostgreSQL в docker
cp apps/api/.env.example apps/api/.env    # переменные окружения api
pnpm db:migrate                           # применить миграции Prisma

pnpm dev        # все приложения (turbo)
pnpm dev:web    # только сайт       → http://localhost:3000
pnpm dev:admin  # только админка    → http://localhost:3001
pnpm dev:api    # только api        → http://localhost:3002
```

## Генерация типов из API

Контракты бэкенда описываются декораторами NestJS + `@nestjs/swagger`.
Из них генерируется OpenAPI-спека и типы для фронта:

```bash
pnpm gen:types
```

Что происходит:

1. `apps/api` собирается и выгружает `packages/types/openapi.json`
   (спека коммитится — изменения контрактов видны в PR)
2. `openapi-typescript` генерирует `packages/types/src/generated/schema.ts`
3. Фронт импортирует типы из `@sto/types`, например:

```ts
import type { HealthResponse } from '@sto/types';
```

После изменения DTO/контроллеров в api запусти `pnpm gen:types` — типы на фронте
перестанут сходиться до тех пор, пока код не приведён к новым контрактам.

Swagger UI в dev-режиме: http://localhost:3002/docs

## Docker

```bash
pnpm db:up        # только PostgreSQL (для локальной разработки)
pnpm docker:full  # полный стек: db + api + web + admin (сборка образов)
pnpm docker:down  # остановить всё
```

Образы собираются из Dockerfile в каждом приложении (multi-stage, pnpm deploy).
