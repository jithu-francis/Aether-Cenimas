# 🌌 Aether Cinema v2.0

A premium, immersive shared movie-watching experience with real-time synchronization, interactive reactions, and optimized streaming for low-resource environments.

## 🚀 Quick Start

### 1. Environment Setup
Copy the example environment file and fill in your secrets:
```bash
cp .env.example .env
```
> [!IMPORTANT]
> Ensure `NEXT_PUBLIC_WS_URL` matches your server's accessibility (e.g., `http://your-ip:8010` for production).

### 2. Local Development
Install dependencies and start both the Next.js app and the WebSocket server concurrently:
```bash
npm install
npm run dev
```
Accessible at: `http://localhost:3010`

### 3. Production Deployment (Docker)
Optimized for **1GB RAM** instances (like Oracle Cloud).

```bash
docker-compose up -d --build
```

## 🛠️ Key Features
- **Deep Midnight UI**: High-end glassmorphism and ambient cinematic effects.
- **Immersive Fullscreen Chat**: Slide-out chat panel and floating message bubbles that work in fullscreen.
- **Synced Reactions**: Floating emojis that appear for all viewers in real-time.
- **Memory Efficient**: Optimized streaming and build-process specifically for low-RAM servers.

## ⚙️ Environment Variables
| Variable | Description |
| :--- | :--- |
| `STREAM_PASSWORD` | The access code required to join the cinema. |
| `JWT_SECRET` | Secret key for session security. |
| `MOVIE_TITLE` | Display name of the movie. |
| `MOVIE_PATH` | Absolute path to the MP4 file (internal to Docker). |
| `NEXT_PUBLIC_WS_URL` | The public URL of the WebSocket server. |

---
*Built for the ultimate shared cinematic experience.*
