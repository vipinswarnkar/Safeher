import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import contactRoutes from "./routes/contact.route.js";

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

// Test Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to SafeHer API ",
  });
});

export default app;