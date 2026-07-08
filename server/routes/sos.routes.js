import express from "express";
import { triggerSOS, getSOSHistory } from "../controllers/sos.controller.js";
import protect from "../middleware/auth.middleware.js";
import { resolveSOS } from "../controllers/sos.controller.js";

const router = express.Router();

// Trigger SOS
router.post("/trigger", protect, triggerSOS);
// Get SOS History
router.get("/history", protect, getSOSHistory);

router.patch("/resolve/:id", protect, resolveSOS);

export default router;