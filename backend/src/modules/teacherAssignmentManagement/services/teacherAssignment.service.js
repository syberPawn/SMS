const mongoose = require("mongoose");

const AcademicYear = require("../../academicStructure/models/academicYear.model");
const Grade = require("../../academicStructure/models/grade.model");
const Section = require("../../academicStructure/models/section.model");
const User = require("../../user/models/user.model");
const Enrollment = require("../../studentManagement/models/enrollments.model");
const Student = require("../../studentManagement/models/students.model");
const Teacher = require("../../teacherManagement/models/teacher.model");

const ClassTeacherAssignment = require("../models/classTeacherAssignment.model");

/*
  ==============================
  CUSTOM ERROR CLASSES
  ==============================
*/

class AcademicYearNotFoundError extends Error {}
class AcademicYearNotActiveError extends Error {}

class SectionNotFoundError extends Error {}
class SectionNotActiveError extends Error {}
class SectionAcademicYearMismatchError extends Error {}

class TeacherNotFoundError extends Error {}
class TeacherNotActiveError extends Error {}
class InvalidTeacherRoleError extends Error {}
class TeacherAlreadyClassTeacherError extends Error {}

class ClassTeacherAssignmentNotFoundError extends Error {}
class SectionAlreadyHasClassTeacherError extends Error {}

class SubjectNotFoundError extends Error {}
class SubjectNotActiveError extends Error {}
class ReservedSubjectAssignmentError extends Error {}
class SubjectNotMappedToGradeError extends Error {}
class SubjectAlreadyAssignedError extends Error {}
class SubjectTeacherAssignmentNotFoundError extends Error {}

class NoActiveAcademicYearFoundError extends Error {}
class StudentProfileNotFoundError extends Error {}
class ActiveEnrollmentNotFoundError extends Error {}
class UnauthorizedAttendanceError extends Error {}
class UnauthorizedSubjectHomeworkError extends Error {}
class UnauthorizedGeneralHomeworkError extends Error {}
/*
  ==============================
  CLASS TEACHER ASSIGNMENT
  ==============================
*/

/*
  assignClassTeacher
*/
const assignClassTeacher = async ({ teacherId, sectionId, academicYearId }) => {
  // 1️⃣ Validate Academic Year
  const academicYear = await AcademicYear.findById(academicYearId);
  if (!academicYear) {
    throw new AcademicYearNotFoundError("Academic Year not found");
  }

  if (academicYear.status !== "ACTIVE") {
    throw new AcademicYearNotActiveError("Academic Year is not ACTIVE");
  }

  // 2️⃣ Validate Section
  const section = await Section.findById(sectionId);
  if (!section) {
    throw new SectionNotFoundError("Section not found");
  }

  if (section.status !== "ACTIVE") {
    throw new SectionNotActiveError("Section is not ACTIVE");
  }

  // 3️⃣ Validate Grade → Academic Year consistency
  const grade = await Grade.findById(section.gradeId);
  if (!grade) {
    throw new SectionNotFoundError("Grade not found for section");
  }

  if (grade.academicYearId.toString() !== academicYearId) {
    throw new SectionAcademicYearMismatchError(
      "Academic Year mismatch with Section",
    );
  }

  // 4️⃣ Validate Teacher
  const teacher = await User.findById(teacherId);
  if (!teacher) {
    throw new TeacherNotFoundError("Teacher not found");
  }

  if (teacher.role !== "TEACHER") {
    throw new InvalidTeacherRoleError("User is not a TEACHER");
  }

  if (teacher.status !== "ACTIVE") {
    throw new TeacherNotActiveError("Teacher is not ACTIVE");
  }

  // 5️⃣ Teacher uniqueness (BR-TAM-06)
  const existingTeacherAssignment = await ClassTeacherAssignment.findOne({
    teacherId,
    academicYearId,
  });

  if (existingTeacherAssignment) {
    throw new TeacherAlreadyClassTeacherError(
      "Teacher is already assigned as Class Teacher in this Academic Year",
    );
  }

  // 6️⃣ Section uniqueness (BR-TAM-05)
  const existingSectionAssignment = await ClassTeacherAssignment.findOne({
    sectionId,
    academicYearId,
  });

  if (existingSectionAssignment) {
    throw new SectionAlreadyHasClassTeacherError(
      "Section already has a Class Teacher in this Academic Year",
    );
  }

  // 7️⃣ Create Assignment
  const assignment = await ClassTeacherAssignment.create({
    teacherId,
    sectionId,
    academicYearId,
  });

  return assignment;
};

