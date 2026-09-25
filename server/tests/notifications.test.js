import { test } from "node:test";
import assert from "node:assert/strict";
import { toE164, buildSOSMessage } from "../services/notification.service.js";
import { categorize, parseOverpass } from "../services/places.service.js";

test("toE164 handles common Indian formats", () => {
  assert.equal(toE164("98765 43210"), "+919876543210");
  assert.equal(toE164("09876543210"), "+919876543210");
  assert.equal(toE164("919876543210"), "+919876543210");
  assert.equal(toE164("+14155550100"), "+14155550100");
  assert.equal(toE164("123"), null);
});

test("SOS message includes location, destination and live tracking link", () => {
  process.env.CLIENT_URL = "https://safeher.example";
  const body = buildSOSMessage({
    user: { name: "Asha", phone: "9123456780" },
    location: { mapUrl: "https://www.google.com/maps?q=19,72" },
    journey: { destination: "Bandra West, Mumbai", shareToken: "abcdefghijklmnopqrstuvwx", status: "active" },
  });
  assert.match(body, /Asha needs help/);
  assert.match(body, /maps\?q=19,72/);
  assert.match(body, /Heading to: Bandra West/);
  assert.match(body, /https:\/\/safeher\.example\/track\/abcdefghijklmnopqrstuvwx/);
});

test("OSM tags map to safe-place categories", () => {
  assert.equal(categorize({ amenity: "police" }), "police");
  assert.equal(categorize({ amenity: "clinic" }), "hospital");
  assert.equal(categorize({ railway: "station" }), "transit");
  assert.equal(categorize({ shop: "convenience", opening_hours: "24/7" }), "open_24x7");
  assert.equal(categorize({ amenity: "bench" }), null);
});

test("parseOverpass handles nodes and ways and drops unknown things", () => {
  const places = parseOverpass({
    elements: [
      { type: "node", id: 1, lat: 19, lon: 72.8, tags: { amenity: "police", name: "Bandra PS" } },
      { type: "way", id: 2, center: { lat: 19.1, lon: 72.9 }, tags: { amenity: "hospital" } },
      { type: "node", id: 3, lat: 19, lon: 72.8, tags: { amenity: "bench" } },
      { type: "node", id: 1, lat: 19, lon: 72.8, tags: { amenity: "police" } }, // duplicate
    ],
  });
  assert.equal(places.length, 2);
  assert.equal(places[0].name, "Bandra PS");
  assert.equal(places[1].name, "Hospital");
});
