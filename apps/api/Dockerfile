FROM node:24-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/api/prisma.config.ts apps/api/
COPY apps/api/prisma apps/api/prisma
COPY packages/types/package.json packages/types/
COPY packages/ui/package.json packages/ui/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @sto/api... build

FROM build AS deploy
RUN npm_config_ignore_scripts=true pnpm deploy --filter=@sto/api --legacy --prod /app \
  && cp -r apps/api/dist /app/dist

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deploy /app ./
EXPOSE 3002
CMD ["node", "dist/src/main.js"]