/*
  replaceClassTeacher
*/
const replaceClassTeacher = async ({
  teacherId,
  sectionId,
  academicYearId,
}) => {
  // 1️⃣ Fetch existing assignment
  const assignment = await ClassTeacherAssignment.findOne({
    sectionId,
    academicYearId,
  });

  if (!assignment) {
    throw new ClassTeacherAssignmentNotFoundError(
      "Class Teacher assignment not found",
    );
  }

  // 2️⃣ Validate new teacher
  const teacher = await User.findById(teacherId);
  if (!teacher) {
    throw new TeacherNotFoundError("Teacher not found");
  }

  if (teacher.role !== "TEACHER") {
    throw new InvalidTeacherRoleError("User is not a TEACHER");
  }

  if (teacher.status !== "ACTIVE") {
    throw new TeacherNotActiveError("Teacher is not ACTIVE");
  }

  // 3️⃣ Ensure teacher not already Class Teacher elsewhere
  const existingTeacherAssignment = await ClassTeacherAssignment.findOne({
    teacherId,
    academicYearId,
  });

  if (
    existingTeacherAssignment &&
    existingTeacherAssignment.sectionId.toString() !== sectionId
  ) {
    throw new TeacherAlreadyClassTeacherError(
      "Teacher is already assigned as Class Teacher in this Academic Year",
    );
  }

  // 4️⃣ Atomic update (FR-TAM-03)
  assignment.teacherId = teacherId;
  await assignment.save();

  return assignment;
};

const Subject = require("../../academicStructure/models/subject.model");
const GradeSubjectMapping = require("../../academicStructure/models/gradeSubjectMapping.model");

const SubjectTeacherAssignment = require("../models/subjectTeacherAssignment.model");

/*
  ==============================
  SUBJECT TEACHER ASSIGNMENT
  ==============================
*/

/*
  assignSubjectTeacher
*/
const assignSubjectTeacher = async ({
  teacherId,
  sectionId,
  subjectId,
  academicYearId,
}) => {
  // 1️⃣ Validate Academic Year
  const academicYear = await AcademicYear.findById(academicYearId);
  if (!academicYear) {
    throw new AcademicYearNotFoundError("Academic Year not found");
  }

  if (academicYear.status !== "ACTIVE") {
    throw new AcademicYearNotActiveError("Academic Year is not ACTIVE");
  }

  // 2️⃣ Validate Section
  const section = await Section.findById(sectionId);
  if (!section) {
    throw new SectionNotFoundError("Section not found");
  }

  if (section.status !== "ACTIVE") {
    throw new SectionNotActiveError("Section is not ACTIVE");
  }

  // 3️⃣ Validate Grade → Academic Year consistency
  const grade = await Grade.findById(section.gradeId);
  if (!grade) {
    throw new SectionNotActiveError("Grade not found for section");
  }

  if (grade.academicYearId.toString() !== academicYearId) {
    throw new SectionAcademicYearMismatchError(
      "Academic Year mismatch with Section",
    );
  }

  // 4️⃣ Validate Teacher
  const teacher = await User.findById(teacherId);
  if (!teacher) {
    throw new TeacherNotFoundError("Teacher not found");
  }

  if (teacher.role !== "TEACHER") {
    throw new InvalidTeacherRoleError("User is not a TEACHER");
  }

  if (teacher.status !== "ACTIVE") {
    throw new TeacherNotActiveError("Teacher is not ACTIVE");
  }

  // 5️⃣ Validate Subject
  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw new SubjectNotFoundError("Subject not found");
  }

  if (subject.status !== "ACTIVE") {
    throw new SubjectNotActiveError("Subject is not ACTIVE");
  }

  // 6️⃣ Reserved Subject Enforcement (BR-TAM-11)
  if (subject.isReserved === true) {
    throw new ReservedSubjectAssignmentError(
      "Reserved subject cannot be assigned",
    );
  }

  // 7️⃣ Curriculum Validation (BR-TAM-02)
  const mapping = await GradeSubjectMapping.findOne({
    gradeId: grade._id,
    subjectId,
    status: "ACTIVE",
  });

  if (!mapping) {
    throw new SubjectNotMappedToGradeError(
      "Subject is not mapped to the grade for this Academic Year",
    );
  }

  // 8️⃣ Uniqueness (BR-TAM-07)
  const existingAssignment = await SubjectTeacherAssignment.findOne({
    sectionId,
    subjectId,
    academicYearId,
  });

  if (existingAssignment) {
    throw new SubjectAlreadyAssignedError(
      "Subject already assigned to a teacher in this Section and Academic Year",
    );
  }

  // 9️⃣ Create Assignment
  const assignment = await SubjectTeacherAssignment.create({
    teacherId,
    sectionId,
    subjectId,
    academicYearId,
  });

  return assignment;
};

