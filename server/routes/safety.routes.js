import express from "express";
import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { safetyLimiter } from "../middleware/rateLimit.middleware.js";
import { nearQuerySchema, routesQuerySchema } from "../validators/schemas.js";
import { getSafetyScore, getSafePlaces, getSafeRoutes } from "../controllers/safety.controller.js";

const router = express.Router();

router.use(protect, safetyLimiter);

router.get("/score", validate({ query: nearQuerySchema }), getSafetyScore);
router.get("/places", validate({ query: nearQuerySchema }), getSafePlaces);
router.get("/routes", validate({ query: routesQuerySchema }), getSafeRoutes);

export default router;
