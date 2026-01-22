const mongoose = require("mongoose");

const ProfileShareSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: "User",
    required: true
  },

  token: {
    type: String,
    required: true,
    unique: true
  },

  expiresAt: {
    type: Date,
    required: true
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

ProfileShareSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("ProfileShare", ProfileShareSchema);
