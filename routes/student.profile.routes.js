const express = require("express");
const {authenticateToken} = require("../middleware/jwtAuth");
const router = express.Router();
const {
  upsertStudentProfile,
} = require("../controllers/studentProfileController");

// POST /profile
// router.post("/profile-add-edit", authenticateToken,upsertStudentProfile);

module.exports = router;
