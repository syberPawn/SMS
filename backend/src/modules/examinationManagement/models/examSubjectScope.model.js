const mongoose = require("mongoose");

const { Schema } = mongoose;

const examSubjectScopeSchema = new Schema(
  {
    examInstanceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "ExamInstance",
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

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Subject",
      immutable: true,
      index: true,
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
  BR-EXM-10
  Snapshot uniqueness per exam instance, grade, subject
*/
examSubjectScopeSchema.index(
  { examInstanceId: 1, gradeId: 1, subjectId: 1 },
  { unique: true },
);

/*
  Deterministic report generation support
*/
examSubjectScopeSchema.index({
  examInstanceId: 1,
  gradeId: 1,
});

module.exports = mongoose.model("ExamSubjectScope", examSubjectScopeSchema);
