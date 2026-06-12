const mongoose = require("mongoose");

const AcademicYear = require("../../academicStructure/models/academicYear.model");
const Section = require("../../academicStructure/models/section.model");
const Enrollment = require("../../studentManagement/models/enrollments.model");
const ClassTeacherAssignment = require("../../teacherAssignmentManagement/models/classTeacherAssignment.model");

const AttendanceEntry = require("../models/attendanceEntry.model");

/*
  ==============================
  ATTENDANCE DOMAIN ERRORS
  ==============================
*/

class AcademicYearNotFoundError extends Error {}
class AcademicYearNotActiveError extends Error {}

class SectionNotFoundError extends Error {}
class SectionNotActiveError extends Error {}
class SectionAcademicYearMismatchError extends Error {}

class UnauthorizedAttendanceError extends Error {}

class InvalidAttendanceDateError extends Error {}
class BackdatedAttendanceNotAllowedError extends Error {}
class FutureAttendanceNotAllowedError extends Error {}

class EnrollmentValidationError extends Error {}
class DuplicateAttendanceEntryError extends Error {}
class InvalidAttendanceStatusError extends Error {}

/*
  ==============================
  RECORD ATTENDANCE (FR-ATT-01)
  ==============================
*/

const recordAttendance = async ({
  teacherId,
  academicYearId,
  sectionId,
  attendanceDate,
  studentAttendanceList,
}) => {
  // STEP 1 — Referential Validation (DS-ATT-02)

  const academicYear = await AcademicYear.findById(academicYearId);
  if (!academicYear) {
    throw new AcademicYearNotFoundError("Academic Year not found");
  }

  if (academicYear.status !== "ACTIVE") {
    throw new AcademicYearNotActiveError("Academic Year is not ACTIVE");
  }

  const section = await Section.findById(sectionId);
  if (!section) {
    throw new SectionNotFoundError("Section not found");
  }

  if (section.status !== "ACTIVE") {
    throw new SectionNotActiveError("Section is not ACTIVE");
  }

  const Grade = require("../../academicStructure/models/grade.model");

  const grade = await Grade.findById(section.gradeId);

  if (!grade) {
    throw new SectionAcademicYearMismatchError("Grade not found for section");
  }

  if (grade.academicYearId.toString() !== academicYearId) {
    throw new SectionAcademicYearMismatchError(
      "Section does not belong to Academic Year",
    );
  }

  const assignment = await ClassTeacherAssignment.findOne({
    teacherId,
    sectionId,
    academicYearId,
  });

  if (!assignment) {
    throw new UnauthorizedAttendanceError(
      "Unauthorized: Not Class Teacher of this section",
    );
  }

  // STEP 2 — Date Validation (BR-ATT-09 strict order)

  const rawDate = new Date(attendanceDate);
  if (isNaN(rawDate.getTime())) {
    throw new InvalidAttendanceDateError("Invalid attendance date");
  }

  // Normalize to midnight (UTC equivalent of provided date)
  const normalizedDate = new Date(
    Date.UTC(
      rawDate.getUTCFullYear(),
      rawDate.getUTCMonth(),
      rawDate.getUTCDate(),
    ),
  );

  const startDate = new Date(academicYear.startDate);
  const endDate = new Date(academicYear.endDate);

  // 1️⃣ within academic year
  if (normalizedDate < startDate || normalizedDate > endDate) {
    throw new InvalidAttendanceDateError(
      "Attendance date outside Academic Year range",
    );
  }

  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  // 2️⃣ not future
  if (normalizedDate > today) {
    throw new FutureAttendanceNotAllowedError(
      "Attendance date cannot be in the future",
    );
  }

  // 3️⃣ not older than 3 calendar days
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setUTCDate(today.getUTCDate() - 3);

  if (normalizedDate < threeDaysAgo) {
    throw new BackdatedAttendanceNotAllowedError(
      "Attendance cannot be recorded beyond 3 calendar days",
    );
  }

  // STEP 3 — Enrollment Validation (BR-ATT-06 + batch completeness)

  const activeEnrollments = await Enrollment.find({
    sectionId,
    academicYearId,
    enrollmentStatus: "ACTIVE",
  });

  if (activeEnrollments.length !== studentAttendanceList.length) {
    throw new EnrollmentValidationError(
      "Attendance must include all ACTIVE enrollments",
    );
  }

  const activeEnrollmentIds = activeEnrollments.map((e) => e._id.toString());

  const submittedIds = studentAttendanceList.map((entry) => entry.enrollmentId);

  for (const id of activeEnrollmentIds) {
    if (!submittedIds.includes(id)) {
      throw new EnrollmentValidationError(
        "Missing attendance entry for ACTIVE enrollment",
      );
    }
  }

  for (const entry of studentAttendanceList) {
    const enrollment = activeEnrollments.find(
      (e) => e._id.toString() === entry.enrollmentId,
    );

    if (!enrollment) {
      throw new EnrollmentValidationError(
        "Invalid or non-ACTIVE enrollment provided",
      );
    }

    if (!["PRESENT", "ABSENT"].includes(entry.status)) {
      throw new InvalidAttendanceStatusError("Invalid attendance status value");
    }
  }

  // STEP 4 — Atomic Insert with Per-Student Uniqueness Check

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      for (const entry of studentAttendanceList) {
        const existing = await AttendanceEntry.findOne(
          {
            sectionId,
            academicYearId,
            enrollmentId: entry.enrollmentId,
            date: normalizedDate,
          },
          null,
          { session },
        );

        if (existing) {
          throw new DuplicateAttendanceEntryError(
            "Attendance already recorded for one or more students on this date",
          );
        }
      }

      const documents = studentAttendanceList.map((entry) => ({
        academicYearId,
        sectionId,
        enrollmentId: entry.enrollmentId,
        teacherId,
        date: normalizedDate,
        status: entry.status,
      }));

      await AttendanceEntry.insertMany(documents, { session });
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
  GET SECTION ATTENDANCE (FR-ATT-02)
  ==============================
*/

const Grade = require("../../academicStructure/models/grade.model");

const getSectionAttendance = async ({
  requestingUser,
  academicYearId,
  sectionId,
  startDate,
  endDate,
}) => {
  // 1️⃣ Validate Academic Year
  const academicYear = await AcademicYear.findById(academicYearId);
  if (!academicYear) {
    throw new AcademicYearNotFoundError("Academic Year not found");
  }

  // 2️⃣ Validate Section
  const section = await Section.findById(sectionId);
  if (!section) {
    throw new SectionNotFoundError("Section not found");
  }

  // 🔥 FIX 1 — Validate via Grade
  const grade = await Grade.findById(section.gradeId);
  if (!grade || grade.academicYearId.toString() !== academicYearId) {
    throw new SectionAcademicYearMismatchError(
      "Section does not belong to Academic Year",
    );
  }

  // 3️⃣ Authority Validation
  if (requestingUser.role === "TEACHER") {
    const assignment = await ClassTeacherAssignment.findOne({
      teacherId: requestingUser.userId, // 🔥 FIX 2
      sectionId,
      academicYearId,
    });

    if (!assignment) {
      throw new UnauthorizedAttendanceError(
        "Unauthorized: Not Class Teacher of this section",
      );
    }
  }

  const query = {
    academicYearId,
    sectionId,
  };

  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const attendance = await AttendanceEntry.find(query)
    .populate({
      path: "enrollmentId",
      populate: {
        path: "studentId",
        model: "Student",
      },
    })
    .sort({ date: 1 });
  return attendance;
};

/*
  ==============================
  GET STUDENT ATTENDANCE HISTORY (FR-ATT-02)
  ==============================
*/

const Student = require("../../studentManagement/models/students.model");

const getStudentAttendanceHistory = async ({
  requestingUser,
  academicYearId,
}) => {
  // 1️⃣ Ensure student role
  if (requestingUser.role !== "STUDENT") {
    throw new UnauthorizedAttendanceError(
      "Unauthorized: Only STUDENT can access this endpoint",
    );
  }

  // 2️⃣ Fetch Student record
  const student = await Student.findOne({
    userId: requestingUser.userId,
  });

  if (!student) {
    throw new SectionNotFoundError("Student record not found");
  }

  // 3️⃣ Fetch Enrollment for academic year
  const enrollment = await Enrollment.findOne({
    studentId: student._id,
    academicYearId,
  });

  if (!enrollment) {
    return []; // No enrollment means no attendance
  }

  // 4️⃣ Fetch Attendance
  const attendance = await AttendanceEntry.find({
    enrollmentId: enrollment._id,
    academicYearId,
  }).sort({ date: 1 });

  return attendance;
};

/*
  ==============================
  GET STUDENT ATTENDANCE PERCENTAGE (FR-ATT-03)
  ==============================
*/

const getStudentAttendancePercentage = async ({
  requestingUser,
  academicYearId,
}) => {
  // 1️⃣ Ensure student role
  if (requestingUser.role !== "STUDENT") {
    throw new UnauthorizedAttendanceError(
      "Unauthorized: Only STUDENT can access this endpoint",
    );
  }

  // 2️⃣ Find Student record using userId
  const student = await Student.findOne({
    userId: requestingUser.userId,
  });

  if (!student) {
    return null;
  }

  // 3️⃣ Find enrollment for academic year
  const enrollment = await Enrollment.findOne({
    studentId: student._id,
    academicYearId,
  });

  if (!enrollment) {
    return null;
  }

  // 4️⃣ Fetch attendance entries
  const attendanceEntries = await AttendanceEntry.find({
    enrollmentId: enrollment._id,
    academicYearId,
  });

  const totalEntries = attendanceEntries.length;

  if (totalEntries === 0) {
    return null;
  }

  const presentCount = attendanceEntries.filter(
    (entry) => entry.status === "PRESENT",
  ).length;

  const percentage = (presentCount / totalEntries) * 100;

  return percentage;
};

/*
  ==============================
  GET SECTION ATTENDANCE PERCENTAGE (FR-ATT-03)
  ==============================
*/

const getSectionAttendancePercentage = async ({
  sectionId,
  academicYearId,
}) => {
  // 1️⃣ Fetch attendance entries for section + academic year
  const attendanceEntries = await AttendanceEntry.find({
    sectionId,
    academicYearId,
  });

  if (attendanceEntries.length === 0) {
    return null; // No attendance recorded
  }

  // 2️⃣ Group entries by enrollmentId
  const enrollmentMap = {};

  for (const entry of attendanceEntries) {
    const enrollmentId = entry.enrollmentId.toString();

    if (!enrollmentMap[enrollmentId]) {
      enrollmentMap[enrollmentId] = {
        total: 0,
        present: 0,
      };
    }

    enrollmentMap[enrollmentId].total += 1;

    if (entry.status === "PRESENT") {
      enrollmentMap[enrollmentId].present += 1;
    }
  }

  const enrollmentIds = Object.keys(enrollmentMap);

  if (enrollmentIds.length === 0) {
    return null; // No qualifying students
  }

  // 3️⃣ Compute individual percentages
  let sumOfPercentages = 0;
  let studentCount = 0;

  for (const id of enrollmentIds) {
    const { total, present } = enrollmentMap[id];

    if (total === 0) {
      continue; // Exclude zero-entry (defensive)
    }

    const individualPercentage = (present / total) * 100;

    sumOfPercentages += individualPercentage;
    studentCount += 1;
  }

  if (studentCount === 0) {
    return null;
  }

  // 4️⃣ Unweighted arithmetic mean
  const sectionPercentage = sumOfPercentages / studentCount;

  return sectionPercentage;
};

module.exports = {
  recordAttendance,
  getSectionAttendance,
  getStudentAttendanceHistory,
  getStudentAttendancePercentage,
  getSectionAttendancePercentage,

  AcademicYearNotFoundError,
  AcademicYearNotActiveError,
  SectionNotFoundError,
  SectionNotActiveError,
  SectionAcademicYearMismatchError,
  UnauthorizedAttendanceError,
  InvalidAttendanceDateError,
  BackdatedAttendanceNotAllowedError,
  FutureAttendanceNotAllowedError,
  EnrollmentValidationError,
  DuplicateAttendanceEntryError,
  InvalidAttendanceStatusError,
};
