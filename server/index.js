const { Server } = require("socket.io");
const http = require("http");

const PORT = process.env.WS_PORT || 8010;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

const httpServer = http.createServer((req, res) => {
  // Health check endpoint
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ 
      status: "ok", 
      uptime: process.uptime(),
      connections: io.engine.clientsCount,
      memory: process.memoryUsage()
    }));
    return;
  }

  // Only return 404 if it's not a socket.io request
  if (!req.url.startsWith("/socket.io")) {
    res.writeHead(404);
    res.end();
  }
});

const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN.split(","),
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ═══════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════
const viewers = new Map(); // socketId → { name, joinedAt }
let syncState = {
  active: false,
  masterTime: 0,
  isPlaying: false,
  lastUpdatedBy: null,
};

// ═══════════════════════════════════════════════════
// Connection Handler
// ═══════════════════════════════════════════════════
io.on("connection", (socket) => {
  console.log(`[Connect] ${socket.id}`);

  // ── Viewer Registration ──────────────────────────
  socket.on("viewer:join", (data) => {
    const { name } = data;
    viewers.set(socket.id, {
      name: name || "Anonymous",
      joinedAt: new Date().toISOString(),
    });
    console.log(`[Viewer] ${name} joined (${viewers.size} total)`);
    broadcastViewers();
  });

  // ── Disconnect ──────────────────────────────────
  socket.on("disconnect", () => {
    const viewer = viewers.get(socket.id);
    if (viewer) {
      console.log(`[Disconnect] ${viewer.name} left`);
      viewers.delete(socket.id);
      broadcastViewers();
    }
  });

  // ═══════════════════════════════════════════════
  // Sync Engine
  // ═══════════════════════════════════════════════

  // Initiate sync — sender's time becomes master time
  socket.on("sync:initiate", (data) => {
    const viewer = viewers.get(socket.id);
    const name = viewer?.name || "Someone";
    syncState = {
      active: true,
      masterTime: data.time || 0,
      isPlaying: data.isPlaying || false,
      lastUpdatedBy: name,
    };
    console.log(`[Sync] ${name} initiated sync at ${data.time}s`);
    io.emit("sync:state", { ...syncState, initiatedBy: name });
  });

  // Stop sync
  socket.on("sync:stop", () => {
    const viewer = viewers.get(socket.id);
    const name = viewer?.name || "Someone";
    syncState.active = false;
    console.log(`[Sync] ${name} stopped sync`);
    io.emit("sync:state", { ...syncState, stoppedBy: name });
  });

  // Play event
  socket.on("sync:play", (data) => {
    if (!syncState.active) return;
    const viewer = viewers.get(socket.id);
    const name = viewer?.name || "Someone";
    syncState.isPlaying = true;
    syncState.masterTime = data.time || syncState.masterTime;
    syncState.lastUpdatedBy = name;
    console.log(`[Sync] ${name} played at ${data.time}s`);
    socket.broadcast.emit("sync:play", { name, time: data.time });
  });

  // Pause event
  socket.on("sync:pause", (data) => {
    if (!syncState.active) return;
    const viewer = viewers.get(socket.id);
    const name = viewer?.name || "Someone";
    syncState.isPlaying = false;
    syncState.masterTime = data.time || syncState.masterTime;
    syncState.lastUpdatedBy = name;
    console.log(`[Sync] ${name} paused at ${data.time}s`);
    socket.broadcast.emit("sync:pause", { name, time: data.time });
  });

  // Seek event
  socket.on("sync:seek", (data) => {
    if (!syncState.active) return;
    const viewer = viewers.get(socket.id);
    const name = viewer?.name || "Someone";
    syncState.masterTime = data.time;
    syncState.lastUpdatedBy = name;
    console.log(`[Sync] ${name} seeked to ${data.time}s`);
    socket.broadcast.emit("sync:seek", { name, time: data.time });
  });

  // Request current sync state (for new joiners)
  socket.on("sync:request-state", () => {
    socket.emit("sync:state", syncState);
  });

  // ═══════════════════════════════════════════════
  // Chat Engine (Ephemeral)
  // ═══════════════════════════════════════════════
    socket.on("chat:message", (data) => {
    const viewer = viewers.get(socket.id);
    const name = viewer?.name || "Someone";
    const message = {
      id: `${socket.id}-${Date.now()}`,
      name,
      text: data.text,
      timestamp: new Date().toISOString(),
    };
    console.log(`[Chat] ${name}: ${data.text}`);
    io.emit("chat:message", message);
  });

  // ── Reaction Engine ─────────────────────────────
  socket.on("reaction:send", (data) => {
    const viewer = viewers.get(socket.id);
    const name = viewer?.name || "Someone";
    const reaction = {
      id: `react-${socket.id}-${Date.now()}`,
      emoji: data.emoji,
      from: name,
    };
    // Broadcast to everyone INCLUDING sender for immediate feedback
    io.emit("reaction:receive", reaction);
  });
});

// ═══════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════
function broadcastViewers() {
  const viewerList = Array.from(viewers.entries()).map(([id, v]) => ({
    id,
    name: v.name,
    joinedAt: v.joinedAt,
  }));
  io.emit("viewers:list", viewerList);
}

// ═══════════════════════════════════════════════════
// Start
// ═══════════════════════════════════════════════════
httpServer.listen(PORT, () => {
  console.log(`\n  ⚡ Aether Cinema WS Server`);
  console.log(`  ├─ Port: ${PORT}`);
  console.log(`  ├─ CORS: ${CORS_ORIGIN}`);
  console.log(`  └─ Ready for connections\n`);
});
