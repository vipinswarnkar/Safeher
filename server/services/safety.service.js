import Report from "../models/report.js";
import SOS from "../models/sos.js";
import { PLACE_CATEGORIES, findSafePlacesInBox, findSafePlacesNear } from "./places.service.js";
import { distanceMeters, samplePolyline, boundingBox, bboxAround } from "../utils/geo.js";

/*
 * SafeHer safety score (0-100, higher = safer)
 *
 *   score = BASE - risk * RISK_WEIGHT + safePlacesBonus - nightPenalty
 *
 * risk: every community report / SOS within 300 m adds
 *       severity x recency x closeness
 *       recency halves every 30 days, anything older than 180 days is ignored
 * safePlacesBonus: police, hospitals, stations, 24x7 shops within 400 m (max +15)
 * night (8 pm - 6 am local time): risk counts 30% more and -10 points
 *
 * Every number is explainable, which matters more here than a black-box model.
 */

export const SCORING = {
  BASE: 80,
  RISK_WEIGHT: 9,
  INCIDENT_RADIUS_M: 300,
  HALF_LIFE_DAYS: 30,
  MAX_AGE_DAYS: 180,
  PLACE_RADIUS_M: 400,
  MAX_PLACE_BONUS: 15,
  NIGHT_START_HOUR: 20,
  NIGHT_END_HOUR: 6,
  NIGHT_RISK_MULTIPLIER: 1.3,
  NIGHT_PENALTY: 10,
  SOS_SEVERITY: 2,
};

const DAY_MS = 24 * 60 * 60 * 1000;

const REPORT_LABELS = {
  poor_lighting: "poor lighting",
  harassment: "harassment",
  stalking: "stalking",
  isolated_area: "isolated area",
  unsafe_crowd: "unsafe crowd",
  theft: "theft",
  other: "other issue",
};

// Hour of day where the user is (defaults to India)
export function localHour(now = new Date()) {
  const hour = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    hour12: false,
    timeZone: process.env.SAFETY_TIMEZONE || "Asia/Kolkata",
  }).format(now);
  return Number(hour) % 24;
}

export function isNightTime(now = new Date()) {
  const h = localHour(now);
  return h >= SCORING.NIGHT_START_HOUR || h < SCORING.NIGHT_END_HOUR;
}

export function levelFor(score) {
  if (score >= 70) return { level: "safe", label: "Generally safe" };
  if (score >= 45) return { level: "moderate", label: "Stay alert" };
  return { level: "caution", label: "Be careful" };
}

const recency = (createdAt, now) => {
  const ageDays = (now - new Date(createdAt)) / DAY_MS;
  if (ageDays > SCORING.MAX_AGE_DAYS) return 0;
  return 0.5 ** (Math.max(0, ageDays) / SCORING.HALF_LIFE_DAYS);
};

/*
 * Pure scoring function (no database, easy to unit test).
 * incidents: [{ latitude, longitude, severity, createdAt, kind: "report"|"sos", type? }]
 * places:    [{ latitude, longitude, category, name }] or null if unknown
 */
export function scorePoint({ point, incidents = [], places = null, now = new Date() }) {
  const night = isNightTime(now);

  let risk = 0;
  let nearbyIncidents = 0;
  let recentIncidents = 0;
  const typeCounts = {};

  for (const incident of incidents) {
    const d = distanceMeters(point, incident);
    if (d > SCORING.INCIDENT_RADIUS_M) continue;

    const r = recency(incident.createdAt, now);
    if (r === 0) continue;

    nearbyIncidents += 1;
    if (now - new Date(incident.createdAt) <= 30 * DAY_MS) recentIncidents += 1;

    const key = incident.kind === "sos" ? "sos" : incident.type || "other";
    typeCounts[key] = (typeCounts[key] || 0) + 1;

    const closeness = 1 - d / SCORING.INCIDENT_RADIUS_M;
    risk += incident.severity * r * (0.3 + 0.7 * closeness);
  }

  if (night) risk *= SCORING.NIGHT_RISK_MULTIPLIER;

  let bonus = 0;
  const closestPlaces = [];
  if (Array.isArray(places)) {
    for (const place of places) {
      const d = distanceMeters(point, place);
      if (d > SCORING.PLACE_RADIUS_M) continue;
      const weight = PLACE_CATEGORIES[place.category]?.weight ?? 1;
      bonus += weight * (1 - d / SCORING.PLACE_RADIUS_M);
      closestPlaces.push({ ...place, distanceMeters: Math.round(d) });
    }
    bonus = Math.min(SCORING.MAX_PLACE_BONUS, bonus);
    closestPlaces.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  const raw =
    SCORING.BASE - risk * SCORING.RISK_WEIGHT + bonus - (night ? SCORING.NIGHT_PENALTY : 0);
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  // Human-readable reasons, most important first
  const factors = [];
  if (nearbyIncidents > 0) {
    const top = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([k, n]) => `${n} ${k === "sos" ? "SOS alert" : REPORT_LABELS[k] || k}${n > 1 && k === "sos" ? "s" : ""}`)
      .join(", ");
    factors.push({
      impact: "negative",
      text: `${nearbyIncidents} incident${nearbyIncidents > 1 ? "s" : ""} reported within 300 m (${top})`,
    });
  } else {
    factors.push({ impact: "positive", text: "No incidents reported within 300 m" });
  }
  if (night) factors.push({ impact: "negative", text: "Night time: fewer people around" });
  if (closestPlaces.length > 0) {
    const p = closestPlaces[0];
    factors.push({
      impact: "positive",
      text: `${p.name} ${p.distanceMeters} m away${closestPlaces.length > 1 ? ` (+${closestPlaces.length - 1} more safe places nearby)` : ""}`,
    });
  } else if (Array.isArray(places)) {
    factors.push({ impact: "negative", text: "No police, hospital or 24x7 place within 400 m" });
  }

  return {
    score,
    ...levelFor(score),
    isNight: night,
    nearbyIncidents,
    recentIncidents,
    safePlacesNearby: closestPlaces.length,
    factors,
    // Tell the user when the score rests on little data
    lowData: incidents.length === 0 && !Array.isArray(places),
  };
}

