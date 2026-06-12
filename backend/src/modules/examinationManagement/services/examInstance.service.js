const mongoose = require("mongoose");

const AcademicYear = require("../../academicStructure/models/academicYear.model");
const Section = require("../../academicStructure/models/section.model");
const GradeSubjectMapping = require("../../academicStructure/models/gradeSubjectMapping.model");

const ExamInstance = require("../models/examInstance.model");
const ExamSubjectScope = require("../models/examSubjectScope.model");
const Grade = require("../../academicStructure/models/grade.model");

/*
  ==============================
  EXAM INSTANCE DOMAIN ERRORS
  ==============================
*/

class AcademicYearNotFoundError extends Error {}
class AcademicYearNotActiveError extends Error {}
class ExamInstancesAlreadyExistError extends Error {}
class NoSectionsFoundError extends Error {}
class NoGradeSubjectMappingFoundError extends Error {}

/*
  ==============================
  CREATE EXAM INSTANCES (FR-EXM-00)
  ==============================
*/

const createAcademicYearExamInstances = async ({
  academicYearId,
  halfYearlyExamDate,
  endTermExamDate,
}) => {
  // STEP 1 — Validate Academic Year

  const academicYear = await AcademicYear.findById(academicYearId);
  if (!academicYear) {
    throw new AcademicYearNotFoundError("Academic Year not found");
  }

  if (academicYear.status !== "ACTIVE") {
    throw new AcademicYearNotActiveError(
      "Academic Year must be ACTIVE to create exam instances",
    );
  }

  const existingInstances = await ExamInstance.find({ academicYearId });

  if (existingInstances.length > 0) {
    throw new ExamInstancesAlreadyExistError(
      "Exam instances already created for this Academic Year",
    );
  }

  // STEP 2 — Transaction Start

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Create two exam instances

      const [halfYearly, endTerm] = await ExamInstance.insertMany(
        [
          {
            academicYearId,
            type: "HALF_YEARLY",
            examDate: new Date(halfYearlyExamDate),
          },
          {
            academicYearId,
            type: "END_TERM",
            examDate: new Date(endTermExamDate),
          },
        ],
        { session },
      );

      const createdInstances = [halfYearly, endTerm];

      for (const instance of createdInstances) {
        // STEP 3 — Snapshot Creation (BR-EXM-10)

        // 1️⃣ Fetch ACTIVE grades for this Academic Year
        const grades = await Grade.find(
          { academicYearId, status: "ACTIVE" },
          null,
          { session },
        );

        if (grades.length === 0) {
          throw new NoSectionsFoundError(
            "No grades found for this Academic Year",
          );
        }

        const gradeIds = grades.map((g) => g._id);

        // 2️⃣ Fetch ACTIVE sections under those grades
        const sections = await Section.find(
          { gradeId: { $in: gradeIds }, status: "ACTIVE" },
          null,
          { session },
        );

        if (sections.length === 0) {
          throw new NoSectionsFoundError(
            "No sections found for this Academic Year",
          );
        }

        for (const gradeId of gradeIds) {
          const mappings = await GradeSubjectMapping.find({ gradeId }, null, {
            session,
          });

          if (mappings.length === 0) {
            throw new NoGradeSubjectMappingFoundError(
              "No Grade-Subject mapping found for grade",
            );
          }

          const snapshotDocs = mappings.map((mapping) => ({
            examInstanceId: instance._id,
            gradeId,
            subjectId: mapping.subjectId,
          }));

          await ExamSubjectScope.insertMany(snapshotDocs, { session });
        }
      }
    });
  } catch (error) {
    throw error;
  } finally {
    session.endSession();
  }

  return { success: true };
};

/*
  ==============================
  GET EXAM INSTANCES BY YEAR
  ==============================
*/

const getExamInstancesByYear = async ({ academicYearId }) => {
  const instances = await ExamInstance.find({ academicYearId }).sort({
    examDate: 1,
  });

  return instances;
};

module.exports = {
  createAcademicYearExamInstances,
  getExamInstancesByYear,

  AcademicYearNotFoundError,
  AcademicYearNotActiveError,
  ExamInstancesAlreadyExistError,
  NoSectionsFoundError,
  NoGradeSubjectMappingFoundError,
};
