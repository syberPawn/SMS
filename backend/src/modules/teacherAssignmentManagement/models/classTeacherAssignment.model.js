const mongoose = require("mongoose");

const { Schema } = mongoose;

const classTeacherAssignmentSchema = new Schema(
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
    },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

/*
  BR-TAM-05
  A section may have at most one Class Teacher per academic year
*/
classTeacherAssignmentSchema.index(
  { sectionId: 1, academicYearId: 1 },
  { unique: true },
);

/*
  BR-TAM-06
  A teacher may serve as Class Teacher for only one section per academic year
*/
classTeacherAssignmentSchema.index(
  { teacherId: 1, academicYearId: 1 },
  { unique: true },
);

/*
  Performance Index
*/
classTeacherAssignmentSchema.index({ teacherId: 1 });

module.exports = mongoose.model(
  "ClassTeacherAssignment",
  classTeacherAssignmentSchema,
);
