const { PeerServer } = require("peer");

const PORT = process.env.PORT || 9000;

const peerServer = PeerServer({
  port: PORT,
  path: "/",
  allow_discovery: false,
  proxied: true,
  corsOptions: {
    origin: "*",
  },
});

peerServer.on("connection", (client) => {
  console.log(`[PeerJS] Client connected: ${client.getId()}`);
});

peerServer.on("disconnect", (client) => {
  console.log(`[PeerJS] Client disconnected: ${client.getId()}`);
});

console.log(`[PeerJS] Server running on port ${PORT}`);