/*
  replaceSubjectTeacher
*/
const replaceSubjectTeacher = async ({
  teacherId,
  sectionId,
  subjectId,
  academicYearId,
}) => {
  // 1️⃣ Fetch existing assignment
  const assignment = await SubjectTeacherAssignment.findOne({
    sectionId,
    subjectId,
    academicYearId,
  });

  if (!assignment) {
    throw new SubjectTeacherAssignmentNotFoundError(
      "Subject Teacher assignment not found",
    );
  }

  // 2️⃣ Validate new teacher
  const teacher = await User.findById(teacherId);
  if (!teacher) {
    throw new TeacherNotFoundError("Teacher not found");
  }

  if (teacher.role !== "TEACHER") {
    throw new InvalidTeacherRoleError("User is not a TEACHER");
  }

  if (teacher.status !== "ACTIVE") {
    throw new TeacherNotActiveError("Teacher is not ACTIVE");
  }

  // 3️⃣ Atomic update (FR-TAM-03)
  assignment.teacherId = teacherId;
  await assignment.save();

  return assignment;
};

/*
  ==============================
  READ OPERATIONS
  ==============================
*/

const getClassTeacher = async ({ sectionId, academicYearId }) => {
  return ClassTeacherAssignment.findOne({
    sectionId,
    academicYearId,
  });
};

const getSubjectTeachers = async ({ sectionId, academicYearId }) => {
  return SubjectTeacherAssignment.find({
    sectionId,
    academicYearId,
  });
};

const getTeacherAssignments = async ({ teacherId, academicYearId }) => {
  const classAssignments = await ClassTeacherAssignment.find({
    teacherId,
    academicYearId,
  });

  const subjectAssignments = await SubjectTeacherAssignment.find({
    teacherId,
    academicYearId,
  })
    .populate("subjectId", "name")
    .populate({
      path: "sectionId",
      select: "name gradeId",
      populate: {
        path: "gradeId",
        select: "name",
      },
    });

  return {
    classAssignments,
    subjectAssignments,
  };
};

const getAssignmentsByAcademicYear = async ({ academicYearId }) => {
  const classAssignments = await ClassTeacherAssignment.find({
    academicYearId,
  });

  const subjectAssignments = await SubjectTeacherAssignment.find({
    academicYearId,
  });

  return {
    classAssignments,
    subjectAssignments,
  };
};

/*
  ==============================
  STUDENT READ OPERATIONS
  ==============================
*/

const formatTeacherProfile = (teacher) => {
  if (!teacher) {
    return null;
  }

  return {
    teacherId: teacher.userId,
    fullName: teacher.fullName,
    highestQualification: teacher.highestQualification,
    qualificationDetail: teacher.qualificationDetail,
  };
};

const getStudentMyTeachers = async ({ userId, academicYearId }) => {
  const academicYear = academicYearId
    ? await AcademicYear.findById(academicYearId)
    : await resolveActiveAcademicYear();

  if (!academicYear) {
    throw new AcademicYearNotFoundError("Academic Year not found");
  }

  const student = await Student.findOne({
    userId,
    identityStatus: "ACTIVE",
  });

  if (!student) {
    throw new StudentProfileNotFoundError("Student profile not found");
  }

  const enrollment = await Enrollment.findOne({
    studentId: student._id,
    academicYearId: academicYear._id,
    enrollmentStatus: "ACTIVE",
  });

  if (!enrollment) {
    throw new ActiveEnrollmentNotFoundError("Active enrollment not found");
  }

  const section = await Section.findById(enrollment.sectionId);

  if (!section) {
    throw new SectionNotFoundError("Section not found");
  }

  const grade = await Grade.findById(section.gradeId);

  const [classTeacherAssignment, subjectTeacherAssignments] = await Promise.all([
    ClassTeacherAssignment.findOne({
      sectionId: enrollment.sectionId,
      academicYearId: academicYear._id,
    }),
    SubjectTeacherAssignment.find({
      sectionId: enrollment.sectionId,
      academicYearId: academicYear._id,
    }),
  ]);

  const teacherIds = [
    classTeacherAssignment?.teacherId,
    ...subjectTeacherAssignments.map((assignment) => assignment.teacherId),
  ].filter(Boolean);
  const subjectIds = subjectTeacherAssignments.map(
    (assignment) => assignment.subjectId,
  );

  const [teachers, subjects] = await Promise.all([
    Teacher.find({
      userId: { $in: teacherIds },
      status: "ACTIVE",
    }),
    Subject.find({
      _id: { $in: subjectIds },
    }),
  ]);

  const teachersByUserId = new Map(
    teachers.map((teacher) => [teacher.userId.toString(), teacher]),
  );
  const subjectsById = new Map(
    subjects.map((subject) => [subject._id.toString(), subject]),
  );

  const subjectTeachers = subjectTeacherAssignments
    .map((assignment) => {
      const subject = subjectsById.get(assignment.subjectId.toString());
      const teacher = teachersByUserId.get(assignment.teacherId.toString());
      const teacherProfile = formatTeacherProfile(teacher);

      return {
        subjectId: assignment.subjectId,
        subjectName: subject?.name || "Unknown",
        subjectCode: subject?.code || null,
        teacherId: teacherProfile?.teacherId || assignment.teacherId,
        fullName: teacherProfile?.fullName || null,
        highestQualification: teacherProfile?.highestQualification || null,
        qualificationDetail: teacherProfile?.qualificationDetail || null,
      };
    })
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName));

  return {
    academicYearId: academicYear._id,
    academicYearName: academicYear.name,
    section: {
      sectionId: section._id,
      sectionName: section.name,
      gradeId: section.gradeId,
      gradeName: grade?.name || null,
    },
    classTeacher: formatTeacherProfile(
      classTeacherAssignment
        ? teachersByUserId.get(classTeacherAssignment.teacherId.toString())
        : null,
    ),
    subjectTeachers,
  };
};

