import Journey from "../models/journey.js";
import ApiError from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { createShareToken, trackingUrl } from "../utils/tracking.js";
import { emitToTrackers } from "../socket.js";

// Journey as sent to the owner's app (adds the tracking link)
const withLink = (journey) => {
  const obj = journey.toObject ? journey.toObject() : journey;
  return { ...obj, trackingUrl: trackingUrl(obj.shareToken) };
};

// POST /api/journey/start
export const startJourney = async (req, res) => {
  const activeJourney = await Journey.findOne({ user: req.user._id, status: "active" });
  if (activeJourney) throw ApiError.badRequest("You already have an active journey");

  const journey = await Journey.create({
    ...req.body, // already validated and stripped by zod
    user: req.user._id,
    shareToken: createShareToken(),
  });

  return sendSuccess(res, { message: "Journey started successfully", journey: withLink(journey) }, 201);
};

// GET /api/journey/active
export const getActiveJourney = async (req, res) => {
  const journey = await Journey.findOne({ user: req.user._id, status: "active" });
  if (!journey) throw ApiError.notFound("No active journey found");
  return sendSuccess(res, { journey: withLink(journey) });
};

// PATCH /api/journey/end/:id
export const endJourney = async (req, res) => {
  const journey = await Journey.findOneAndUpdate(
    { _id: req.validParams.id, user: req.user._id, status: "active" },
    { status: "completed", endedAt: new Date() },
    { returnDocument: "after" }
  );

  if (!journey) throw ApiError.notFound("Active journey not found");

  emitToTrackers(journey.shareToken, "track:status", { status: "completed", endedAt: journey.endedAt });

  return sendSuccess(res, { message: "Journey ended successfully", journey: withLink(journey) });
};

// POST /api/journey/:id/check-in   ("I'm OK" reply to a smart alert)
export const checkIn = async (req, res) => {
  const now = new Date();
  const journey = await Journey.findOne({ _id: req.validParams.id, user: req.user._id, status: "active" });
  if (!journey) throw ApiError.notFound("Active journey not found");

  // Mark matching unanswered alerts as answered
  for (const alert of journey.alerts) {
    if (!alert.acknowledgedAt && (req.body.alertType === "manual" || alert.type === req.body.alertType)) {
      alert.acknowledgedAt = now;
    }
  }
  journey.lastCheckInAt = now;
  await journey.save();

  emitToTrackers(journey.shareToken, "track:checkin", { at: now });

  return sendSuccess(res, { message: "Glad you're safe", lastCheckInAt: now });
};

// GET /api/journey/history
export const getJourneyHistory = async (req, res) => {
  const journeys = await Journey.find({ user: req.user._id })
    .select("-plannedRoute -shareToken")
    .sort({ createdAt: -1 })
    .limit(200);

  return sendSuccess(res, { count: journeys.length, journeys });
};
