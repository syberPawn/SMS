const mongoose = require("mongoose");

const { Schema } = mongoose;

const sectionSchema = new Schema(
  {
    gradeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Grade",
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
  Section name must be unique within same grade
*/
sectionSchema.index({ gradeId: 1, name: 1 }, { unique: true });

/*
  Performance index:
  Frequently listing sections per grade
*/
sectionSchema.index({ gradeId: 1, status: 1 });

module.exports = mongoose.model("Section", sectionSchema);
