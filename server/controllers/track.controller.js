import Journey from "../models/journey.js";
import Location from "../models/location.js";
import User from "../models/user.js";
import ApiError from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

// After a journey ends the link keeps working for this long, then hides location
const VISIBLE_AFTER_END_MS = 2 * 60 * 60 * 1000;

// GET /api/track/:token  (public, no login: this is what trusted contacts open)
export const getTrackedJourney = async (req, res) => {
  const { token } = req.params;
  if (typeof token !== "string" || token.length < 16 || token.length > 64) {
    throw ApiError.notFound("Tracking link not found");
  }

  const journey = await Journey.findOne({ shareToken: token }).lean();
  if (!journey) throw ApiError.notFound("Tracking link not found or expired");

  const owner = await User.findById(journey.user).select("name").lean();
  const firstName = owner?.name?.split(" ")[0] || "Your contact";

  const ended = journey.status !== "active";
  const expired = ended && journey.endedAt && Date.now() - new Date(journey.endedAt) > VISIBLE_AFTER_END_MS;

  const base = {
    name: firstName,
    destination: journey.destination,
    status: journey.status,
    startedAt: journey.startedAt,
    endedAt: journey.endedAt ?? null,
    expectedArrival: journey.expectedDurationSec
      ? new Date(new Date(journey.startedAt).getTime() + journey.expectedDurationSec * 1000)
      : null,
    lastCheckInAt: journey.lastCheckInAt ?? null,
  };

  if (expired) {
    // Privacy: don't keep showing someone's movements after the trip
    return sendSuccess(res, { journey: { ...base, expired: true, path: [], latest: null } });
  }

  const points = await Location.find({ journey: journey._id })
    .sort({ createdAt: -1 })
    .limit(300)
    .select("latitude longitude createdAt -_id")
    .lean();
  points.reverse();

  return sendSuccess(res, {
    journey: {
      ...base,
      expired: false,
      destinationLocation: journey.destinationLocation ?? null,
      plannedRoute: journey.plannedRoute ?? null,
      path: points.map((p) => [p.longitude, p.latitude]),
      latest: points.length ? points[points.length - 1] : null,
    },
  });
};
