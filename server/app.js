import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import contactRoutes from "./routes/contact.route.js";
import journeyRoutes from "./routes/journey.route.js";
import sosRoutes from "./routes/sos.routes.js";
import locationRoutes from "./routes/location.route.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

// Middleware
app.use(cors());                 // allow React frontend to communicate with the backend.
app.use(express.json());        // Allows Express to understand JSON( front end sends json file for eg { "email":"", "password": "12345"})

app.use(morgan("dev"));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/journey", journeyRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/user", userRoutes);

// Test Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to SafeHer API ",
  });
});

export default app;