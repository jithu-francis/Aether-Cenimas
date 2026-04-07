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
    const name = data.name || "Guest";
    viewers.set(socket.id, { name, joinedAt: new Date() });
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
    syncState.isPlaying = false;
    socket.broadcast.emit("sync:pause", { ...data, name: v?.name || "Someone" });
  });

  socket.on("sync:seek", (data) => {
    const v = viewers.get(socket.id);
    syncState.masterTime = data.time;
    socket.broadcast.emit("sync:seek", { ...data, name: v?.name || "Someone" });
  });

  socket.on("sync:request-state", () => {
    socket.emit("sync:state", syncState);
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