import express from "express";
import { triggerSOS, getSOSHistory, resolveSOS } from "../controllers/sos.controller.js";
import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { sosLimiter } from "../middleware/rateLimit.middleware.js";
import { sosSchema, objectIdParam } from "../validators/schemas.js";

const router = express.Router();

router.post("/trigger", protect, sosLimiter, validate({ body: sosSchema }), triggerSOS);
router.get("/history", protect, getSOSHistory);
router.patch("/resolve/:id", protect, validate({ params: objectIdParam }), resolveSOS);

export default router;
