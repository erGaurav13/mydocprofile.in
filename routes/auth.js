const express = require("express");
const passport = require("passport");
const router = express.Router();
const { authSuccess, authFailure } = require("../controllers/authController");
const { authMock } = require("../controllers/authController");

// Helper to detect whether Google strategy is configured
function hasGoogleStrategy() {
  try {
    return !!(passport._strategy && passport._strategy("google"));
  } catch (e) {
    return false;
  }
}
// Start Google OAuth flow (only if strategy configured)
if (hasGoogleStrategy()) {
  router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );
  // OAuth callback
  router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/auth/failure" }),
    authSuccess
  );
} else {
  router.get("/google", (req, res) =>
    res.status(501).json({ error: "Google OAuth not configured" })
  );
  router.get("/google/callback", (req, res) =>
    res.status(501).json({ error: "Google OAuth not configured" })
  );
}

router.get("/failure", authFailure);

// Development: mock login to create/find a user and establish a session without external OAuth
// POST /auth/mock { googleId, displayName, email, avatar }
// router.post("/mock", express.json(), authMock);

// Optional route to check current session user
router.get("/me", (req, res) => {
  if (!req.user) return res.status(401).json({ user: null });
  res.json({ user: req.user });
});

module.exports = router;
