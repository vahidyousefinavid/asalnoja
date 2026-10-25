# syntax=docker/dockerfile:1
# ساخت چندمرحله‌ای؛ build بدون دسترسی به دیتابیس انجام می‌شود (NO_DB_AT_BUILD)
ARG NODE_IMAGE=node:22-alpine

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
# رجیستری npm از بعضی سرورهای داخل ایران در دسترس نیست؛ قابل تغییر با --build-arg
ARG NPM_REGISTRY=https://registry.npmjs.org
COPY package.json package-lock.json ./
RUN npm config set registry "$NPM_REGISTRY" \
 && npm config set fetch-retries 5 \
 && npm ci --no-audit --no-fund

FROM ${NODE_IMAGE} AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    NO_DB_AT_BUILD=1 \
    NODE_OPTIONS=--max-old-space-size=1280
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# اجرای migration و داده اولیه: docker compose run --rm setup
FROM builder AS setup
ENV NO_DB_AT_BUILD=0
CMD ["npx", "tsx", "scripts/seed.ts"]

FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs \
 && mkdir -p /app/storage/uploads && chown -R nextjs:nodejs /app/storage
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/robots.txt || exit 1
CMD ["node", "server.js"]
