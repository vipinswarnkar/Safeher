import { distanceMeters, distanceToRouteMeters } from "../utils/geo.js";

/*
 * Smart safety alerts during an active journey.
 * Runs on every location update and flags situations worth an "Are you OK?":
 *
 *   off_route   - more than 250 m away from the route she picked
 *   stopped     - hasn't moved more than 60 m for 10+ minutes (not at destination)
 *   overdue     - well past the expected arrival time and not there yet
 *   unsafe_area - current area safety score is below 40
 *
 * Each alert type has a cooldown so she isn't nagged repeatedly.
 */

export const ALERT_RULES = {
  OFF_ROUTE_M: 250,
  MAX_GPS_ACCURACY_M: 100, // ignore off-route checks when GPS is this inaccurate
  STOP_RADIUS_M: 60,
  STOP_MINUTES: 10,
  ARRIVAL_RADIUS_M: 150,
  OVERDUE_FACTOR: 1.3,
  OVERDUE_GRACE_MIN: 10,
  UNSAFE_SCORE: 40,
  COOLDOWN_MIN: { off_route: 10, stopped: 15, overdue: 15, unsafe_area: 30 },
};

const MIN = 60 * 1000;

export const ALERT_MESSAGES = {
  off_route: "You seem to have left your planned route.",
  stopped: "You haven't moved for over 10 minutes.",
  overdue: "You're taking longer than expected to arrive.",
  unsafe_area: "You're entering an area with recent safety reports. Stay alert.",
};

// Alerts that need a reply ("I'm OK") before auto-SOS
export const CHECK_IN_TYPES = ["off_route", "stopped", "overdue"];

/*
 * Pure function: returns { alerts, arrived }.
 *   journey:         { startedAt, plannedRoute, expectedDurationSec, destinationLocation, alerts }
 *   current:         { latitude, longitude, accuracy }
 *   recentLocations: this journey's locations from the last ~12 min, oldest first
 *   areaScore:       number or null
 */
export function evaluateJourney({ journey, current, recentLocations = [], areaScore = null, now = new Date() }) {
  const found = [];

  const destination = journey.destinationLocation?.latitude != null ? journey.destinationLocation : null;
  const distanceToDestination = destination ? distanceMeters(current, destination) : null;
  const arrived = distanceToDestination != null && distanceToDestination <= ALERT_RULES.ARRIVAL_RADIUS_M;

  // Off route
  const route = journey.plannedRoute;
  const goodFix = current.accuracy == null || current.accuracy <= ALERT_RULES.MAX_GPS_ACCURACY_M;
  if (!arrived && goodFix && Array.isArray(route) && route.length > 1) {
    const offBy = distanceToRouteMeters(current, route);
    if (offBy > ALERT_RULES.OFF_ROUTE_M) found.push({ type: "off_route", distanceMeters: Math.round(offBy) });
  }

  // Stopped for too long
  const windowStart = now.getTime() - ALERT_RULES.STOP_MINUTES * MIN;
  const oldest = recentLocations[0];
  if (
    !arrived &&
    oldest &&
    new Date(oldest.createdAt).getTime() <= windowStart + MIN && // we have ~10 min of history
    recentLocations.every((l) => distanceMeters(l, current) <= ALERT_RULES.STOP_RADIUS_M)
  ) {
    found.push({ type: "stopped" });
  }

  // Overdue
  if (!arrived && journey.expectedDurationSec) {
    const allowedMs =
      journey.expectedDurationSec * 1000 * ALERT_RULES.OVERDUE_FACTOR + ALERT_RULES.OVERDUE_GRACE_MIN * MIN;
    if (now - new Date(journey.startedAt) > allowedMs) found.push({ type: "overdue" });
  }

  // Unsafe area
  if (areaScore != null && areaScore < ALERT_RULES.UNSAFE_SCORE) {
    found.push({ type: "unsafe_area", score: areaScore });
  }

  // Apply cooldowns using the journey's alert history
  const history = journey.alerts || [];
  const alerts = found
    .filter((alert) => {
      const cooldown = (ALERT_RULES.COOLDOWN_MIN[alert.type] ?? 15) * MIN;
      return !history.some((h) => h.type === alert.type && now - new Date(h.at) < cooldown);
    })
    .map((alert) => ({
      ...alert,
      message: ALERT_MESSAGES[alert.type],
      requiresCheckIn: CHECK_IN_TYPES.includes(alert.type),
    }));

  return { alerts, arrived, distanceToDestination: distanceToDestination == null ? null : Math.round(distanceToDestination) };
}
