FROM oven/bun:latest AS base
WORKDIR /app

FROM base AS deps
COPY bun.lock package.json ./
ENV NODE_ENV=production
RUN bun install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
RUN bun run build

FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

USER bun

COPY --from=builder --chown=bun:bun /app/public ./public
COPY --from=builder --chown=bun:bun /app/.next ./.next
COPY --from=builder --chown=bun:bun /app/node_modules ./node_modules
COPY --from=builder --chown=bun:bun /app/package.json ./package.json

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "run", "start"]
