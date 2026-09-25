import { test } from "node:test";
import assert from "node:assert/strict";
import {
  distanceMeters,
  distanceToRouteMeters,
  samplePolyline,
  boundingBox,
} from "../utils/geo.js";

test("distanceMeters: 0.01 degree of latitude is about 1.1 km", () => {
  const d = distanceMeters({ latitude: 19, longitude: 72.8 }, { latitude: 19.01, longitude: 72.8 });
  assert.ok(Math.abs(d - 1112) < 5, `got ${d}`);
});

test("distanceToRouteMeters: on the route is 0, beside it is the perpendicular distance", () => {
  const route = [[72.8, 19.0], [72.8, 19.01]];
  assert.ok(distanceToRouteMeters({ latitude: 19.005, longitude: 72.8 }, route) < 1);
  const beside = distanceToRouteMeters({ latitude: 19.005, longitude: 72.801 }, route);
  assert.ok(Math.abs(beside - 105) < 3, `got ${beside}`);
});

test("samplePolyline: includes start and end and respects the step", () => {
  const route = [[72.8, 19.0], [72.8, 19.01]];
  const samples = samplePolyline(route, 150);
  assert.deepEqual(samples[0], { latitude: 19.0, longitude: 72.8 });
  assert.deepEqual(samples.at(-1), { latitude: 19.01, longitude: 72.8 });
  assert.equal(samples.length, 9); // 1112 m / 150 m = 7 steps + start + end
});

test("samplePolyline: caps the number of samples on long routes", () => {
  const long = [[72.8, 19.0], [72.8, 20.0]]; // ~111 km
  assert.ok(samplePolyline(long, 150, 200).length <= 202);
});

test("boundingBox: padding grows the box", () => {
  const box = boundingBox([{ latitude: 19, longitude: 72.8 }], 1000);
  assert.ok(box.south < 19 && box.north > 19 && box.west < 72.8 && box.east > 72.8);
});
