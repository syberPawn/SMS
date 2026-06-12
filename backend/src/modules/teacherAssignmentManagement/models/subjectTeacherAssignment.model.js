const mongoose = require("mongoose");

const { Schema } = mongoose;

const subjectTeacherAssignmentSchema = new Schema(
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

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Subject",
      immutable: true,
    },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

/*
  BR-TAM-07
  A subject may be assigned to at most one teacher
  within the same section and academic year
*/
subjectTeacherAssignmentSchema.index(
  { sectionId: 1, subjectId: 1, academicYearId: 1 },
  { unique: true },
);

module.exports = mongoose.model(
  "SubjectTeacherAssignment",
  subjectTeacherAssignmentSchema,
);
