const Section = require("../models/section.model");
const Grade = require("../models/grade.model");

const {
  StructuralDependencyError,
  validateSectionHasNoActiveEnrollments,
  validateSectionHasNoActiveTeacherAssignments,
} = require("./validators/structuralDependency.validator");

/*
  =====================================
  Section Domain Errors
  =====================================
*/

class SectionNotFoundError extends Error {}
class GradeNotFoundError extends Error {}
class DuplicateSectionError extends Error {}
class InactiveGradeError extends Error {}
class MissingSectionFieldsError extends Error {}

/*
  =====================================
  SectionService
  =====================================
*/

const createSection = async (data, adminId) => {
  const { gradeId, name } = data;

  // 1️⃣ Required validation
  if (!gradeId || !name) {
    throw new MissingSectionFieldsError("Grade and section name are required");
  }

  // 2️⃣ Validate grade exists
  const grade = await Grade.findById(gradeId);

  if (!grade) {
    throw new GradeNotFoundError("Grade not found");
  }

  // 3️⃣ Grade must not be INACTIVE
  if (grade.status === "INACTIVE") {
    throw new InactiveGradeError(
      "Cannot create section under an INACTIVE grade",
    );
  }

  try {
    // 4️⃣ Create section
    const section = await Section.create({
      gradeId,
      name,
      status: "ACTIVE",
      createdBy: adminId,
      updatedBy: adminId,
    });

    return section;
  } catch (error) {
    // 5️⃣ Duplicate key handling
    if (error.code === 11000) {
      throw new DuplicateSectionError(
        "Section name must be unique within the grade",
      );
    }

    throw error;
  }
};

const deactivateSection = async (sectionId) => {
  // 1️⃣ Validate section exists
  const section = await Section.findById(sectionId);

  if (!section) {
    throw new SectionNotFoundError("Section not found");
  }

  // 2️⃣ If already INACTIVE → return silently
  if (section.status === "INACTIVE") {
    return section;
  }

  // 3️⃣ Validate no ACTIVE enrollments
  await validateSectionHasNoActiveEnrollments(sectionId);

  // 4️⃣ Validate no ACTIVE teacher assignments
  await validateSectionHasNoActiveTeacherAssignments(sectionId);

  // 5️⃣ Soft deactivate
  section.status = "INACTIVE";

  await section.save();

  return section;
};

const listSectionsByGrade = async (gradeId) => {
  const grade = await Grade.findById(gradeId);

  if (!grade) {
    throw new GradeNotFoundError("Grade not found");
  }

  return Section.find({ gradeId }).sort({ name: 1 });
};

module.exports = {
  createSection,
  deactivateSection,
  listSectionsByGrade,
  
  StructuralDependencyError,
  SectionNotFoundError,
  GradeNotFoundError,
  DuplicateSectionError,
  InactiveGradeError,
  MissingSectionFieldsError,
};
