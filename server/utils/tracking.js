import crypto from "node:crypto";

// Unguessable token for a journey's public tracking link
export const createShareToken = () => crypto.randomBytes(18).toString("base64url");

// Public link to the tracking page in the React app
export function trackingUrl(shareToken) {
  if (!shareToken) return null;
  const base = (process.env.PUBLIC_APP_URL || (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0]).trim();
  return `${base.replace(/\/$/, "")}/track/${shareToken}`;
}
