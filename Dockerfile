FROM oven/bun:1.4.4-alpine AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:1.4.4-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV UPLOAD_DIR=/data/uploads

RUN addgroup -S app && adduser -S -G app app \
  && mkdir -p /data/uploads \
  && chown -R app:app /data

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY --from=build /app/.output ./.output
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts ./scripts

USER app
EXPOSE 3000

CMD ["sh", "-c", "bun scripts/migrate.ts && bun .output/server/index.mjs"]
