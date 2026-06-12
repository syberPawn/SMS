const mongoose = require("mongoose");

const { Schema } = mongoose;

const paymentRecordsSchema = new Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "AcademicYear",
      immutable: true,
      index: true,
    },

    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Enrollment",
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

    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Section",
      immutable: true,
      index: true,
    },

    month: {
      type: String,
      required: true,
      immutable: true,
    },

    amount: {
      type: Number,
      required: true,
      immutable: true,
    },

    paidAt: {
      type: Date,
      required: true,
      immutable: true,
    },

    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
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
  BR-FEE-06
  Ensure only one payment per enrollment per month
*/
paymentRecordsSchema.index({ enrollmentId: 1, month: 1 }, { unique: true });

/*
  DS-FEE-04
  Academic year filtering
*/
// paymentRecordsSchema.index({
//   academicYearId: 1,
// });

/*
  Section monthly summary
*/
// paymentRecordsSchema.index({
//   sectionId: 1,
// });

/*
  Student lookup
*/
// paymentRecordsSchema.index({
//   enrollmentId: 1,
// });

module.exports = mongoose.model("PaymentRecords", paymentRecordsSchema);
