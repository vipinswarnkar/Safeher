// Geometry helpers. Points are { latitude, longitude }.
// Route coordinates are GeoJSON style [lng, lat] pairs.

const EARTH_RADIUS_M = 6371000;
const toRad = (deg) => (deg * Math.PI) / 180;

// Great-circle distance in meters (haversine)
export function distanceMeters(a, b) {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export const fromLngLat = ([longitude, latitude]) => ({ latitude, longitude });

// Distance from point p to segment a-b in meters. Uses a flat projection
// around p, which is accurate enough for the few hundred meters we care about.
export function distanceToSegmentMeters(p, a, b) {
  const kx = Math.cos(toRad(p.latitude)) * 111320;
  const ky = 110540;
  const ax = (a.longitude - p.longitude) * kx;
  const ay = (a.latitude - p.latitude) * ky;
  const bx = (b.longitude - p.longitude) * kx;
  const by = (b.latitude - p.latitude) * ky;
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  let t = lengthSq === 0 ? 0 : -(ax * dx + ay * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(ax + t * dx, ay + t * dy);
}

// Shortest distance from a point to a route ([lng, lat][])
export function distanceToRouteMeters(point, coordinates) {
  if (!coordinates || coordinates.length === 0) return Infinity;
  if (coordinates.length === 1) return distanceMeters(point, fromLngLat(coordinates[0]));

  let best = Infinity;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const d = distanceToSegmentMeters(
      point,
      fromLngLat(coordinates[i]),
      fromLngLat(coordinates[i + 1])
    );
    if (d < best) best = d;
  }
  return best;
}

// Points every `stepMeters` along a route, always including start and end.
export function samplePolyline(coordinates, stepMeters = 150, maxSamples = 200) {
  if (!coordinates || coordinates.length === 0) return [];

  const points = coordinates.map(fromLngLat);
  let total = 0;
  for (let i = 1; i < points.length; i++) total += distanceMeters(points[i - 1], points[i]);

  // Grow the step on very long routes so we never exceed maxSamples
  const step = Math.max(stepMeters, total / maxSamples);
  const samples = [points[0]];
  let carried = 0;

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const segment = distanceMeters(a, b);
    let along = step - carried;

    while (along <= segment) {
      const t = along / segment;
      samples.push({
        latitude: a.latitude + (b.latitude - a.latitude) * t,
        longitude: a.longitude + (b.longitude - a.longitude) * t,
      });
      along += step;
    }
    carried = (carried + segment) % step;
  }

  const last = points[points.length - 1];
  const tail = samples[samples.length - 1];
  if (tail.latitude !== last.latitude || tail.longitude !== last.longitude) samples.push(last);
  return samples;
}

// Bounding box around points, grown by paddingMeters on each side
export function boundingBox(points, paddingMeters = 0) {
  let south = Infinity, west = Infinity, north = -Infinity, east = -Infinity;
  for (const p of points) {
    south = Math.min(south, p.latitude);
    north = Math.max(north, p.latitude);
    west = Math.min(west, p.longitude);
    east = Math.max(east, p.longitude);
  }
  const latPad = paddingMeters / 110540;
  const midLat = (south + north) / 2;
  const lngPad = paddingMeters / (111320 * Math.cos(toRad(midLat)) || 1);
  return {
    south: south - latPad,
    west: west - lngPad,
    north: north + latPad,
    east: east + lngPad,
  };
}

export const bboxAround = (point, radiusMeters) => boundingBox([point], radiusMeters);
