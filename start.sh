#!/bin/sh
if [ "$1" = "socket" ]; then
    echo "🚀 Starting Socket Server..."
    exec node server/index.js
else
    echo "🎬 Starting Frontend..."
    # Next.js standalone entrypoint
    exec node server.js
fi