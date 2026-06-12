const mongoose = require("mongoose");
const AcademicYear = require("../models/academicYear.model");

/*
  ==============================
  Academic Year Domain Errors
  ==============================
*/

class AcademicYearNotFoundError extends Error {}
class AcademicYearAlreadyActiveError extends Error {}
class InvalidDateRangeError extends Error {}
class OverlappingAcademicYearError extends Error {}
class InvalidFirstYearStatusError extends Error {}
class AcademicYearDeactivationNotAllowedError extends Error {}
class AcademicYearValidationError extends Error {}

/*
  ==============================
  AcademicYearService
  ==============================
*/

const createAcademicYear = async (data, adminId) => {
  const { name, startDate, endDate, status } = data;

  // 1️⃣ Basic Required Validation
  //   if (!name || !startDate || !endDate || !status) {
  //     throw new Error("Missing required academic year fields");
  //   }
  if (!name || !startDate || !endDate) {
    throw new AcademicYearValidationError(
      "Missing required academic year fields",
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // 2️⃣ Date Range Validation
  if (start >= end) {
    throw new InvalidDateRangeError("startDate must be earlier than endDate");
  }

  // 3️⃣ Check Existing Academic Years
  const existingCount = await AcademicYear.countDocuments();
  const resolvedStatus = existingCount === 0 ? "ACTIVE" : status || "INACTIVE";

  if (!["ACTIVE", "INACTIVE"].includes(resolvedStatus)) {
    throw new AcademicYearValidationError("Invalid academic year status");
  }

  // 4️⃣ First Academic Year Rule
  if (existingCount === 0 && resolvedStatus !== "ACTIVE") {
    throw new InvalidFirstYearStatusError("First academic year must be ACTIVE");
  }

  // 5️⃣ Overlapping Date Range Validation
  const overlappingYear = await AcademicYear.findOne({
    startDate: { $lte: end },
    endDate: { $gte: start },
  });

  if (overlappingYear) {
    throw new OverlappingAcademicYearError(
      "Academic year date range overlaps with an existing academic year",
    );
  }

  // 6️⃣ Enforce Single Active Rule (if creating ACTIVE)
  if (resolvedStatus === "ACTIVE") {
    const existingActive = await AcademicYear.findOne({
      status: "ACTIVE",
    });

    if (existingActive) {
      throw new AcademicYearAlreadyActiveError(
        "Another academic year is already ACTIVE",
      );
    }
  }

  // 7️⃣ Create Academic Year
  const academicYear = await AcademicYear.create({
    name,
    startDate: start,
    endDate: end,
    status: resolvedStatus,
    createdBy: adminId,
    updatedBy: adminId,
  });

  return academicYear;
};

const activateAcademicYear = async (yearId, adminId) => {
  // 1️⃣ Validate year exists
  const targetYear = await AcademicYear.findById(yearId);

  if (!targetYear) {
    throw new AcademicYearNotFoundError("Academic year not found");
  }

  // 2️⃣ If already ACTIVE → return silently
  if (targetYear.status === "ACTIVE") {
    return targetYear;
  }

  // 3️⃣ Start transaction session
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // 4️⃣ Set all years to INACTIVE
      await AcademicYear.updateMany(
        {},
        {
          $set: {
            status: "INACTIVE",
            updatedBy: adminId,
          },
        },
        { session },
      );

      // 5️⃣ Activate target year
      await AcademicYear.updateOne(
        { _id: yearId },
        {
          $set: {
            status: "ACTIVE",
            updatedBy: adminId,
          },
        },
        { session },
      );
    });

    // 6️⃣ Return updated year
    const updatedYear = await AcademicYear.findById(yearId);

    return updatedYear;
  } catch (error) {
    throw error;
  } finally {
    session.endSession();
  }
};

const deactivateAcademicYear = async (yearId, adminId) => {
  // 1️⃣ Validate year exists
  const year = await AcademicYear.findById(yearId);

  if (!year) {
    throw new AcademicYearNotFoundError("Academic year not found");
  }

  // 2️⃣ If ACTIVE → not allowed
  if (year.status === "ACTIVE") {
    throw new AcademicYearDeactivationNotAllowedError(
      "Cannot deactivate an ACTIVE academic year directly. Use activateAcademicYear() to switch.",
    );
  }

  // 3️⃣ If already INACTIVE → return silently
  if (year.status === "INACTIVE") {
    return year;
  }

  // 4️⃣ Soft deactivate (defensive, though logically unreachable)
  year.status = "INACTIVE";
  year.updatedBy = adminId;

  await year.save();

  return year;
};

const listAcademicYears = async (filters = {}) => {
  return AcademicYear.find(filters).sort({ startDate: 1 });
};

const getActiveAcademicYear = async () => {
  return AcademicYear.findOne({ status: "ACTIVE" });
};

module.exports = {
  createAcademicYear,
  activateAcademicYear,
  deactivateAcademicYear,
  listAcademicYears,
  getActiveAcademicYear,

  AcademicYearNotFoundError,
  AcademicYearAlreadyActiveError,
  InvalidDateRangeError,
  OverlappingAcademicYearError,
  InvalidFirstYearStatusError,
  AcademicYearDeactivationNotAllowedError,
  AcademicYearValidationError,
};
