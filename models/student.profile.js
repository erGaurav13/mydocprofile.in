const mongoose = require("mongoose");

// In student.profile.js
const MarksSchema = new mongoose.Schema(
  {
    total: { type: Number, default: 0 },
    obtained: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    cgpa: { type: Number, default: 0 },
  },
  { _id: false }
);
const EducationSchema = new mongoose.Schema(
  {
    board: String,
    year: Number,
    stream: String,
    rollNo: String,
    gradeType: {
      type: String,
      enum: ["%", "CGPA"],
      required: true,
    },
    marks: MarksSchema,
  },
  { _id: false }
); 

const QualificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Diploma", "Graduation", "Post Graduation", "Other"],
      required: true,
    },
    rollNo: String,
    course: String,
    university: String,
    year: Number,
    gradeType: {
      type: String,
      enum: ["%", "CGPA"],
    },
    marks: MarksSchema,
  },
  { _id: false }
);

const CertificateSchema = new mongoose.Schema(
  {
    type: String, // aadhaar, 10th, 12th, graduation, etc
    fileName: String,
    fileUrl: String,
  },
  { _id: false }
);

const StudentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      ref: "User",
      unique: true,
      required: true,
    },

    personal: {
      fullName: { type: String, required: true },
      dob: { type: Date, required: true },
      gender: String,
      father: String,
      mother: String,
      aadhaar: { type: String, required: true }, // encrypt later
      address1: String,
      address2: String,
      state: String,
      district: String,
      pincode: String,
    },

    education: {
      tenth: EducationSchema,
      twelfth: EducationSchema,
    },

    qualifications: [QualificationSchema],

    certificates: [CertificateSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("StudentProfile", StudentProfileSchema);
