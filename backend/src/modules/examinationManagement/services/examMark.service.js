const mongoose = require("mongoose");

const AcademicYear = require("../../academicStructure/models/academicYear.model");
const Section = require("../../academicStructure/models/section.model");
const Subject = require("../../academicStructure/models/subject.model");
const Enrollment = require("../../studentManagement/models/enrollments.model");
const SubjectTeacherAssignment = require("../../teacherAssignmentManagement/models/subjectTeacherAssignment.model");
const User = require("../../user/models/user.model");
const Student = require("../../studentManagement/models/students.model");

const ExamInstance = require("../models/examInstance.model");
const ExamSubjectScope = require("../models/examSubjectScope.model");
const ExamMark = require("../models/examMark.model");
const Grade = require("../../academicStructure/models/grade.model");

/*
  ==============================
  EXAM MARK DOMAIN ERRORS
  ==============================
*/

class ExamInstanceNotFoundError extends Error {}
class AcademicYearNotActiveError extends Error {}
class SectionNotFoundError extends Error {}
class SectionNotActiveError extends Error {}
class SectionAcademicYearMismatchError extends Error {}

class TeacherNotFoundError extends Error {}
class UnauthorizedMarkEntryError extends Error {}

class SubjectNotFoundError extends Error {}
class SubjectNotActiveError extends Error {}
class SubjectNotInSnapshotError extends Error {}

class EnrollmentEligibilityError extends Error {}
class AtomicSubmissionMismatchError extends Error {}
class DuplicateMarkEntryError extends Error {}
class InvalidMarksValueError extends Error {}
class ExamDateNotReachedError extends Error {}

/*
  ==============================
  SUBMIT SUBJECT MARKS
  ==============================
*/

const submitSubjectMarks = async ({
  examInstanceId,
  sectionId,
  subjectId,
  teacherId,
  marks,
}) => {
  /*
    STEP 1 — Validate ExamInstance
  */

  const examInstance = await ExamInstance.findById(examInstanceId);
  if (!examInstance) {
    throw new ExamInstanceNotFoundError("Exam instance not found");
  }

  const academicYear = await AcademicYear.findById(examInstance.academicYearId);

  if (!academicYear || academicYear.status !== "ACTIVE") {
    throw new AcademicYearNotActiveError("Academic Year must be ACTIVE");
  }

  const now = new Date();
  if (now < new Date(examInstance.examDate)) {
    throw new ExamDateNotReachedError(
      "Marks entry allowed only after exam date",
    );
  }

  /*
    STEP 2 — Validate Section
  */

  const section = await Section.findById(sectionId);
  if (!section) {
    throw new SectionNotFoundError("Section not found");
  }

  if (section.status !== "ACTIVE") {
    throw new SectionNotActiveError("Section is not ACTIVE");
  }

  const grade = await Grade.findById(section.gradeId);

  if (!grade) {
    throw new SectionAcademicYearMismatchError(
      "Section has invalid grade reference",
    );
  }

  if (!grade.academicYearId.equals(examInstance.academicYearId)) {
    throw new SectionAcademicYearMismatchError(
      "Section does not belong to Academic Year",
    );
  }

  /*
    STEP 3 — Validate Teacher Authorization
  */

  const teacher = await User.findById(teacherId);
  if (!teacher || teacher.role !== "TEACHER") {
    throw new TeacherNotFoundError("Invalid teacher");
  }

  const assignment = await SubjectTeacherAssignment.findOne({
    teacherId,
    sectionId,
    subjectId,
    academicYearId: examInstance.academicYearId,
  });

  if (!assignment) {
    throw new UnauthorizedMarkEntryError(
      "Teacher not assigned to subject in this section",
    );
  }

  /*
    STEP 4 — Validate Subject Snapshot
  */

  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw new SubjectNotFoundError("Subject not found");
  }

  if (subject.status !== "ACTIVE") {
    throw new SubjectNotActiveError("Subject is not ACTIVE");
  }

  const snapshotRecord = await ExamSubjectScope.findOne({
    examInstanceId,
    gradeId: section.gradeId,
    subjectId,
  });

  if (!snapshotRecord) {
    throw new SubjectNotInSnapshotError("Subject not part of exam snapshot");
  }

  /*
    STEP 5 — Determine Eligible Enrollments
  */

  const eligibleEnrollments = await Enrollment.find({
    sectionId,
    academicYearId: examInstance.academicYearId,
    enrollmentStatus: "ACTIVE",
  });

  const eligibleIds = eligibleEnrollments.map((e) => e._id.toString());

  /*
    STEP 6 — Atomic Submission Validation
  */

  if (marks.length !== eligibleIds.length) {
    throw new AtomicSubmissionMismatchError(
      "Marks must be submitted for all eligible students",
    );
  }

  const submittedIds = marks.map((m) => m.enrollmentId);

  for (const id of eligibleIds) {
    if (!submittedIds.includes(id)) {
      throw new AtomicSubmissionMismatchError(
        "Missing eligible enrollment in submission",
      );
    }
  }

  const uniqueIds = new Set(submittedIds);
  if (uniqueIds.size !== submittedIds.length) {
    throw new AtomicSubmissionMismatchError(
      "Duplicate enrollment in submission",
    );
  }

  /*
    STEP 7 — Raw Marks Validation
  */

  for (const entry of marks) {
    if (
      typeof entry.marksObtained !== "number" ||
      entry.marksObtained < 0 ||
      entry.marksObtained > 100
    ) {
      throw new InvalidMarksValueError("Marks must be between 0 and 100");
    }
  }

  /*
    STEP 8 — Duplicate Mark Entry Rule
  */

  const existing = await ExamMark.findOne({
    subjectId,
    sectionId,
    examInstanceId,
  });

  if (existing) {
    throw new DuplicateMarkEntryError(
      "Marks already submitted for this subject in this section",
    );
  }

  /*
    STEP 9 — Atomic Persistence
  */

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const documents = marks.map((entry) => ({
        examInstanceId,
        academicYearId: examInstance.academicYearId,
        sectionId,
        enrollmentId: entry.enrollmentId,
        subjectId,
        teacherId,
        marks: entry.marksObtained,
      }));

      await ExamMark.insertMany(documents, { session });
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
  VIEWING METHODS
  ==============================
