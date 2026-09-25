import Report from "../models/report.js";
import ApiError from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

const MAX_REPORTS_PER_HOUR = 10;

// Public shape: never reveal who reported
const toPublic = (r) => ({
  id: r._id,
  type: r.type,
  severity: r.severity,
  description: r.description,
  latitude: r.location.coordinates[1],
  longitude: r.location.coordinates[0],
  createdAt: r.createdAt,
});

// POST /api/reports
export const createReport = async (req, res) => {
  const { type, severity, description, latitude, longitude } = req.body;

  // Basic spam protection
  const lastHour = await Report.countDocuments({
    user: req.user._id,
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
  });
  if (lastHour >= MAX_REPORTS_PER_HOUR) {
    throw new ApiError(429, "You've reported a lot recently. Please try again later.");
  }

  const report = await Report.create({
    user: req.user._id,
    type,
    severity,
    description,
    location: { type: "Point", coordinates: [longitude, latitude] },
  });

  return sendSuccess(res, { message: "Thanks for reporting. This helps keep others safe.", report: toPublic(report) }, 201);
};

// GET /api/reports/nearby?lat=&lng=&radius=
export const getNearbyReports = async (req, res) => {
  const { lat, lng, radius } = req.validQuery;
  const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

  const reports = await Report.find({
    createdAt: { $gte: since },
    location: {
      $nearSphere: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: radius,
      },
    },
  })
    .limit(300)
    .lean();

  return sendSuccess(res, { count: reports.length, reports: reports.map(toPublic) });
};

// GET /api/reports/mine
export const getMyReports = async (req, res) => {
  const reports = await Report.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100).lean();
  return sendSuccess(res, { count: reports.length, reports: reports.map(toPublic) });
};

// DELETE /api/reports/:id  (only your own)
export const deleteReport = async (req, res) => {
  const report = await Report.findOneAndDelete({ _id: req.validParams.id, user: req.user._id });
  if (!report) throw ApiError.notFound("Report not found");
  return sendSuccess(res, { message: "Report deleted" });
};
