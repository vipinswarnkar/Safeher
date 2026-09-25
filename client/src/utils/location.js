// Browser location helpers

export function getCurrentPosition({ timeout = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not supported on this device"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      reject,
      { enableHighAccuracy: true, timeout, maximumAge: 0 }
    );
  });
}

// Distance between two { latitude, longitude } points in meters
export function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Keep at most `max` points of a [lng, lat] route (always keeps the last point)
export function downsampleRoute(coordinates, max = 500) {
  if (!coordinates || coordinates.length <= max) return coordinates;
  const step = Math.ceil(coordinates.length / max);
  const out = coordinates.filter((_, i) => i % step === 0);
  const last = coordinates[coordinates.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

export const formatDistance = (m) =>
  m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;

export const formatMinutes = (sec) => {
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")} min`;
};

// Links that open the phone's own apps (free, no Twilio needed)
export const whatsappLink = (text, phone) => {
  const digits = phone ? phone.replace(/\D/g, "") : "";
  const to = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
};

// "?&body=" works on both Android and iPhone
export const smsLink = (phones, text) =>
  `sms:${phones.join(",")}?&body=${encodeURIComponent(text)}`;
