#!/bin/sh
# ═══════════════════════════════════════════════════
# Aether Cinema — Frontend Entrypoint
# Socket server now runs in its own container
# ═══════════════════════════════════════════════════

echo ""
echo "  🎬 Aether Cinema Frontend Starting..."
echo "  ├─ Next.js on port 3000"
echo "  └─ Movie path: ${MOVIE_PATH:-/app/movies/movie.mp4}"
echo ""

# Start Next.js server (foreground)
node server.js
