const mongoose = require("mongoose");

const { Schema } = mongoose;

const examInstanceSchema = new Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "AcademicYear",
      immutable: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["HALF_YEARLY", "END_TERM"],
      immutable: true,
    },

    examDate: {
      type: Date,
      required: true,
      immutable: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

/*
  FR-EXM-00
  Ensure exactly one HALF_YEARLY and one END_TERM per AcademicYear
*/
examInstanceSchema.index({ academicYearId: 1, type: 1 }, { unique: true });

/*
  Year lookup index
*/
// examInstanceSchema.index({
//   academicYearId: 1,
// });

module.exports = mongoose.model("ExamInstance", examInstanceSchema);
