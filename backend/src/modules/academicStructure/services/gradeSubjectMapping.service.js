const mongoose = require("mongoose");

const GradeSubjectMapping = require("../models/gradeSubjectMapping.model");
const Grade = require("../models/grade.model");
const Subject = require("../models/subject.model");
const AcademicYear = require("../models/academicYear.model");

const {
  StructuralDependencyError,
  validateMappingHasNoOperationalUsage,
} = require("./validators/structuralDependency.validator");

/*
  =====================================
  Mapping Domain Errors
  =====================================
*/

class GradeNotFoundError extends Error {}
class SubjectNotFoundError extends Error {}
class MappingNotFoundError extends Error {}
class AcademicYearNotFoundError extends Error {}
class CurriculumCopyError extends Error {}

class GradeInactiveError extends Error {}
class SubjectInactiveError extends Error {}
class DuplicateActiveMappingError extends Error {}
class MappingValidationError extends Error {}

/*
  =====================================
  GradeSubjectMappingService
  =====================================
*/

const mapSubjectToGrade = async (data, adminId) => {
  const { gradeId, subjectId } = data;

  // 1️⃣ Required validation
  if (!gradeId || !subjectId) {
    throw new MappingValidationError("gradeId and subjectId are required");
  }

  // 2️⃣ Validate grade exists
  const grade = await Grade.findById(gradeId);

  if (!grade) {
    throw new GradeNotFoundError("Grade not found");
  }

  // 3️⃣ Validate subject exists
  const subject = await Subject.findById(subjectId);

  if (!subject) {
    throw new SubjectNotFoundError("Subject not found");
  }

  // 4️⃣ Grade must be ACTIVE
  if (grade.status === "INACTIVE") {
    throw new GradeInactiveError("Cannot map subject to an INACTIVE grade");
  }

  // 5️⃣ Subject must be ACTIVE
  if (subject.status === "INACTIVE") {
    throw new SubjectInactiveError("Cannot map an INACTIVE subject");
  }

  // 6️⃣ Check existing ACTIVE mapping
  const activeMapping = await GradeSubjectMapping.findOne({
    gradeId,
    subjectId,
    status: "ACTIVE",
  });

  if (activeMapping) {
    throw new DuplicateActiveMappingError(
      "Subject is already mapped to this grade",
    );
  }

  // 7️⃣ Check existing INACTIVE mapping
  const inactiveMapping = await GradeSubjectMapping.findOne({
    gradeId,
    subjectId,
    status: "INACTIVE",
  });

  if (inactiveMapping) {
    inactiveMapping.status = "ACTIVE";
    inactiveMapping.updatedBy = adminId;

    await inactiveMapping.save();

    return inactiveMapping;
  }

  // 8️⃣ Create new mapping
  const mapping = await GradeSubjectMapping.create({
    gradeId,
    subjectId,
    status: "ACTIVE",
    createdBy: adminId,
    updatedBy: adminId,
  });

  return mapping;
};

const unmapSubjectFromGrade = async (mappingId) => {
  // 1️⃣ Validate mapping exists
  const mapping = await GradeSubjectMapping.findById(mappingId);

  if (!mapping) {
    throw new MappingNotFoundError("Mapping not found");
  }

  // 2️⃣ Idempotent behavior
  if (mapping.status === "INACTIVE") {
    return mapping;
  }

  // 3️⃣ Validate no operational dependency
  await validateMappingHasNoOperationalUsage(mappingId);

  // 4️⃣ Soft deactivate
  mapping.status = "INACTIVE";

  await mapping.save();

  return mapping;
};

const listMappingsByGrade = async (gradeId) => {
  return GradeSubjectMapping.find({ gradeId }).sort({ createdAt: 1 });
};

const copyCurriculumFromPreviousYear = async ({
  sourceAcademicYearId,
  targetAcademicYearId,
  adminId,
}) => {
  // 1️⃣ Validate years
  const sourceYear = await AcademicYear.findById(sourceAcademicYearId);

  const targetYear = await AcademicYear.findById(targetAcademicYearId);

  if (!sourceYear || !targetYear) {
    throw new AcademicYearNotFoundError(
      "Source or target academic year not found",
    );
  }

  if (sourceAcademicYearId.toString() === targetAcademicYearId.toString()) {
    throw new CurriculumCopyError(
      "Source and target academic years must be different",
    );
  }

  // 2️⃣ Fetch grades
  const sourceGrades = await Grade.find({
    academicYearId: sourceAcademicYearId,
  });

  const targetGrades = await Grade.find({
    academicYearId: targetAcademicYearId,
  });

  // 3️⃣ Build grade name map
  const targetGradeMap = {};

  targetGrades.forEach((grade) => {
    targetGradeMap[grade.name] = grade._id.toString();
  });

  // 4️⃣ Validate structural completeness
  for (const sourceGrade of sourceGrades) {
    if (!targetGradeMap[sourceGrade.name]) {
      throw new CurriculumCopyError(
        `Missing grade '${sourceGrade.name}' in target academic year`,
      );
    }
  }

  // 5️⃣ Fetch source ACTIVE mappings
  const sourceGradeIds = sourceGrades.map((g) => g._id);

  const sourceMappings = await GradeSubjectMapping.find({
    gradeId: { $in: sourceGradeIds },
    status: "ACTIVE",
  });

  // 6️⃣ Pre-check duplicate ACTIVE mappings in target
  for (const mapping of sourceMappings) {
    const sourceGrade = sourceGrades.find(
      (g) => g._id.toString() === mapping.gradeId.toString(),
    );

    const targetGradeId = targetGradeMap[sourceGrade.name];

    const existingTargetMapping = await GradeSubjectMapping.findOne({
      gradeId: targetGradeId,
      subjectId: mapping.subjectId,
      status: "ACTIVE",
    });

    if (existingTargetMapping) {
      throw new CurriculumCopyError(
        "Duplicate ACTIVE mapping detected in target academic year",
      );
    }
  }

  // 7️⃣ Begin transaction
  const session = await mongoose.startSession();

  let copiedCount = 0;
  let skippedCount = 0;
  const failedSubjects = [];

  try {
    await session.withTransaction(async () => {
      for (const mapping of sourceMappings) {
        const subject = await Subject.findById(mapping.subjectId);

        if (!subject || subject.status === "INACTIVE") {
          failedSubjects.push(mapping.subjectId.toString());
          skippedCount++;
          continue;
        }

        const sourceGrade = sourceGrades.find(
          (g) => g._id.toString() === mapping.gradeId.toString(),
        );

        const targetGradeId = targetGradeMap[sourceGrade.name];

        await GradeSubjectMapping.create(
          [
            {
              gradeId: targetGradeId,
              subjectId: mapping.subjectId,
              status: "ACTIVE",
              createdBy: adminId,
              updatedBy: adminId,
            },
          ],
          { session },
        );

        copiedCount++;
      }
    });

    return {
      copiedCount,
      skippedCount,
      failedSubjects,
    };
  } catch (error) {
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  mapSubjectToGrade,
  unmapSubjectFromGrade,
  listMappingsByGrade,
  copyCurriculumFromPreviousYear,

  GradeNotFoundError,
  SubjectNotFoundError,
  GradeInactiveError,
  SubjectInactiveError,
  MappingNotFoundError,
  DuplicateActiveMappingError,
  AcademicYearNotFoundError,
  CurriculumCopyError,
  MappingValidationError,
};
