import express from "express";
import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { reportSchema, nearQuerySchema, objectIdParam } from "../validators/schemas.js";
import {
  createReport,
  getNearbyReports,
  getMyReports,
  deleteReport,
} from "../controllers/report.controller.js";

const router = express.Router();

router.post("/", protect, validate({ body: reportSchema }), createReport);
router.get("/nearby", protect, validate({ query: nearQuerySchema }), getNearbyReports);
router.get("/mine", protect, getMyReports);
router.delete("/:id", protect, validate({ params: objectIdParam }), deleteReport);

export default router;
