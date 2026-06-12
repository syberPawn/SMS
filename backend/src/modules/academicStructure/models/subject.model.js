const mongoose = require("mongoose");

const { Schema } = mongoose;

const subjectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    code: {
      type: String,
      unique: true,
      sparse: true, // allows multiple null values
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
  Performance index:
  Frequently filtering active subjects
*/
// subjectSchema.index({ status: 1 });

module.exports = mongoose.model("Subject", subjectSchema);
