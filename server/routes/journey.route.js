import express from "express";
import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { startJourneySchema, checkInSchema, objectIdParam } from "../validators/schemas.js";
import {
  startJourney,
  getActiveJourney,
  endJourney,
  checkIn,
  getJourneyHistory,
} from "../controllers/journey.controller.js";

const router = express.Router();

router.post("/start", protect, validate({ body: startJourneySchema }), startJourney);
router.get("/active", protect, getActiveJourney);
router.patch("/end/:id", protect, validate({ params: objectIdParam }), endJourney);
router.post("/:id/check-in", protect, validate({ params: objectIdParam, body: checkInSchema }), checkIn);
router.get("/history", protect, getJourneyHistory);

export default router;
