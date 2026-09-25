import { distanceMeters } from "../utils/geo.js";

/*
 * Nearby "safe places" from OpenStreetMap via the free Overpass API:
 * police, hospitals/clinics, pharmacies, transit stations, fuel pumps and
 * anything tagged as open 24/7.
 *
 * Results are cached in memory for 15 minutes per area so we stay polite
 * to the public server. If Overpass is down we return [] and callers carry on.
 */

const OVERPASS_URL = () =>
  process.env.OVERPASS_URL || "https://overpass-api.de/api/interpreter";

const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const cache = new Map();

export const PLACE_CATEGORIES = {
  police: { label: "Police", weight: 7 },
  hospital: { label: "Hospital", weight: 5 },
  transit: { label: "Station", weight: 4 },
  open_24x7: { label: "Open 24x7", weight: 4 },
  pharmacy: { label: "Pharmacy", weight: 2 },
  fuel: { label: "Fuel pump", weight: 2 },
};

// Map raw OSM tags to one of our categories
export function categorize(tags = {}) {
  if (tags.amenity === "police") return "police";
  if (tags.amenity === "hospital" || tags.amenity === "clinic") return "hospital";
  if (
    tags.railway === "station" ||
    tags.public_transport === "station" ||
    tags.amenity === "bus_station"
  ) {
    return "transit";
  }
  if (tags.opening_hours === "24/7") return "open_24x7";
  if (tags.amenity === "pharmacy") return "pharmacy";
  if (tags.amenity === "fuel") return "fuel";
  return null;
}

function buildQuery(areaFilter) {
  return `[out:json][timeout:15];
(
  nwr["amenity"~"^(police|hospital|clinic|pharmacy|fuel|bus_station)$"]${areaFilter};
  nwr["railway"="station"]${areaFilter};
  nwr["public_transport"="station"]${areaFilter};
  nwr["opening_hours"="24/7"]${areaFilter};
);
out center 150;`;
}

// Normalise Overpass elements into { id, name, category, latitude, longitude }
export function parseOverpass(json) {
  const seen = new Set();
  const places = [];

  for (const el of json?.elements ?? []) {
    const latitude = el.lat ?? el.center?.lat;
    const longitude = el.lon ?? el.center?.lon;
    const category = categorize(el.tags);
    if (latitude == null || longitude == null || !category) continue;

    const id = `${el.type}/${el.id}`;
    if (seen.has(id)) continue;
    seen.add(id);

    places.push({
      id,
      name: el.tags?.name || PLACE_CATEGORIES[category].label,
      category,
      latitude,
      longitude,
      phone: el.tags?.phone || el.tags?.["contact:phone"] || null,
      open24x7: el.tags?.opening_hours === "24/7",
    });
  }
  return places;
}

async function runQuery(query, cacheKey) {
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.places;

  try {
    const response = await fetch(OVERPASS_URL(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        // Overpass asks clients to identify themselves
        "User-Agent": "SafeHer/1.0 (women safety app)",
      },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);

    const places = parseOverpass(await response.json());

    if (cache.size >= CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value);
    cache.set(cacheKey, { at: Date.now(), places });
    return places;
  } catch (error) {
    console.warn("[places] Overpass unavailable:", error.message);
    return null; // null = unknown, [] = none found
  }
}

// Places near a point, sorted by distance (adds distanceMeters)
export async function findSafePlacesNear(point, radiusMeters = 1500) {
  // Round to ~100 m so nearby requests share a cache entry
  const key = `near:${point.latitude.toFixed(3)},${point.longitude.toFixed(3)},${radiusMeters}`;
  const places = await runQuery(
    buildQuery(`(around:${radiusMeters},${point.latitude},${point.longitude})`),
    key
  );
  if (places === null) return null;

  return places
    .map((p) => ({ ...p, distanceMeters: Math.round(distanceMeters(point, p)) }))
    .filter((p) => p.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

// Places inside a bounding box (used when scoring whole routes)
export async function findSafePlacesInBox({ south, west, north, east }) {
  const f = (n) => n.toFixed(4);
  const key = `box:${f(south)},${f(west)},${f(north)},${f(east)}`;
  return runQuery(buildQuery(`(${f(south)},${f(west)},${f(north)},${f(east)})`), key);
}
