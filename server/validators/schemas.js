import { z } from "zod";

// ---------- shared pieces ----------
const trimmed = (label, max = 100) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} is too long`);

// Indian mobile: optional +91 / 91 / 0, then 10 digits starting 6-9.
// Spaces and dashes are removed before checking.
export const phone = z
  .string({ error: "Phone number is required" })
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^(\+?91|0)?[6-9]\d{9}$/.test(v), "Enter a valid 10-digit mobile number");

const latitude = z.coerce
  .number({ error: "Latitude is required" })
  .min(-90, "Invalid latitude")
  .max(90, "Invalid latitude");
const longitude = z.coerce
  .number({ error: "Longitude is required" })
  .min(-180, "Invalid longitude")
  .max(180, "Invalid longitude");

const email = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .email("Enter a valid email");

export const point = z.object({ latitude, longitude });

export const objectIdParam = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid id"),
});

// ---------- auth & user ----------
export const registerSchema = z.object({
  name: trimmed("Name", 60),
  email,
  password: z
    .string({ error: "Password is required" })
    .min(6, "Password must be at least 6 characters")
    .max(100),
  phone,
});

export const loginSchema = z.object({
  email,
  password: z.string({ error: "Password is required" }).min(1, "Password is required"),
});

export const updateProfileSchema = z
  .object({
    name: trimmed("Name", 60).optional(),
    phone: phone.optional(),
  })
  .refine((v) => v.name !== undefined || v.phone !== undefined, "Nothing to update");

export const changePasswordSchema = z.object({
  oldPassword: z.string({ error: "Current password is required" }).min(1, "Current password is required"),
  newPassword: z
    .string({ error: "New password is required" })
    .min(6, "New password must be at least 6 characters")
    .max(100),
});

// ---------- contacts ----------
export const contactSchema = z.object({
  name: trimmed("Name", 60),
  phone,
  relationship: trimmed("Relationship", 40),
});

export const contactUpdateSchema = contactSchema.partial();

// ---------- journey ----------
export const startJourneySchema = z.object({
  source: trimmed("Source", 300),
  destination: trimmed("Destination", 300),
  sourceLocation: point.optional(),
  destinationLocation: point.optional(),
  // Chosen route as [lng, lat] pairs (GeoJSON order), already simplified by the client
  plannedRoute: z.array(z.tuple([longitude, latitude])).max(2000).optional(),
  expectedDurationSec: z.coerce.number().positive().max(86400).optional(),
  routeSafetyScore: z.coerce.number().min(0).max(100).optional(),
});

export const checkInSchema = z.object({
  alertType: z.enum(["off_route", "stopped", "overdue", "unsafe_area", "manual"]).default("manual"),
});

// ---------- location & sos ----------
export const locationUpdateSchema = z.object({
  latitude,
  longitude,
  accuracy: z.coerce.number().min(0).nullish(),
  speed: z.coerce.number().nullish(),
});

export const sosSchema = z.object({
  latitude,
  longitude,
  message: z.string().trim().max(300).optional(),
});

// ---------- safety ----------
export const REPORT_TYPES = [
  "poor_lighting",
  "harassment",
  "stalking",
  "isolated_area",
  "unsafe_crowd",
  "theft",
  "other",
];

export const reportSchema = z.object({
  type: z.enum(REPORT_TYPES, { error: "Choose what happened" }),
  severity: z.coerce.number().int().min(1).max(3).default(2),
  description: z.string().trim().max(500).optional(),
  latitude,
  longitude,
});

export const nearQuerySchema = z.object({
  lat: latitude,
  lng: longitude,
  radius: z.coerce.number().min(100).max(5000).default(1500),
});

export const routesQuerySchema = z.object({
  fromLat: latitude,
  fromLng: longitude,
  toLat: latitude,
  toLng: longitude,
  mode: z.enum(["foot", "driving"]).default("foot"),
});
