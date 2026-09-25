import express from "express";
import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";
import { updateProfileSchema, changePasswordSchema } from "../validators/schemas.js";
import { getProfile, updateProfile, changePassword } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, validate({ body: updateProfileSchema }), updateProfile);
router.put("/change-password", protect, authLimiter, validate({ body: changePasswordSchema }), changePassword);

export default router;
