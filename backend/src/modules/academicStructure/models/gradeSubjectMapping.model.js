const mongoose = require("mongoose");

const { Schema } = mongoose;

const gradeSubjectMappingSchema = new Schema(
  {
    gradeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Grade",
      immutable: true,
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Subject",
      immutable: true,
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
  Only one ACTIVE mapping allowed per (gradeId, subjectId)

  Allows:
  - One ACTIVE mapping
  - Historical INACTIVE mappings
*/
gradeSubjectMappingSchema.index(
  { gradeId: 1, subjectId: 1, status: 1 },
  { unique: true },
);

/*
  Performance indexes:
  Used frequently in curriculum validation
*/
gradeSubjectMappingSchema.index({ gradeId: 1 });
gradeSubjectMappingSchema.index({ subjectId: 1 });

module.exports = mongoose.model(
  "GradeSubjectMapping",
  gradeSubjectMappingSchema,
);
