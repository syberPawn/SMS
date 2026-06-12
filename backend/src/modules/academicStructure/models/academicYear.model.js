const mongoose = require("mongoose");

const { Schema } = mongoose;

const academicYearSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
    },

    startDate: {
      type: Date,
      required: true,
      immutable: true,
    },

    endDate: {
      type: Date,
      required: true,
      immutable: true,
    },

    status: {
      type: String,
      required: true,
      enum: ["ACTIVE", "INACTIVE"],
      default: "INACTIVE",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

/*
  Performance Index:
  Frequently querying active academic year
*/
// academicYearSchema.index({ status: 1 });

module.exports = mongoose.model("AcademicYear", academicYearSchema);
