const AcademicYear = require("../../academicStructure/models/academicYear.model");
const Grade = require("../../academicStructure/models/grade.model");
const Enrollment = require("../../studentManagement/models/enrollments.model");

const MonthlyFees = require("../models/monthlyFees.model");

/*
  ==============================
  DOMAIN ERRORS
  ==============================
*/

class AcademicYearNotFoundError extends Error {}
class GradeNotFoundError extends Error {}
class FeeStructureAlreadyExistsError extends Error {}
class EnrollmentExistsForGradeError extends Error {}
class InvalidFeeAmountError extends Error {}

/*
  ==============================
  CREATE FEE STRUCTURE
  FR-FEE-01
  ==============================
*/

const createFeeStructure = async ({
  academicYearId,
  gradeId,
  monthlyAmount,
}) => {
  // STEP 1 — Validate Academic Year

  const academicYear = await AcademicYear.findById(academicYearId);
  if (!academicYear) {
    throw new AcademicYearNotFoundError("Academic Year not found");
  }

  // STEP 2 — Validate Grade

  const grade = await Grade.findById(gradeId);
  if (!grade) {
    throw new GradeNotFoundError("Grade not found");
  }

  // STEP 3 — Validate Amount

  if (monthlyAmount <= 0) {
    throw new InvalidFeeAmountError(
      "Monthly fee amount must be greater than 0",
    );
  }

  // STEP 4 — Ensure Fee Structure does not exist

  const existing = await MonthlyFees.findOne({
    academicYearId,
    gradeId,
  });

  if (existing) {
    throw new FeeStructureAlreadyExistsError(
      "Fee structure already exists for this grade and academic year",
    );
  }

  // STEP 5 — Ensure no enrollments exist for grade + academic year

  const enrollmentExists = await Enrollment.exists({
    academicYearId,
    gradeId,
  });

  if (enrollmentExists) {
    throw new EnrollmentExistsForGradeError(
      "Cannot create fee structure after enrollments exist for this grade and academic year",
    );
  }

  // STEP 6 — Create Fee Structure

  const feeStructure = await MonthlyFees.create({
    academicYearId,
    gradeId,
    monthlyAmount,
  });

  return feeStructure;
};

/*
  ==============================
  GET FEE STRUCTURE
  ==============================
*/

const getFeeStructure = async ({ academicYearId, gradeId }) => {
  const query = {};

  if (academicYearId) {
    query.academicYearId = academicYearId;
  }

  if (gradeId) {
    query.gradeId = gradeId;
  }

  const baseQuery = MonthlyFees.find(query)
    .populate("academicYearId", "name status")
    .populate("gradeId", "name")
    .sort({ createdAt: -1 });

  if (academicYearId && gradeId) {
    const [structure] = await baseQuery.limit(1);
    return structure || null;
  }

  return await baseQuery;
};

module.exports = {
  createFeeStructure,
  getFeeStructure,

  AcademicYearNotFoundError,
  GradeNotFoundError,
  FeeStructureAlreadyExistsError,
  EnrollmentExistsForGradeError,
  InvalidFeeAmountError,
};
