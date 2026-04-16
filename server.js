const express = require("express");
const http = require("http");
const path = require("path");
const { createBareServer } = require("@nebula-services/bare-server-node");

const app = express();
const server = http.createServer(app);
const bareServer = createBareServer("/bare/");

const PORT = process.env.PORT || 3000;

// Handle bare server requests (UV needs this)
server.on("request", (req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

server.on("upgrade", (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head);
  } else {
    socket.destroy();
  }
});

// Serve UV static files (proxy scripts)
app.use("/uv/", express.static(path.join(__dirname, "uv")));

// Serve main site
app.use(express.static(path.join(__dirname, "public")));

// Serve the proxy page
app.get("/proxy", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "proxy.html"));
});

// Fallback to index
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

server.listen(PORT, () => {
  console.log(`Pioneers Rooms running on port ${PORT}`);
});
