const mongoose = require("mongoose");

const { Schema } = mongoose;

const noticeSchema = new Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "AcademicYear",
      immutable: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      immutable: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      immutable: true,
      trim: true,
    },

    attachmentReference: {
      type: String,
      default: null,
      immutable: true,
    },

    priority: {
      type: String,
      enum: ["NORMAL", "URGENT"],
      required: true,
      default: "NORMAL",
      immutable: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      required: true,
      default: "Active",
      index: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      immutable: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

/*
  DS-NOT-03
  Primary query index supporting:
  - academicYear filtering
  - status filtering
  - reverse chronological sorting
*/
noticeSchema.index({
  academicYearId: 1,
  priority: 1,
  status: 1,
  createdAt: -1,
});

/*
  Secondary admin query index
*/
noticeSchema.index({
  academicYearId: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Notice", noticeSchema);