// Score a whole route: sample it every ~150 m and combine the samples.
// Average matters, but so does the worst stretch, so blend both.
export function scoreRoute({ coordinates, incidents = [], places = null, now = new Date() }) {
  const samples = samplePolyline(coordinates, 150);
  if (samples.length === 0) return { safetyScore: 0, riskyPoints: [], minScore: 0 };

  let total = 0;
  let min = 100;
  const riskyPoints = [];

  for (const sample of samples) {
    const { score } = scorePoint({ point: sample, incidents, places, now });
    total += score;
    min = Math.min(min, score);
    if (score < 45 && riskyPoints.length < 20) {
      riskyPoints.push({ latitude: sample.latitude, longitude: sample.longitude, score });
    }
  }

  const average = total / samples.length;
  const safetyScore = Math.round(average * 0.7 + min * 0.3);

  return {
    safetyScore,
    ...levelFor(safetyScore),
    averageScore: Math.round(average),
    minScore: min,
    riskyStretches: riskyPoints.length,
    riskyPoints,
  };
}

/*
 * Pick the route to recommend. Prefer the safest, but if it's barely safer
 * (< 5 points) than the fastest, take the fastest instead.
 */
export function recommendRoute(routes) {
  if (routes.length === 0) return { recommendedIndex: -1, reason: "No routes found" };

  const fastest = routes.reduce((best, r, i) => (r.durationSec < routes[best].durationSec ? i : best), 0);
  const safest = routes.reduce((best, r, i) => (r.safetyScore > routes[best].safetyScore ? i : best), 0);

  if (safest === fastest) {
    return { recommendedIndex: safest, fastestIndex: fastest, reason: "Fastest and safest route" };
  }

  const gain = routes[safest].safetyScore - routes[fastest].safetyScore;
  const extraMin = Math.round((routes[safest].durationSec - routes[fastest].durationSec) / 60);

  if (gain < 5) {
    return {
      recommendedIndex: fastest,
      fastestIndex: fastest,
      reason: "Fastest route; other routes are not meaningfully safer",
    };
  }

  return {
    recommendedIndex: safest,
    fastestIndex: fastest,
    reason: `${extraMin > 0 ? `${extraMin} min longer, but ` : ""}${gain} points safer than the fastest route`,
  };
}

// ---------- database access ----------

// Reports + SOS alerts inside a box, last 180 days, as plain incident objects
export async function loadIncidents(box, now = new Date()) {
  const since = new Date(now.getTime() - SCORING.MAX_AGE_DAYS * DAY_MS);

  const [reports, sosAlerts] = await Promise.all([
    Report.find({
      createdAt: { $gte: since },
      location: {
        $geoWithin: {
          $box: [
            [box.west, box.south],
            [box.east, box.north],
          ],
        },
      },
    })
      .select("type severity location createdAt")
      .limit(2000)
      .lean(),
    SOS.find({
      createdAt: { $gte: since },
      latitude: { $gte: box.south, $lte: box.north },
      longitude: { $gte: box.west, $lte: box.east },
    })
      .select("latitude longitude createdAt")
      .limit(1000)
      .lean(),
  ]);

  return [
    ...reports.map((r) => ({
      kind: "report",
      type: r.type,
      severity: r.severity,
      latitude: r.location.coordinates[1],
      longitude: r.location.coordinates[0],
      createdAt: r.createdAt,
    })),
    ...sosAlerts.map((s) => ({
      kind: "sos",
      severity: SCORING.SOS_SEVERITY,
      latitude: s.latitude,
      longitude: s.longitude,
      createdAt: s.createdAt,
    })),
  ];
}

// Safety score for one spot. includePlaces=false skips the external lookup
// (used for frequent background checks during a journey).
export async function getAreaSafety(point, { includePlaces = true, now = new Date() } = {}) {
  const [incidents, places] = await Promise.all([
    loadIncidents(bboxAround(point, SCORING.INCIDENT_RADIUS_M + 50), now),
    includePlaces ? findSafePlacesNear(point, 800) : Promise.resolve(null),
  ]);

  return {
    ...scorePoint({ point, incidents, places, now }),
    placesAvailable: Array.isArray(places),
  };
}

// Score several candidate routes with one DB query and one places lookup
export async function scoreRoutes(routes, { now = new Date() } = {}) {
  const allPoints = routes.flatMap((r) =>
    r.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }))
  );
  const box = boundingBox(allPoints, SCORING.INCIDENT_RADIUS_M + 50);

  const [incidents, places] = await Promise.all([
    loadIncidents(box, now),
    findSafePlacesInBox(boundingBox(allPoints, SCORING.PLACE_RADIUS_M)),
  ]);

  const scored = routes.map((route) => ({
    ...route,
    ...scoreRoute({ coordinates: route.coordinates, incidents, places, now }),
  }));

  return {
    routes: scored,
    ...recommendRoute(scored),
    placesAvailable: Array.isArray(places),
    isNight: isNightTime(now),
  };
}
