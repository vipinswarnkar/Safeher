import { test } from "node:test";
import assert from "node:assert/strict";
import { scorePoint, scoreRoute, recommendRoute, isNightTime, SCORING } from "../services/safety.service.js";

// 11:30 am and 10:30 pm in India
const DAY = new Date("2026-09-25T06:00:00Z");
const NIGHT = new Date("2026-09-25T17:00:00Z");
const here = { latitude: 19.0, longitude: 72.8 };
const daysAgo = (n, from = DAY) => new Date(from.getTime() - n * 864e5);
const harassment = (overrides = {}) => ({
  kind: "report",
  type: "harassment",
  severity: 3,
  latitude: 19.0005,
  longitude: 72.8,
  createdAt: daysAgo(2),
  ...overrides,
});

test("night detection uses India time", () => {
  assert.equal(isNightTime(DAY), false);
  assert.equal(isNightTime(NIGHT), true);
});

test("no data: base score by day, lower at night", () => {
  assert.equal(scorePoint({ point: here, now: DAY }).score, SCORING.BASE);
  assert.equal(scorePoint({ point: here, now: NIGHT }).score, SCORING.BASE - SCORING.NIGHT_PENALTY);
});

test("a recent severe incident nearby lowers the score and explains why", () => {
  const result = scorePoint({ point: here, incidents: [harassment()], now: DAY });
  assert.ok(result.score < 65, `got ${result.score}`);
  assert.equal(result.nearbyIncidents, 1);
  assert.match(result.factors[0].text, /harassment/);
});

test("old and far-away incidents are ignored", () => {
  const old = harassment({ createdAt: daysAgo(200) });
  const far = harassment({ latitude: 19.01 }); // ~1 km away
  assert.equal(scorePoint({ point: here, incidents: [old, far], now: DAY }).score, SCORING.BASE);
});

test("recent incidents weigh more than older ones", () => {
  const recent = scorePoint({ point: here, incidents: [harassment()], now: DAY }).score;
  const older = scorePoint({ point: here, incidents: [harassment({ createdAt: daysAgo(60) })], now: DAY }).score;
  assert.ok(older > recent);
});

test("a police station nearby raises the score", () => {
  const police = [{ latitude: 19.0008, longitude: 72.8, category: "police", name: "Police Station" }];
  const without = scorePoint({ point: here, incidents: [harassment()], places: [], now: DAY }).score;
  const withPolice = scorePoint({ point: here, incidents: [harassment()], places: police, now: DAY }).score;
  assert.ok(withPolice > without);
});

test("score is always between 0 and 100", () => {
  const many = Array.from({ length: 30 }, () => harassment());
  assert.equal(scorePoint({ point: here, incidents: many, now: NIGHT }).score, 0);
});

test("scoreRoute: a route through incidents scores lower than a clean one", () => {
  const through = scoreRoute({ coordinates: [[72.8, 19.0], [72.8, 19.01]], incidents: [harassment()], now: DAY });
  const clean = scoreRoute({ coordinates: [[72.81, 19.0], [72.81, 19.01]], incidents: [harassment()], now: DAY });
  assert.ok(through.safetyScore < clean.safetyScore);
  assert.ok(through.riskyPoints.length >= 0);
});

test("recommendRoute: picks the safer route when it is clearly safer", () => {
  const rec = recommendRoute([
    { durationSec: 600, safetyScore: 50 },
    { durationSec: 780, safetyScore: 75 },
  ]);
  assert.equal(rec.recommendedIndex, 1);
  assert.equal(rec.fastestIndex, 0);
  assert.match(rec.reason, /3 min longer/);
});

test("recommendRoute: keeps the fastest route when the gain is tiny", () => {
  const rec = recommendRoute([
    { durationSec: 600, safetyScore: 70 },
    { durationSec: 900, safetyScore: 73 },
  ]);
  assert.equal(rec.recommendedIndex, 0);
});
