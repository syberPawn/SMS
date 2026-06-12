const Enrollment = require("../models/enrollments.model");
const Student = require("../models/students.model");

const AcademicYear = require("../../academicStructure/models/academicYear.model");
const Section = require("../../academicStructure/models/section.model");
const Grade = require("../../academicStructure/models/grade.model");

/*
  ======================================
  Enrollment Domain Errors
  ======================================
*/

class EnrollmentNotFoundError extends Error {}
class EnrollmentAlreadyExistsError extends Error {}
class AcademicYearNotFoundError extends Error {}
class AcademicYearNotActiveError extends Error {}
class AcademicYearInactiveWindowError extends Error {}
class SectionNotFoundError extends Error {}
class SectionAcademicYearMismatchError extends Error {}
class StudentNotFoundError extends Error {}
class InvalidEnrollmentStatusTransitionError extends Error {}
class ActiveEnrollmentOverlapError extends Error {}
class EnrollmentClassUpdateNotAllowedError extends Error {}
class EnrollmentStatusUpdateNotAllowedError extends Error {}
class UnauthorizedEnrollmentAccessError extends Error {}

/*
  ======================================
  Utility: Academic Year Active Check
  ======================================
*/

const validateAcademicYearIsActive = (academicYear) => {
  if (!academicYear) {
    throw new AcademicYearNotFoundError("Academic year not found");
  }

  if (academicYear.status !== "ACTIVE") {
    throw new AcademicYearNotActiveError("Academic year is not ACTIVE");
  }

  const now = new Date();
  if (now < academicYear.startDate || now > academicYear.endDate) {
    throw new AcademicYearInactiveWindowError(
      "Current date is outside academic year window",
    );
  }
};

/*
  ======================================
  Utility: Overlap Check (BR-SM-12)
  ======================================
*/

const validateNoActiveOverlap = async (
  studentId,
  targetAcademicYear,
  excludeEnrollmentId = null,
) => {
  const enrollments = await Enrollment.find({
    studentId,
    enrollmentStatus: "ACTIVE",
  });

  for (const enrollment of enrollments) {
    if (
      excludeEnrollmentId &&
      enrollment._id.toString() === excludeEnrollmentId.toString()
    ) {
      continue;
    }

    const year = await AcademicYear.findById(enrollment.academicYearId);

    if (!year) continue;

    const overlap =
      targetAcademicYear.startDate <= year.endDate &&
      year.startDate <= targetAcademicYear.endDate;

    if (overlap) {
      throw new ActiveEnrollmentOverlapError(
        "Student already has ACTIVE enrollment in overlapping academic year",
      );
    }
  }
};

/*
  ======================================
  Status Transition Matrix (BR-SM-11)
  ======================================
*/

const allowedTransitions = {
  ACTIVE: ["PROMOTED", "REPEATING", "WITHDRAWN", "COMPLETED"],
  REPEATING: ["PROMOTED", "WITHDRAWN"],
  PROMOTED: [],
  COMPLETED: [],
  WITHDRAWN: [],
};

/*
  ======================================
  1️⃣ Create Enrollment (FR-SM-04)
  ======================================
*/

const createEnrollment = async (data, adminId) => {
  const { studentId, academicYearId, sectionId } = data;

  // 1️⃣ Student must exist
  const student = await Student.findById(studentId);
  if (!student) throw new StudentNotFoundError("Student not found");

  // 2️⃣ Academic Year validation
  const academicYear = await AcademicYear.findById(academicYearId);
  validateAcademicYearIsActive(academicYear);

  // 3️⃣ Section validation
  const section = await Section.findById(sectionId);
  if (!section) throw new SectionNotFoundError("Section not found");

  const grade = await Grade.findById(section.gradeId);
  if (!grade)
    throw new SectionAcademicYearMismatchError("Invalid section hierarchy");

  if (grade.academicYearId.toString() !== academicYearId) {
    throw new SectionAcademicYearMismatchError(
      "Section does not belong to provided academic year",
    );
  }

  // 4️⃣ Unique enrollment per year
  const existing = await Enrollment.findOne({
    studentId,
    academicYearId,
  });
  if (existing) {
    throw new EnrollmentAlreadyExistsError(
      "Enrollment already exists for this academic year",
    );
  }

  // 5️⃣ Active overlap check (BR-SM-12)
  await validateNoActiveOverlap(studentId, academicYear);

  // 6️⃣ Create with default ACTIVE (BR-SM-15)
  const enrollment = await Enrollment.create({
    studentId,
    academicYearId,
    sectionId,
    enrollmentStatus: "ACTIVE",
  });

  return enrollment;
};

