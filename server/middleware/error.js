/** Wraps async controllers so rejected promises reach the error handler. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** 404 handler for unknown routes. */
export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

/** Central error handler — keeps API responses consistent. */
export function errorHandler(err, _req, res, _next) {
  let status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || "Server error";

  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid ID format.";
  } else if (err.code === 11000) {
    status = 400;
    message = "That email is already registered.";
  }

  if (process.env.NODE_ENV !== "production") console.error("❌", err);

  res.status(status).json({ message });
}
