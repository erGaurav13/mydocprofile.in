// const StudentProfile = require("../models/student.profile");

 
// const normalizeMarks = (gradeType, data) => {
//   // Clean data first
//   const cleanData = {};
//   Object.keys(data).forEach((key) => {
//     if (
//       key === "total" ||
//       key === "obtained" ||
//       key === "percentage" ||
//       key === "cgpa"
//     ) {
//       const value = data[key];
//       // Convert string numbers to actual numbers
//       if (typeof value === "string" && value.trim() !== "" && !isNaN(value)) {
//         cleanData[key] = Number(value);
//       }
//       // Keep valid numbers
//       else if (typeof value === "number" && !isNaN(value)) {
//         cleanData[key] = value;
//       }
//       // For CGPA system, don't set total/obtained/percentage
//       // For % system, don't set cgpa
//       else {
//         // Set to undefined instead of null for Mongoose to ignore
//         cleanData[key] = undefined;
//       }
//     } else {
//       cleanData[key] = data[key];
//     }
//   });

//   if (gradeType === "CGPA") {
//     const cgpaValue = cleanData.cgpa || 0;
//     return {
//       cgpa: typeof cgpaValue === "number" ? cgpaValue : Number(cgpaValue) || 0,
//       // Set to undefined so Mongoose doesn't try to cast them
//       total: undefined,
//       obtained: undefined,
//       percentage: undefined,
//     };
//   }

//   if (gradeType === "%") {
//     const total = Number(cleanData.total) || 0;
//     const obtained = Number(cleanData.obtained) || 0;
//     const percentage = total > 0 ? ((obtained / total) * 100).toFixed(2) : 0;

//     return {
//       total: total,
//       obtained: obtained,
//       percentage: Number(percentage) || 0,
//       cgpa: undefined, // Set to undefined instead of null
//     };
//   }

//   return {
//     total: undefined,
//     obtained: undefined,
//     percentage: undefined,
//     cgpa: undefined,
//   };
// };

// const upsertStudentProfile = async (req, res) => {
//   try {
//     const userId = req?.user?._id || "69581865aee957f2cbebd406"; // from auth middleware
//     const payload = req.body;
// console.log(payload,"payload ")
//     // Create a clean payload object
//     const cleanPayload = JSON.parse(JSON.stringify(payload));
//     console.log(cleanPayload,"cleanPayload")
//     // Normalize education
//     if (cleanPayload.education?.tenth) {
//       cleanPayload.education.tenth.marks = normalizeMarks(
//         cleanPayload.education.tenth.gradeType,
//         cleanPayload.education.tenth
//       );
//       // Remove the temporary fields from the main object
//       delete cleanPayload.education.tenth.total;
//       delete cleanPayload.education.tenth.obtained;
//       delete cleanPayload.education.tenth.percentage;
//       delete cleanPayload.education.tenth.cgpa;
//     }

//     if (cleanPayload.education?.twelfth) {
//       cleanPayload.education.twelfth.marks = normalizeMarks(
//         cleanPayload.education.twelfth.gradeType,
//         cleanPayload.education.twelfth
//       );
//       // Remove the temporary fields from the main object
//       delete cleanPayload.education.twelfth.total;
//       delete cleanPayload.education.twelfth.obtained;
//       delete cleanPayload.education.twelfth.percentage;
//       delete cleanPayload.education.twelfth.cgpa;
//     }

//     // Normalize qualifications
//     if (Array.isArray(cleanPayload.qualifications)) {
//       cleanPayload.qualifications = cleanPayload.qualifications.map((q) => {
//         const marks = normalizeMarks(q.gradeType, q);
//         // Remove temporary fields
//         const { total, obtained, percentage, cgpa, ...rest } = q;
//         return {
//           ...rest,
//           marks: marks,
//         };
//       });
//     }

//     // Also clean certificates if needed
//     if (Array.isArray(cleanPayload.certificates)) {
//       cleanPayload.certificates = cleanPayload.certificates.filter(
//         (cert) => cert && cert.type
//       );
//     }

//     console.log(
//       "Clean payload being saved:",
//       JSON.stringify(cleanPayload, null, 2)
//     );

//     const profile = await StudentProfile.findOneAndUpdate(
//       { userId },
//       { $set: cleanPayload },
//       { new: true, upsert: true }
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Profile saved successfully",
//       data: profile,
//     });
//   } catch (error) {
//     console.error("Profile Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to save profile",
//     });
//   }
// };

// const getStudentProfile = async (req, res) => {
//   try {
//     const userId = req?.userId; // from auth middleware
//     const profile = await StudentProfile.findOne({ userId }).lean().exec();
//     return res.status(200).json({
//       success: true,
//       message: "Profile Get successfully",
//       data: profile,
//     });
//   } catch (error) {
//     console.error("Profile Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// module.exports = { upsertStudentProfile, getStudentProfile };



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

module.exports = {
  upsertStudentProfile,
  getStudentProfile,
};
