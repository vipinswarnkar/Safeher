import express from "express";
import { registerUser, loginUser, getCurrentUser } from "../controllers/auth.controller.js";
import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";
import { registerSchema, loginSchema } from "../validators/schemas.js";

const router = express.Router();

router.post("/register", authLimiter, validate({ body: registerSchema }), registerUser);
router.post("/login", authLimiter, validate({ body: loginSchema }), loginUser);
router.get("/me", protect, getCurrentUser);

export default router;
