const StudentProfile = require("../models/student.profile");

const crypto = require("crypto");
const ProfileShare = require("../models/profileShare");
const mongoose = require("mongoose");
/**
 * Normalize marks safely
 * - Accepts flat input: total, obtained, percentage, cgpa
 * - Returns ONLY valid fields
 */
const normalizeMarks = (gradeType, data = {}) => {
  const result = {};

  if (gradeType === "CGPA") {
    if (data.cgpa === undefined || data.cgpa === null || data.cgpa === "") {
      return {};
    }

    result.cgpa = Number(data.cgpa);
    return result;
  }

  if (gradeType === "%") {
    const total = Number(data.total);
    const obtained = Number(data.obtained);

    if (!total || !obtained || isNaN(total) || isNaN(obtained)) {
      return {};
    }

    result.total = total;
    result.obtained = obtained;
    result.percentage = Number(((obtained / total) * 100).toFixed(2));
    return result;
  }

  return {};
};

const upsertStudentProfile = async (req, res) => {
  try {
    console.log(req.files, "files");
    const userId = req?.userId;
    if (!userId) {
      return res.status(500).json({
        success: false,
        message: "userId required to save profile",
      });
    }
    const payload = req.body;

    // Deep clone to avoid mutation
    const cleanPayload = JSON.parse(JSON.stringify(payload));

    /* -------------------- EDUCATION: TENTH -------------------- */
    if (cleanPayload.education?.tenth) {
      const tenth = cleanPayload.education.tenth;

      // Normalize ONLY if marks not already present
      if (!tenth.marks) {
        tenth.marks = normalizeMarks(tenth.gradeType, tenth);
      }

      // Remove flat fields if they exist
      delete tenth.total;
      delete tenth.obtained;
      delete tenth.percentage;
      delete tenth.cgpa;
    }

    /* -------------------- EDUCATION: TWELFTH -------------------- */
    if (cleanPayload.education?.twelfth) {
      const twelfth = cleanPayload.education.twelfth;

      if (!twelfth.marks) {
        twelfth.marks = normalizeMarks(twelfth.gradeType, twelfth);
      }

      delete twelfth.total;
      delete twelfth.obtained;
      delete twelfth.percentage;
      delete twelfth.cgpa;
    }

    /* -------------------- QUALIFICATIONS -------------------- */
    if (Array.isArray(cleanPayload.qualifications)) {
      cleanPayload.qualifications = cleanPayload.qualifications.map((q) => {
        // Already normalized → leave as is
        if (q.marks) return q;

        const marks = normalizeMarks(q.gradeType, q);

        const { total, obtained, percentage, cgpa, ...rest } = q;

        return {
          ...rest,
          marks,
        };
      });
    }

    /* -------------------- CERTIFICATES CLEANUP -------------------- */
    if (Array.isArray(cleanPayload.certificates)) {
      cleanPayload.certificates = cleanPayload.certificates.filter(
        (c) => c && c.type
      );
    }

    console.log(userId, cleanPayload, "userId,payload");
    const profile = await StudentProfile.findOneAndUpdate(
      { userId },
      { $set: cleanPayload },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Profile saved successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save profile",
    });
  }
};

const getStudentProfile = async (req, res) => {
  try {
    const userId = req?.userId;
    const profile = await StudentProfile.findOne({ userId }).lean();

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Upload single file
uploadDocControler = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const { docType } = req; // document type
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const fileUrl = `${baseUrl}/userdoc/${req.userId}/${req.file.filename}`;

    const profile = await StudentProfile.findOne({ userId: req.userId });
    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    // check if certificate already exists
    const index = profile.certificates.findIndex((c) => c?.type === docType);
    console.log({
      type: docType,
      fileName: req.file.filename,
      fileUrl,
    });
    if (index !== -1) {
      // 🔄 update existing
      profile.certificates[index].fileName = req.file.filename;
      profile.certificates[index].fileUrl = fileUrl;
    } else {
      // ➕ insert new
      profile.certificates.push({
        type: docType,
        fileName: req.file.filename,
        fileUrl,
      });
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      data: { type: docType, fileName: req.file.filename, fileUrl },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createShareLink = async (req, res) => {
  try {
    const userId = req.userId;
    const expiresInHours = Number(req.body?.expiresInHours) || 24;
    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const newP = await ProfileShare.create({
      userId,
      token,
      expiresAt,
    });
    console.log(newP);
    const baseUrl = process.env.FRONTEND_URL;
    const shareUrl = `${baseUrl}/share/${token}`;

    return res.json({
      success: true,
      shareUrl,
      expiresAt,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSharedProfile = async (req, res) => {
  try {
    const { token } = req.params;

    const share = await ProfileShare.findOne({
      token,
      isActive: true,
    });
    console.log(share, "g");
    if (!share) {
      return res.status(404).json({
        success: false,
        message: "Link expired or invalid",
      });
    }

    if (new Date() > share.expiresAt) {
      return res.status(410).json({
        success: false,
        message: "Link expired",
      });
    }

    console.log(share.userId, "d");

    const profile = await StudentProfile.findOne({
      userId: share.userId,
    }).lean();

    console.log(profile, "SD");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // 🔒 Remove sensitive fields
    delete profile.personal.aadhaar;
    delete profile.__v;

    return res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all share links for the current user
const getAllShareLinks = async (req, res) => {
  try {
    const userId = req.userId;

    const shareLinks = await ProfileShare.find({
      userId,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate if each link is expired
    const linksWithStatus = shareLinks.map((link) => ({
      ...link,
      isExpired: new Date() > link.expiresAt,
      daysLeft: Math.max(
        0,
        Math.ceil((link.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
      ),
    }));

    return res.json({
      success: true,
      data: linksWithStatus,
      count: linksWithStatus.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a specific share link
const deleteShareLink = async (req, res) => {
  try {
    const userId = req.userId;
    const { token } = req.params;

    const share = await ProfileShare.findOne({
      token,
      userId,
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: "Share link not found",
      });
    }

    // Soft delete by setting isActive to false
    share.isActive = false;
    await share.save();

    // Or hard delete if you prefer:
    // await ProfileShare.deleteOne({ token, userId });

    return res.json({
      success: true,
      message: "Share link deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete all share links for the current user
const deleteAllShareLinks = async (req, res) => {
  try {
    const userId = req.userId;

    // Soft delete all links
   const result=  await ProfileShare.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    // Or hard delete all links:
    // await ProfileShare.deleteMany({ userId });

    return res.json({
      success: true,
      message: "All share links deleted successfully",
      deletedCount: result.modifiedCount || result.deletedCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  upsertStudentProfile,
  getStudentProfile,
  uploadDocControler,
  createShareLink,
  getSharedProfile,
  getAllShareLinks,
  deleteShareLink,
  deleteAllShareLinks
};