/*
  ==============================
  AUTHORITY DERIVATION
  ==============================
*/

const resolveActiveAcademicYear = async () => {
  const academicYear = await AcademicYear.findOne({ status: "ACTIVE" });
  if (!academicYear) {
    throw new NoActiveAcademicYearFoundError("No ACTIVE Academic Year found");
  }
  return academicYear;
};

const validateAttendanceCreate = async (teacherId, sectionId) => {
  const activeYear = await resolveActiveAcademicYear();

  const assignment = await ClassTeacherAssignment.findOne({
    teacherId,
    sectionId,
    academicYearId: activeYear._id,
  });

  if (!assignment) {
    throw new UnauthorizedAttendanceError(
      "Unauthorized: Not Class Teacher of this section",
    );
  }

  return true;
};

const validateAttendanceEdit = async (teacherId, sectionId) => {
  return validateAttendanceCreate(teacherId, sectionId);
};

const validateAttendanceDelete = async (teacherId, sectionId) => {
  return validateAttendanceCreate(teacherId, sectionId);
};

const validateSubjectHomeworkAuthority = async (
  teacherId,
  sectionId,
  subjectId,
) => {
  const activeYear = await resolveActiveAcademicYear();

  const assignment = await SubjectTeacherAssignment.findOne({
    teacherId,
    sectionId,
    subjectId,
    academicYearId: activeYear._id,
  });

  if (!assignment) {
    throw new UnauthorizedSubjectHomeworkError(
      "Unauthorized: Not assigned to this subject",
    );
  }

  return true;
};

const validateGeneralHomeworkAuthority = async (
  teacherId,
  sectionId,
  subjectId,
) => {
  const activeYear = await resolveActiveAcademicYear();

  const classAssignment = await ClassTeacherAssignment.findOne({
    teacherId,
    sectionId,
    academicYearId: activeYear._id,
  });

  if (!classAssignment) {
    throw new UnauthorizedAttendanceError(
      "Unauthorized: Not Class Teacher of this section",
    );
  }

  const subject = await Subject.findById(subjectId);

  if (!subject || subject.isReserved !== true) {
    throw new UnauthorizedGeneralHomeworkError(
      "General homework must use reserved subject",
    );
  }

  return true;
};

module.exports = {
  assignClassTeacher,
  replaceClassTeacher,
  assignSubjectTeacher,
  replaceSubjectTeacher,
  getClassTeacher,
  getSubjectTeachers,
  getTeacherAssignments,
  getAssignmentsByAcademicYear,
  getStudentMyTeachers,
  validateAttendanceCreate,
  validateAttendanceEdit,
  validateAttendanceDelete,
  validateSubjectHomeworkAuthority,
  validateGeneralHomeworkAuthority,

  //ERRORS
  AcademicYearNotFoundError,
  AcademicYearNotActiveError,
  SectionNotFoundError,
  SectionNotActiveError,
  SectionAcademicYearMismatchError,
  TeacherNotFoundError,
  TeacherNotActiveError,
  InvalidTeacherRoleError,
  TeacherAlreadyClassTeacherError,
  ClassTeacherAssignmentNotFoundError,
  SectionAlreadyHasClassTeacherError,
  SubjectNotFoundError,
  SubjectNotActiveError,
  ReservedSubjectAssignmentError,
  SubjectNotMappedToGradeError,
  SubjectAlreadyAssignedError,
  SubjectTeacherAssignmentNotFoundError,
  NoActiveAcademicYearFoundError,
  StudentProfileNotFoundError,
  ActiveEnrollmentNotFoundError,
  UnauthorizedAttendanceError,
  UnauthorizedSubjectHomeworkError,
  UnauthorizedGeneralHomeworkError,
};
