/*
 * Route alternatives from OSRM (open-source routing on OpenStreetMap data).
 * Defaults use free public servers; set OSRM_FOOT_URL / OSRM_DRIVING_URL to
 * your own OSRM instance for production traffic.
 */

const BASE_URLS = {
  foot: () => process.env.OSRM_FOOT_URL || "https://routing.openstreetmap.de/routed-foot",
  driving: () => process.env.OSRM_DRIVING_URL || "https://router.project-osrm.org",
};

export async function getRouteAlternatives(from, to, mode = "foot") {
  const base = (BASE_URLS[mode] || BASE_URLS.foot)();
  const coords = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
  // The profile segment is always "driving" in the URL; the server decides the mode
  const url = `${base}/route/v1/driving/${coords}?alternatives=3&overview=full&geometries=geojson&steps=false`;

  const response = await fetch(url, {
    headers: { "User-Agent": "SafeHer/1.0 (women safety app)" },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Routing service HTTP ${response.status}`);
  }

  const json = await response.json();
  if (json.code !== "Ok" || !Array.isArray(json.routes) || json.routes.length === 0) {
    return [];
  }

  return json.routes.map((route) => ({
    distanceMeters: Math.round(route.distance),
    durationSec: Math.round(route.duration),
    coordinates: route.geometry.coordinates, // [lng, lat][]
  }));
}
