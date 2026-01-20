 

const StudentProfile = require("../models/student.profile");

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
    console.log(req.files,"files")
    const userId = req?.userId; 
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

        const {
          total,
          obtained,
          percentage,
          cgpa,
          ...rest
        } = q;

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

   

console.log(userId,cleanPayload,"userId,payload")
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
    const userId = req?.userId;;
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
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { docType } = req; // document type
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const fileUrl = `${baseUrl}/userdoc/${req.userId}/${req.file.filename}`;

    const profile = await StudentProfile.findOne({ userId:req.userId });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    // check if certificate already exists
    const index = profile.certificates.findIndex(c => c?.type === docType);
console.log({
        type:docType,
        fileName: req.file.filename,
        fileUrl
      })
    if (index !== -1) {
      // 🔄 update existing
      profile.certificates[index].fileName = req.file.filename;
      profile.certificates[index].fileUrl = fileUrl;
    } else {
      // ➕ insert new
      profile.certificates.push({
        type:docType,
        fileName: req.file.filename,
        fileUrl
      });
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      data: { type:docType, fileName: req.file.filename, fileUrl }
    });

  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  upsertStudentProfile,
  getStudentProfile,uploadDocControler
};
