import express from "express";
import {
  updateLocation,
  getLatestLocation,
} from "../controllers/location.controller.js";

import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/update", protect, updateLocation);

router.get("/latest", protect, getLatestLocation);

export default router;