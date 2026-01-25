const express = require("express");
const router = express.Router();

const {
  upsertStudentProfile,
  getStudentProfile,
  uploadDocControler,
  createShareLink,
  getSharedProfile,
  deleteAllShareLinks,
  deleteShareLink,
  getAllShareLinks,
} = require("../controllers/studentProfileController");
const { authenticateToken } = require("../middleware/jwtAuth");
const { uploadDoc } = require("../middleware/user.uploads");
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

router.post("/profile-add-edit", authenticateToken, upsertStudentProfile);
router.get("/profile", authenticateToken, getStudentProfile);
// Fixed version
const test = (req, res, next) => {
  // Use query parameter since req.body is empty
  const docType = req.query.docType || "other";

  req.docType = docType;

  console.log("docType middleware:", req.docType);

  next(); // Don't forget this!
};
router.post(
  "/upload-doc",
  test,
  authenticateToken,
  uploadDoc.single("file"),
  uploadDocControler
);

router.post("/share", authenticateToken, createShareLink);
router.get("/share/:token", getSharedProfile);

// Get all share links for current user (GET /api/share/links)
router.get("/all-shared-links", authenticateToken, getAllShareLinks);

// Delete a specific share link (DELETE /api/share/:token)
router.delete("/delete-single-link/:token", authenticateToken, deleteShareLink);

// Delete all share links for current user (DELETE /api/share)
router.delete("/dlt-all", authenticateToken, deleteAllShareLinks);

module.exports = router;
