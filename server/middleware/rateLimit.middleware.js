import rateLimit from "express-rate-limit";

const common = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // Tests fire many requests quickly; don't rate limit them
  skip: () => process.env.NODE_ENV === "test",
};

// Stops password guessing: 20 login/register attempts per 15 min per IP
export const authLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { success: false, message: "Too many attempts. Try again in 15 minutes." },
});

// Generous on purpose: never block a real emergency, only obvious spam
export const sosLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  limit: 10,
  message: { success: false, message: "Too many SOS requests. If this is an emergency, call 112." },
});

// Public tracking links are unauthenticated, so cap them per IP
export const publicLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  limit: 60,
  message: { success: false, message: "Too many requests" },
});

// Safety lookups call external map services; keep usage polite
export const safetyLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  limit: 40,
  message: { success: false, message: "Too many requests. Please slow down." },
});
