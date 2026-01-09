// middleware/auth.js
// Simple middleware to protect routes using Passport sessions
exports.ensureAuth = (req, res, next) => {
  // Passport adds isAuthenticated() on the request when using sessions
  if (
    req &&
    typeof req.isAuthenticated === "function" &&
    req.isAuthenticated()
  ) {
    return next();
  }
  // For API clients prefer JSON error response
  return res.status(401).json({ error: "Unauthorized" });
};

// Convenience middleware to allow optional authentication (sets req.user when present)
exports.optionalAuth = (req, res, next) => {
  return next();
};
