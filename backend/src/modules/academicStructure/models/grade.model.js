const mongoose = require("mongoose");

const { Schema } = mongoose;

const gradeSchema = new Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "AcademicYear",
      immutable: true,
    },

    name: {
      type: String,
      required: true,
      immutable: true,
      trim: true,
    },

    status: {
      type: String,
      required: true,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
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
  Unique constraint:
  Grade name must be unique within same academic year
*/
gradeSchema.index({ academicYearId: 1, name: 1 }, { unique: true });

/*
  Performance index:
  Frequently listing grades per academic year
*/
gradeSchema.index({ academicYearId: 1, status: 1 });

module.exports = mongoose.model("Grade", gradeSchema);