*/

const getMarksForSubjectTeacher = async ({
  teacherId,
  examInstanceId,
  sectionId,
  subjectId,
}) => {
  const teacher = await User.findById(teacherId);
  if (!teacher || teacher.role !== "TEACHER") {
    throw new UnauthorizedMarkEntryError("Unauthorized");
  }

  const assignment = await SubjectTeacherAssignment.findOne({
    teacherId,
    sectionId,
    subjectId,
  });

  if (!assignment) {
    throw new UnauthorizedMarkEntryError("Unauthorized");
  }

  return ExamMark.find({
    examInstanceId,
    sectionId,
    subjectId,
  });
};

const getMarksForClassTeacher = async ({ sectionId, examInstanceId }) => {
  return ExamMark.find({
    sectionId,
    examInstanceId,
  });
};

const getMarksForAdmin = async (filters) => {
  return ExamMark.find(filters);
};

const getMarksForStudent = async ({ userId, examInstanceId }) => {
  // 1️⃣ Resolve Student profile
  const student = await Student.findOne({ userId });
  if (!student) {
    return [];
  }

  // 2️⃣ Resolve exam instance
  const examInstance = await ExamInstance.findById(examInstanceId);
  if (!examInstance) {
    return [];
  }

  // 3️⃣ Resolve active enrollment for that academic year
  const enrollment = await Enrollment.findOne({
    studentId: student._id,
    academicYearId: examInstance.academicYearId,
    enrollmentStatus: "ACTIVE",
  });

  if (!enrollment) {
    return [];
  }

  // 4️⃣ Return marks
  return ExamMark.find({
    enrollmentId: enrollment._id,
    examInstanceId,
  });
};

module.exports = {
  submitSubjectMarks,
  getMarksForSubjectTeacher,
  getMarksForClassTeacher,
  getMarksForAdmin,
  getMarksForStudent,

  ExamInstanceNotFoundError,
  AcademicYearNotActiveError,
  SectionNotFoundError,
  SectionNotActiveError,
  SectionAcademicYearMismatchError,
  TeacherNotFoundError,
  UnauthorizedMarkEntryError,
  SubjectNotFoundError,
  SubjectNotActiveError,
  SubjectNotInSnapshotError,
  EnrollmentEligibilityError,
  AtomicSubmissionMismatchError,
  DuplicateMarkEntryError,
  InvalidMarksValueError,
  ExamDateNotReachedError,
};
