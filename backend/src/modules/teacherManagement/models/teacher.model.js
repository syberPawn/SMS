const mongoose = require("mongoose");

const { Schema } = mongoose;

const qualificationEnum = [
  "10+2",
  "Bachelor Degree",
  "Master's Degree",
  "Phd",
  "Other",
];

const teacherSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      unique: true,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    highestQualification: {
      type: String,
      required: true,
      enum: qualificationEnum,
    },

    qualificationDetail: {
      type: String,
      trim: true,
      default: null,
    },

    status: {
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

module.exports = mongoose.model("Teacher", teacherSchema);
