import express from "express";
import { startJourney , getActiveJourney, endJourney, getJourneyHistory} from "../controllers/journey.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

// Start Journey
router.post("/start", protect, startJourney);
router.get("/active", protect, getActiveJourney)
router.patch("/end/:id", protect, endJourney)
router.get("/history", protect, getJourneyHistory)

export default router;