import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import contactRoutes from "./routes/contact.route.js";
import journeyRoutes from "./routes/journey.route.js";
import sosRoutes from "./routes/sos.routes.js";
import locationRoutes from "./routes/location.route.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import userRoutes from "./routes/user.routes.js";
import reportRoutes from "./routes/report.routes.js";
import safetyRoutes from "./routes/safety.routes.js";
import trackRoutes from "./routes/track.routes.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";

const app = express();

// Comma-separated list, e.g. "http://localhost:5173,https://safeher.vercel.app"
export const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

// Behind a hosting proxy the real client IP is in X-Forwarded-For;
// rate limiting needs it (set TRUST_PROXY=1 on Render/Railway)
const trustProxy = Number(process.env.TRUST_PROXY ?? (process.env.NODE_ENV === "production" ? 1 : 0));
app.set("trust proxy", trustProxy);

// Security headers
app.use(helmet());

// Allow the React frontend to call the API
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Parse JSON bodies (with a size cap)
app.use(express.json({ limit: "200kb" }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Health check for uptime monitors / Docker / Render
app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "ok", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/journey", journeyRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/user", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/safety", safetyRoutes);
app.use("/api/track", trackRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to SafeHer API",
  });
});

// Must be last
app.use(notFound);
app.use(errorHandler);

export default app;
