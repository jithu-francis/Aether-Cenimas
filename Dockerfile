# ── Stage 1: Dependencies ─────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Builder ──────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NODE_ENV=production

# RAM-optimized build for 1GB VPS
RUN NODE_OPTIONS="--max-old-space-size=768" npm run build

# ── Stage 3: Runner ──────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy Next.js Standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Socket Server & ALL dependencies (Fixes 'accepts' error)
COPY --from=builder /app/server ./server
COPY --from=deps /app/node_modules ./node_modules

COPY start.sh ./start.sh
RUN chmod +x ./start.sh && mkdir -p /app/movies && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000 8010

CMD ["./start.sh"]