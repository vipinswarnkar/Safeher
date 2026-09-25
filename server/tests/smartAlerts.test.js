import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateJourney } from "../services/smartAlerts.service.js";

const now = new Date("2026-09-25T12:00:00Z");
const MIN = 60000;
const journey = (overrides = {}) => ({
  startedAt: new Date(now - 5 * MIN),
  plannedRoute: [[72.8, 19.0], [72.8, 19.02]],
  expectedDurationSec: 1800,
  destinationLocation: { latitude: 19.02, longitude: 72.8 },
  alerts: [],
  ...overrides,
});
const types = (r) => r.alerts.map((a) => a.type).sort();

test("on route, moving, on time: no alerts", () => {
  const r = evaluateJourney({ journey: journey(), current: { latitude: 19.005, longitude: 72.8, accuracy: 10 }, now });
  assert.deepEqual(r.alerts, []);
});

test("off route by ~500 m triggers off_route with a check-in", () => {
  const r = evaluateJourney({ journey: journey(), current: { latitude: 19.005, longitude: 72.805, accuracy: 10 }, now });
  assert.deepEqual(types(r), ["off_route"]);
  assert.equal(r.alerts[0].requiresCheckIn, true);
});

test("off route is ignored when GPS accuracy is poor", () => {
  const r = evaluateJourney({ journey: journey(), current: { latitude: 19.005, longitude: 72.805, accuracy: 500 }, now });
  assert.deepEqual(r.alerts, []);
});

test("not moving for 10+ minutes triggers stopped", () => {
  const spot = { latitude: 19.005, longitude: 72.8 };
  const recent = [11, 9, 7, 5, 3, 1].map((m) => ({ ...spot, createdAt: new Date(now - m * MIN) }));
  const r = evaluateJourney({ journey: journey(), current: { ...spot, accuracy: 10 }, recentLocations: recent, now });
  assert.deepEqual(types(r), ["stopped"]);
});

test("only 5 minutes of history is not enough to call it stopped", () => {
  const spot = { latitude: 19.005, longitude: 72.8 };
  const recent = [5, 3, 1].map((m) => ({ ...spot, createdAt: new Date(now - m * MIN) }));
  const r = evaluateJourney({ journey: journey(), current: spot, recentLocations: recent, now });
  assert.deepEqual(r.alerts, []);
});

test("well past expected arrival triggers overdue", () => {
  const late = journey({ startedAt: new Date(now - 60 * MIN), expectedDurationSec: 900 });
  const r = evaluateJourney({ journey: late, current: { latitude: 19.005, longitude: 72.8 }, now });
  assert.deepEqual(types(r), ["overdue"]);
});

test("low area score triggers unsafe_area without a check-in", () => {
  const r = evaluateJourney({ journey: journey(), current: { latitude: 19.005, longitude: 72.8 }, areaScore: 30, now });
  assert.deepEqual(types(r), ["unsafe_area"]);
  assert.equal(r.alerts[0].requiresCheckIn, false);
});

test("cooldown: the same alert is not repeated within its window", () => {
  const recentAlert = journey({ alerts: [{ type: "off_route", at: new Date(now - 3 * MIN) }] });
  const r = evaluateJourney({ journey: recentAlert, current: { latitude: 19.005, longitude: 72.805 }, now });
  assert.deepEqual(r.alerts, []);
});

test("near the destination counts as arrived and suppresses alerts", () => {
  const late = journey({ startedAt: new Date(now - 90 * MIN), expectedDurationSec: 600 });
  const r = evaluateJourney({ journey: late, current: { latitude: 19.0195, longitude: 72.8 }, now });
  assert.equal(r.arrived, true);
  assert.deepEqual(r.alerts, []);
});
