require('dotenv').config();
const { Server } = require("socket.io");
const http = require("http");
const { jwtVerify } = require("jose");
const cookie = require("cookie");

const PORT = process.env.WS_PORT || 8010;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "aether-cinema-default-secret-key-32"
);

const httpServer = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", connections: io.engine.clientsCount }));
    return;
  }
  if (!req.url.startsWith("/socket.io")) {
    res.writeHead(404);
    res.end();
  }
});

const io = new Server(httpServer, {
  cors: {
    origin: true, // Allow reflective origin for easier local network testing
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// --- State Management ---
const viewers = new Map();
let syncState = { active: false, masterTime: 0, isPlaying: false };

io.on("connection", (socket) => {
  socket.on("viewer:join", async (data) => {
    // Parse JWT from cookie in handshake
    const cookies = cookie.parse(socket.handshake.headers.cookie || "");
    const token = cookies["aether-session"];
    
    let name = data.name || "Guest";
    let isAuthenticated = false;

    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        name = payload.name;
        isAuthenticated = true;
      } catch (error) {
        console.error(`[Auth] Invalid token from ${socket.id}:`, error.message);
      }
    }

    if (!isAuthenticated) {
      console.log(`[Join Denied] Unauthenticated connection: ${socket.id}`);
      socket.emit("auth:error", { message: "Authentication required" });
      return;
    }

    viewers.set(socket.id, { id: socket.id, name, joinedAt: new Date(), isAuthenticated });
    console.log(`[Join] ${name} (${socket.id}) - Total: ${viewers.size}`);
    broadcastViewers();
  });

  socket.on("sync:initiate", (data) => {
    const v = viewers.get(socket.id);
    const name = v?.name || "Someone";
    syncState = { 
      active: true, 
      masterTime: data.time, 
      isPlaying: data.isPlaying,
      initiatedBy: name
    };
    console.log(`[Sync Start] by ${name} at ${data.time}s`);
    io.emit("sync:state", syncState);
  });

  socket.on("sync:stop", () => {
    const v = viewers.get(socket.id);
    const name = v?.name || "Someone";
    syncState.active = false;
    console.log(`[Sync Stop] by ${name}`);
    io.emit("sync:state", { ...syncState, stoppedBy: name });
  });

  socket.on("sync:play", (data) => {
    const v = viewers.get(socket.id);
    const name = v?.name || "Someone";
    syncState.isPlaying = true;
    console.log(`[Sync Play] by ${name}`);
    socket.broadcast.emit("sync:play", { ...data, name });
  });

  socket.on("sync:pause", (data) => {
    const v = viewers.get(socket.id);
    const name = v?.name || "Someone";
    syncState.isPlaying = false;
    console.log(`[Sync Pause] by ${name}`);
    socket.broadcast.emit("sync:pause", { ...data, name });
  });

  socket.on("sync:seek", (data) => {
    const v = viewers.get(socket.id);
    const name = v?.name || "Someone";
    syncState.masterTime = data.time;
    console.log(`[Sync Seek] by ${name} to ${data.time}s`);
    socket.broadcast.emit("sync:seek", { ...data, name });
  });

  socket.on("sync:request-state", () => {
    socket.emit("sync:state", syncState);
  });

  socket.on("chat:message", (data) => {
    const v = viewers.get(socket.id);
    console.log(`[Chat] ${v?.name || "Guest"}: ${data.text}`);
    io.emit("chat:message", { name: v?.name || "Guest", text: data.text });
  });

  socket.on("reaction:send", (data) => {
    const v = viewers.get(socket.id);
    const name = v?.name || "Someone";
    const reaction = {
      id: `react-${socket.id}-${Date.now()}`,
      emoji: data.emoji,
      from: name,
    };
    io.emit("reaction:receive", reaction);
  });

  socket.on("disconnect", () => {
    viewers.delete(socket.id);
    broadcastViewers();
  });
});

function broadcastViewers() {
  io.emit("viewers:list", Array.from(viewers.values()));
}

// CRITICAL: Listen on 0.0.0.0 for Docker/NPM connectivity
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`⚡ Socket Server live on port ${PORT}`);
});