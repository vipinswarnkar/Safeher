import ApiError from "../utils/ApiError.js";

// Unknown routes
export const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

// Turns any thrown error into a clean JSON response.
// Express 5 forwards errors from async handlers here automatically.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let details = err.details;

  // Invalid MongoDB id, e.g. /api/contacts/abc
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  }

  // Unique index violation (email / phone already used)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "value";
    message = `This ${field} is already in use`;
  }

  // Mongoose schema validation
  if (err.name === "ValidationError" && err.errors) {
    statusCode = 400;
    message = "Validation failed";
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Malformed JSON body
  if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON in request body";
  }

  if (statusCode >= 500) {
    console.error("Unhandled Error:", err);
    // Don't leak internals in production
    if (process.env.NODE_ENV === "production") message = "Internal Server Error";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { errors: details } : {}),
  });
};
