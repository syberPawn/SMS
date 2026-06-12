const Grade = require("../models/grade.model");
const AcademicYear = require("../models/academicYear.model");

const {
  StructuralDependencyError,
  validateGradeHasNoActiveSections,
  validateGradeHasNoActiveMappings,
  validateSectionHasNoActiveEnrollments,
} = require("./validators/structuralDependency.validator");

/*
  =====================================
  Grade Domain Errors
  =====================================
*/

class GradeNotFoundError extends Error {}
class AcademicYearNotFoundError extends Error {}
class DuplicateGradeError extends Error {}
class MissingGradeFieldsError extends Error {}

/*
  =====================================
  GradeService
  =====================================
*/

const createGrade = async (data, adminId) => {
  const { name, academicYearId } = data;

  // 1️⃣ Required field validation
  if (!name || !academicYearId) {
    throw new MissingGradeFieldsError("Name and academic year are required");
  }

  // 2️⃣ Validate academic year exists
  const academicYear = await AcademicYear.findById(academicYearId);

  if (!academicYear) {
    throw new AcademicYearNotFoundError("Academic year not found");
  }

  // 3️⃣ Check if grade already exists
  const existingGrade = await Grade.findOne({
    name,
    academicYearId,
  });

  if (existingGrade) {
    return existingGrade;
  }

  // 4️⃣ Create new grade
  const grade = await Grade.create({
    name,
    academicYearId,
    status: "ACTIVE",
    createdBy: adminId,
    updatedBy: adminId,
  });

  return grade;
};

const deactivateGrade = async (gradeId) => {
  // 1️⃣ Validate grade exists
  const grade = await Grade.findById(gradeId);

  if (!grade) {
    throw new GradeNotFoundError("Grade not found");
  }

  // 2️⃣ If already INACTIVE → return silently
  if (grade.status === "INACTIVE") {
    return grade;
  }

  // 3️⃣ Validate no ACTIVE sections
  await validateGradeHasNoActiveSections(gradeId);

  // 4️⃣ Validate no ACTIVE mappings
  await validateGradeHasNoActiveMappings(gradeId);

  // 5️⃣ Soft deactivate
  grade.status = "INACTIVE";

  await grade.save();

  return grade;
};

const listGradesByAcademicYear = async (academicYearId) => {
  const year = await AcademicYear.findById(academicYearId);

  if (!year) {
    throw new AcademicYearNotFoundError("Academic year not found");
  }

  return Grade.find({ academicYearId }).sort({ name: 1 });
};

module.exports = {
  createGrade,
  deactivateGrade,
  listGradesByAcademicYear,

  StructuralDependencyError,
  validateSectionHasNoActiveEnrollments,
  GradeNotFoundError,
  AcademicYearNotFoundError,
  DuplicateGradeError,
  MissingGradeFieldsError,
};
