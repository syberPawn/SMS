const mongoose = require("mongoose");

const { Schema } = mongoose;

const enrollmentSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      immutable: true,
      index: true,
    },

    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
      immutable: true,
      index: true,
    },

    sectionId: {
      type: Schema.Types.ObjectId,
      ref: "Section",
      required: true,
      index: true,
    },

    enrollmentStatus: {
      type: String,
      required: true,
      enum: ["ACTIVE", "PROMOTED", "REPEATING", "WITHDRAWN", "COMPLETED"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

/*
  Compound Unique Index
  Enforces: One enrollment per student per academic year (BR-SM-04)
*/
enrollmentSchema.index({ studentId: 1, academicYearId: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
