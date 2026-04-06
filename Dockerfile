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
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build (Next.js 12+)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy custom server
COPY --from=builder /app/server ./server

# Note: Standalone mode doesn't include the custom server dependencies by default 
# if they are not imported in the Next.js app. We'll copy them manually or 
# assume they are in the node_modules within standalone.
# Actually, we can just use the server/index.js with existing node_modules.

# Copy start script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Create movies directory and set permissions
RUN mkdir -p /app/movies && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000 8010

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["./start.sh"]
