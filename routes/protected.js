const express = require("express");
const router = express.Router();
const {
  upsertStudentProfile,
  getStudentProfile,
} = require("../controllers/studentProfileController");
const { authenticateToken } = require("../middleware/jwtAuth");
// GET /api/profile - returns the logged-in user's basic info
// router.get("/profile", (req, res) => {
//   if (!req.user) return res.status(401).json({ user: null });
//   // send a small safe subset
//   const { _id, displayName, email, avatar } = req.user;
//   res.json({ user: { id: _id || req.user.id, displayName, email, avatar } });
// });

// GET /api/secret - example protected resource
router.get("/secret", (req, res) => {
  res.json({ secret: "The cake is a lie", you: req.user || null });
});

router.post("/profile-add-edit",authenticateToken, upsertStudentProfile);
router.get("/profile", authenticateToken, getStudentProfile);

module.exports = router;
