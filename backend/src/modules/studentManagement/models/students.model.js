const mongoose = require("mongoose");

const { Schema } = mongoose;

const studentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    dateOfBirth: {
      type: Date,
      required: true,
      immutable: true,
    },

    gender: {
      type: String,
      required: true,
      enum: ["MALE", "FEMALE", "OTHER"],
    },

    admissionNumber: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
      index: true,
    },

    identityStatus: {
      type: String,
      required: true,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Student", studentSchema);
