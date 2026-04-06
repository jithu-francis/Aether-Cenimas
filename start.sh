#!/bin/sh
# ═══════════════════════════════════════════════════
# Aether Cinema — Entrypoint
# Starts both Next.js server and Socket.io server
# ═══════════════════════════════════════════════════

echo ""
echo "  🎬 Aether Cinema Starting..."
echo "  ├─ Next.js on port 3000"
echo "  ├─ Socket.io on port 8010"
echo "  └─ Movie path: ${MOVIE_PATH:-/app/movies/movie.mp4}"
echo ""

# Start Socket.io server in background
node server/index.js &

# Start Next.js server (foreground)
node server.js
