#syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN apk update && apk add ffmpeg chromium redis

FROM base AS install
RUN apk update && apk add alpine-sdk python3
WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY ./.yarn/ .yarn/
COPY packages/lib/package.json    ./packages/lib/
COPY packages/next/package.json   ./packages/next/
COPY packages/server/package.json ./packages/server/
COPY packages/lib/prisma.config.ts    ./packages/lib/
COPY ./prisma.config.ts    .
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY prisma/models ./prisma/models
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN --mount=type=cache,target=.yarn/cache \
  yarn install --immutable

FROM install AS build
# TODO: Split this up to build some packages in parallel
COPY . .

RUN yarn workspace @repo/lib exec prisma generate

ENV NODE_ENV=production
RUN --mount=type=cache,target=/app/packages/next/.next/cache \
  SKIP_ENV_VALIDATION=1 \
  PUBLIC_URL="http://localhost:3000" \
  yarn run build:all

FROM install AS server_packages

WORKDIR /app/packages/server
RUN yarn workspaces focus @repo/server --production

FROM base
COPY --from=build /app/packages/server/build /app/packages/server/build
COPY --from=server_packages /app/node_modules /app/node_modules
COPY --from=build /app/packages/lib/db/generated/prisma/*.node /app/packages/lib/db/generated/prisma/
COPY --from=build /app/packages/lib/build /app/packages/lib/
COPY --from=build /app/packages/next/.next /app/packages/next/.next
COPY --from=build /app/packages/next/public /app/packages/next/public
COPY --from=build /app/packages/next/next.config.js /app/packages/next/next.config.js
COPY --from=build /app/assets /app/assets

# Copy these in so that we can still run Prisma migrations in prod
COPY --from=build /app/prisma/schema.prisma /app/prisma/schema.prisma
COPY --from=build /app/prisma/models /app/prisma/models
COPY --from=build /app/prisma/migrations /app/prisma/migrations
COPY --from=install /app/prisma.config.ts /app

WORKDIR /app
ENV NODE_ENV=production
ENV PUPPETEER_CHROME_PATH=/usr/bin/chromium
ENV HOSTNAME="0.0.0.0"

COPY --chmod=755 <<EOT /app/entrypoint.sh
#!/bin/sh
set -e
redis-server --daemonize yes && node packages/server/build/index.js
EOT

CMD ["./entrypoint.sh"]