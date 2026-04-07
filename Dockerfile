# ═══════════════════════════════════════════════════
# Aether Cinema — Ultra-Lightweight Production Build
# Optimization for 1GB RAM Oracle Cloud Instances
# ═══════════════════════════════════════════════════

# ── Stage 1: Dependencies ─────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Builder ──────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Memory-safe build for 1GB RAM
# Using --max-old-space-size to prevent OOM during webpack compilation
RUN NODE_OPTIONS="--max-old-space-size=768" npm run build

# ── Stage 3: Runner ──────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Production optimizations
RUN apk add --no-cache curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build (Next.js 12+)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy custom server (socket.io server)
COPY --from=builder /app/server ./server

# Socket.io deps — standalone build doesn't trace server/index.js imports,
# so we copy the required packages explicitly for the socket container.
COPY --from=deps /app/node_modules/socket.io ./node_modules/socket.io
COPY --from=deps /app/node_modules/@socket.io ./node_modules/@socket.io
COPY --from=deps /app/node_modules/engine.io ./node_modules/engine.io
COPY --from=deps /app/node_modules/engine.io-parser ./node_modules/engine.io-parser
COPY --from=deps /app/node_modules/socket.io-adapter ./node_modules/socket.io-adapter
COPY --from=deps /app/node_modules/socket.io-parser ./node_modules/socket.io-parser
COPY --from=deps /app/node_modules/ws ./node_modules/ws
COPY --from=deps /app/node_modules/cors ./node_modules/cors
COPY --from=deps /app/node_modules/debug ./node_modules/debug
COPY --from=deps /app/node_modules/ms ./node_modules/ms
COPY --from=deps /app/node_modules/base64id ./node_modules/base64id
COPY --from=deps /app/node_modules/cookie ./node_modules/cookie
COPY --from=deps /app/node_modules/vary ./node_modules/vary
COPY --from=deps /app/node_modules/object-assign ./node_modules/object-assign

# Copy start script (frontend entrypoint)
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Create movies directory and set permissions
RUN mkdir -p /app/movies && \
    chown -R nextjs:nodejs /app

USER nextjs

# Frontend exposes 3000, socket container exposes 8010
EXPOSE 3000 8010

# Default health check targets the frontend
HEALTHCHECK --interval=15s --timeout=5s --start-period=45s --retries=5 \
  CMD curl -f http://localhost:3000 || exit 1

# Default: start frontend. Socket container overrides via docker-compose command.
CMD ["./start.sh"]
