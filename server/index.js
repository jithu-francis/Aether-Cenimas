const { Server } = require("socket.io");
const http = require("http");

const PORT = process.env.WS_PORT || 8010;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

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
    origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN.split(","),
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
  socket.on("viewer:join", (data) => {
    viewers.set(socket.id, { name: data.name || "Guest", joinedAt: new Date() });
    broadcastViewers();
  });

  socket.on("sync:initiate", (data) => {
    syncState = { active: true, masterTime: data.time, isPlaying: data.isPlaying };
    io.emit("sync:state", syncState);
  });

  socket.on("sync:play", (data) => {
    syncState.isPlaying = true;
    socket.broadcast.emit("sync:play", data);
  });

  socket.on("sync:pause", (data) => {
    syncState.isPlaying = false;
    socket.broadcast.emit("sync:pause", data);
  });

  socket.on("sync:seek", (data) => {
    syncState.masterTime = data.time;
    socket.broadcast.emit("sync:seek", data);
  });

  socket.on("chat:message", (data) => {
    const v = viewers.get(socket.id);
    io.emit("chat:message", { name: v?.name || "Guest", text: data.text });
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