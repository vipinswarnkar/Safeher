import express from "express";
import cors from "cors";
import morgan from "morgan";

const app = express();

// Middleware
app.use(cors()); // allow React frontend to communicate with the backend.
app.use(express.json());
app.use(morgan("dev"));

// Test Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to SafeHer API ",
  });
});

export default app;