import express from "express";
import { publicLimiter } from "../middleware/rateLimit.middleware.js";
import { getTrackedJourney } from "../controllers/track.controller.js";

const router = express.Router();

// Public on purpose: contacts open this link without an account
router.get("/:token", publicLimiter, getTrackedJourney);

export default router;
