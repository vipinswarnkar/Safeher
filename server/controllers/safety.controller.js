import ApiError from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { getAreaSafety, scoreRoutes } from "../services/safety.service.js";
import { findSafePlacesNear } from "../services/places.service.js";
import { getRouteAlternatives } from "../services/routing.service.js";
import { distanceMeters } from "../utils/geo.js";

// GET /api/safety/score?lat=&lng=
export const getSafetyScore = async (req, res) => {
  const { lat, lng } = req.validQuery;
  const safety = await getAreaSafety({ latitude: lat, longitude: lng });
  return sendSuccess(res, { safety });
};

// GET /api/safety/places?lat=&lng=&radius=
export const getSafePlaces = async (req, res) => {
  const { lat, lng, radius } = req.validQuery;
  const places = await findSafePlacesNear({ latitude: lat, longitude: lng }, radius);

  if (places === null) {
    // External map service down: tell the app instead of pretending there's nothing
    return sendSuccess(res, { available: false, places: [] });
  }
  return sendSuccess(res, { available: true, count: places.length, places: places.slice(0, 40) });
};

// GET /api/safety/routes?fromLat=&fromLng=&toLat=&toLng=&mode=foot
export const getSafeRoutes = async (req, res) => {
  const { fromLat, fromLng, toLat, toLng, mode } = req.validQuery;
  const from = { latitude: fromLat, longitude: fromLng };
  const to = { latitude: toLat, longitude: toLng };

  const straightLine = distanceMeters(from, to);
  if (straightLine < 50) throw ApiError.badRequest("You're already at the destination");
  if (straightLine > 150000) throw ApiError.badRequest("Destination is too far for route planning (150 km max)");

  let alternatives;
  try {
    alternatives = await getRouteAlternatives(from, to, mode);
  } catch (error) {
    console.warn("[routes] routing service failed:", error.message);
    throw new ApiError(503, "Route service is unavailable right now. You can still start the journey.");
  }

  if (alternatives.length === 0) throw ApiError.notFound("No route found to this destination");

  const result = await scoreRoutes(alternatives);
  return sendSuccess(res, { mode, ...result });
};
