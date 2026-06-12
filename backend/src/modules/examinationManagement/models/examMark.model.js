const mongoose = require("mongoose");

const { Schema } = mongoose;

const examMarkSchema = new Schema(
  {
    examInstanceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "ExamInstance",
      immutable: true,
      index: true,
    },

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

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Subject",
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

    marks: {
      type: Number,
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
  BR-EXM-07
  Single mark entry per enrollment, subject, exam instance
*/
examMarkSchema.index(
  { enrollmentId: 1, subjectId: 1, examInstanceId: 1 },
  { unique: true },
);

/*
  DS-EXM-05
  Student totals support
*/
examMarkSchema.index({
  enrollmentId: 1,
  examInstanceId: 1,
});

/*
  DS-EXM-05
  Section analytics support
*/
examMarkSchema.index({
  sectionId: 1,
  examInstanceId: 1,
});

/*
  DS-EXM-05
  Subject analytics support
*/
examMarkSchema.index({
  subjectId: 1,
  examInstanceId: 1,
});

/*
  DS-EXM-05
  Year filtering support
*/
// examMarkSchema.index({
//   academicYearId: 1,
// });

module.exports = mongoose.model("ExamMark", examMarkSchema);
