import Location from "../models/location.js";
import Journey from "../models/journey.js";
import ApiError from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { evaluateJourney } from "../services/smartAlerts.service.js";
import { getAreaSafety } from "../services/safety.service.js";
import { emitToTrackers } from "../socket.js";

// POST /api/location/update
// Saves the position, pushes it to anyone watching the tracking link,
// and runs the smart-alert checks for an active journey.
export const updateLocation = async (req, res) => {
  const { latitude, longitude, accuracy, speed } = req.body;
  const now = new Date();

  const activeJourney = await Journey.findOne({ user: req.user._id, status: "active" });

  const location = await Location.create({
    user: req.user._id,
    journey: activeJourney ? activeJourney._id : null,
    latitude,
    longitude,
    accuracy: accuracy ?? 0,
    speed: speed ?? 0,
    mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
  });

  if (!activeJourney) {
    return sendSuccess(res, { message: "Location Updated", location, alerts: [] }, 201);
  }

  // Live tracking page update
  emitToTrackers(activeJourney.shareToken, "track:location", {
    latitude,
    longitude,
    speed: speed ?? null,
    at: location.createdAt,
  });

  // Smart alerts. A failure here must never break location saving.
  let result = { alerts: [], arrived: false, distanceToDestination: null };
  try {
    const [recentLocations, area] = await Promise.all([
      Location.find({
        journey: activeJourney._id,
        createdAt: { $gte: new Date(now.getTime() - 12 * 60 * 1000) },
      })
        .sort({ createdAt: 1 })
        .select("latitude longitude createdAt")
        .lean(),
      // Skip the external places lookup here; this runs often
      getAreaSafety({ latitude, longitude }, { includePlaces: false, now }),
    ]);

    result = evaluateJourney({
      journey: activeJourney,
      current: { latitude, longitude, accuracy },
      recentLocations,
      areaScore: area.score,
      now,
    });

    if (result.alerts.length > 0) {
      activeJourney.alerts.push(
        ...result.alerts.map((a) => ({ type: a.type, message: a.message, at: now }))
      );
      await activeJourney.save();
    }
  } catch (error) {
    console.error("Smart alert check failed:", error.message);
  }

  return sendSuccess(
    res,
    {
      message: "Location Updated",
      location,
      journeyId: activeJourney._id,
      alerts: result.alerts,
      arrived: result.arrived,
      distanceToDestination: result.distanceToDestination,
    },
    201
  );
};

// GET /api/location/latest
export const getLatestLocation = async (req, res) => {
  const location = await Location.findOne({ user: req.user._id }).sort({ createdAt: -1 });
  if (!location) throw ApiError.notFound("Location not found");
  return sendSuccess(res, { location });
};
