import express from "express";
import { triggerSOS, getSOSHistory } from "../controllers/sos.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

// Trigger SOS
router.post("/trigger", protect, triggerSOS);
// Get SOS History
router.get("/history", protect, getSOSHistory);

export default router;