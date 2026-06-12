const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      immutable: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      required: true,
      enum: ["ADMIN", "TEACHER", "STUDENT"],
      immutable: true,
    },

    status: {
      type: String,
      required: true,
      enum: ["ACTIVE", "INACTIVE"],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Only null for initial seeded ADMIN
      immutable: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

/*
  Indexes
*/

// Unique index for username (case-insensitive via lowercase storage)

// Performance index
userSchema.index({ role: 1, status: 1 });

const User = mongoose.model("User", userSchema);

module.exports = User;