/*
  ======================================
  2️⃣ Update Enrollment Class (FR-SM-05)
  ======================================
*/

const updateEnrollmentClass = async (enrollmentId, newSectionId) => {
  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) throw new EnrollmentNotFoundError("Enrollment not found");

  if (enrollment.enrollmentStatus !== "ACTIVE") {
    throw new EnrollmentClassUpdateNotAllowedError(
      "Class update allowed only when enrollment is ACTIVE",
    );
  }

  const academicYear = await AcademicYear.findById(enrollment.academicYearId);
  if (!academicYear)
    throw new AcademicYearNotFoundError("Academic year not found");

  const section = await Section.findById(newSectionId);
  if (!section) throw new SectionNotFoundError("Section not found");

  const grade = await Grade.findById(section.gradeId);
  if (!grade)
    throw new SectionAcademicYearMismatchError("Invalid section hierarchy");

  if (
    grade.academicYearId.toString() !== enrollment.academicYearId.toString()
  ) {
    throw new SectionAcademicYearMismatchError(
      "Section does not belong to enrollment academic year",
    );
  }

  enrollment.sectionId = newSectionId;
  await enrollment.save();

  return enrollment;
};

/*
  ======================================
  3️⃣ Update Enrollment Status (FR-SM-08)
  ======================================
*/

const updateEnrollmentStatus = async (enrollmentId, newStatus) => {
  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) throw new EnrollmentNotFoundError("Enrollment not found");

  const academicYear = await AcademicYear.findById(enrollment.academicYearId);

  validateAcademicYearIsActive(academicYear);

  const currentStatus = enrollment.enrollmentStatus;

  const allowed = allowedTransitions[currentStatus] || [];

  if (!allowed.includes(newStatus)) {
    throw new InvalidEnrollmentStatusTransitionError(
      "Invalid enrollment status transition",
    );
  }

  if (newStatus === "ACTIVE") {
    await validateNoActiveOverlap(
      enrollment.studentId,
      academicYear,
      enrollment._id,
    );
  }

  enrollment.enrollmentStatus = newStatus;
  await enrollment.save();

  return enrollment;
};

/*
  ======================================
  4️⃣ List Students (FR-SM-06)
  ======================================
*/

const listStudents = async (filters, requester) => {
  const { academicYearId, sectionId, name, admissionNumber } = filters;

  const academicYear = await AcademicYear.findById(academicYearId);
  if (!academicYear)
    throw new AcademicYearNotFoundError("Academic year not found");

  let enrollmentQuery = { academicYearId };

  if (sectionId) {
    enrollmentQuery.sectionId = sectionId;
  }

  const enrollments = await Enrollment.find(enrollmentQuery).populate(
    "sectionId",
    "name",
  );

  const studentIds = enrollments.map((e) => e.studentId);

  const studentQuery = { _id: { $in: studentIds } };

  if (name) {
    studentQuery.fullName = { $regex: name, $options: "i" };
  }

  if (admissionNumber) {
    studentQuery.admissionNumber = admissionNumber;
  }

  const students = await Student.find(studentQuery);

  return students.map((student) => {
    const enrollment = enrollments.find(
      (e) => e.studentId.toString() === student._id.toString(),
    );

    return {
      enrollmentId: enrollment._id,
      studentId: student._id,
      fullName: student.fullName,
      admissionNumber: student.admissionNumber,
      sectionId: enrollment.sectionId?._id,
      sectionName: enrollment.sectionId?.name,
      enrollmentStatus: enrollment.enrollmentStatus,
      identityStatus: student.identityStatus,
    };
  });
};

module.exports = {
  createEnrollment,
  updateEnrollmentClass,
  updateEnrollmentStatus,
  listStudents,

  EnrollmentNotFoundError,
  EnrollmentAlreadyExistsError,
  AcademicYearNotFoundError,
  AcademicYearNotActiveError,
  AcademicYearInactiveWindowError,
  SectionNotFoundError,
  SectionAcademicYearMismatchError,
  StudentNotFoundError,
  InvalidEnrollmentStatusTransitionError,
  ActiveEnrollmentOverlapError,
  EnrollmentClassUpdateNotAllowedError,
  EnrollmentStatusUpdateNotAllowedError,
  UnauthorizedEnrollmentAccessError,
};
