const mongoose = require("mongoose");

const { Schema } = mongoose;

const monthlyFeesSchema = new Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "AcademicYear",
      immutable: true,
      index: true,
    },

    gradeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Grade",
      immutable: true,
      index: true,
    },

    monthlyAmount: {
      type: Number,
      required: true,
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
  BR-FEE-02
  Ensure one fee structure per (gradeId, academicYearId)
*/
monthlyFeesSchema.index({ gradeId: 1, academicYearId: 1 }, { unique: true });

/*
  Performance index
*/
// monthlyFeesSchema.index({
//   academicYearId: 1,
// });

module.exports = mongoose.model("MonthlyFees", monthlyFeesSchema);
