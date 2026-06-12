const mongoose = require("mongoose");

const { Schema } = mongoose;

const attendanceEntrySchema = new Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "AcademicYear",
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

    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Enrollment",
      immutable: true,
      index: true,
    },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      immutable: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
      immutable: true,
      index: true,
    },

    status: {
      type: String,
      required: true,
      enum: ["PRESENT", "ABSENT"],
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
  }
);

/*
  BR-ATT-03
  Per-Student Uniqueness Rule
  Prevent duplicate attendance for same section, date, and enrollment
*/
attendanceEntrySchema.index(
  { sectionId: 1, date: 1, enrollmentId: 1 },
  { unique: true }
);

/*
  DS-ATT-04
  Student lookup index
*/
attendanceEntrySchema.index({
  enrollmentId: 1,
  academicYearId: 1,
});

/*
  DS-ATT-04
  Section date queries
*/
attendanceEntrySchema.index({
  sectionId: 1,
  academicYearId: 1,
  date: 1,
});

/*
  Optional Teacher Index (Performance)
*/
// attendanceEntrySchema.index({
//   teacherId: 1,
// });

module.exports = mongoose.model(
  "AttendanceEntry",
  attendanceEntrySchema
);