import express from "express";
import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { locationUpdateSchema } from "../validators/schemas.js";
import { updateLocation, getLatestLocation } from "../controllers/location.controller.js";

const router = express.Router();

router.post("/update", protect, validate({ body: locationUpdateSchema }), updateLocation);
router.get("/latest", protect, getLatestLocation);

export default router;
