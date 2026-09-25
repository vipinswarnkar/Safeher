// Load .env before anything else, so every module sees the variables
import "dotenv/config";
import http from "node:http";

import app, { allowedOrigins } from "./app.js";
import connectDB from "./database/db.js";
import { initSocket } from "./socket.js";

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;

// One HTTP server for both the REST API and Socket.IO (live tracking)
const server = http.createServer(app);
initSocket(server, allowedOrigins);

server.listen(PORT, () => {
  console.log(` Server is running on http://localhost:${PORT}`);
});
