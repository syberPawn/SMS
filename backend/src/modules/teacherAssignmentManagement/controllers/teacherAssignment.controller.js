const {
  assignClassTeacher,
  replaceClassTeacher,
  assignSubjectTeacher,
  replaceSubjectTeacher,
  getClassTeacher,
  getSubjectTeachers,
  getTeacherAssignments,
  getAssignmentsByAcademicYear,
  getStudentMyTeachers,

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
} = require("../services/teacherAssignment.service");

const {
  verifyAuthenticated,
  verifyRole,
  AuthorizationError,
} = require("../../user/services/authorization.service");

const {
  AuthenticationFailedError,
  AccountDeactivatedError,
  SessionExpiredError,
} = require("../../user/services/auth.service");

/*
  =====================================
  CLASS TEACHER
  =====================================
*/

const createClassTeacher = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await assignClassTeacher(req.body);

    return res.status(201).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

const updateClassTeacher = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await replaceClassTeacher(req.body);

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

/*
  =====================================
  SUBJECT TEACHER
  =====================================
*/

const createSubjectTeacher = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await assignSubjectTeacher(req.body);

    return res.status(201).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

const updateSubjectTeacher = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await replaceSubjectTeacher(req.body);

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

/*
  =====================================
  READ
  =====================================
*/

const getClassTeacherController = async (req, res) => {
  try {
    await verifyAuthenticated(req);

    const result = await getClassTeacher(req.query);

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

const getSubjectTeachersController = async (req, res) => {
  try {
    await verifyAuthenticated(req);

    const result = await getSubjectTeachers(req.query);

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

const getTeacherAssignmentsController = async (req, res) => {
  try {
    await verifyAuthenticated(req);

    const result = await getTeacherAssignments(req.query);

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

const getAssignmentsByYearController = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await getAssignmentsByAcademicYear(req.query);

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

const getStudentMyTeachersController = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["STUDENT"]);

    const result = await getStudentMyTeachers({
      userId: req.user.userId,
      ...req.query,
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

/*
  =====================================
  CENTRALIZED ERROR MAPPING
  =====================================
*/

const handleError = (error, res) => {
  if (
    error instanceof AuthenticationFailedError ||
    error instanceof AccountDeactivatedError ||
    error instanceof SessionExpiredError
  ) {
    return res.status(401).json({ message: error.message });
  }

  if (error instanceof AuthorizationError) {
    return res.status(403).json({ message: error.message });
  }

  if (
    error instanceof AcademicYearNotFoundError ||
    error instanceof SectionNotFoundError ||
    error instanceof TeacherNotFoundError ||
    error instanceof SubjectNotFoundError ||
    error instanceof ClassTeacherAssignmentNotFoundError ||
    error instanceof SubjectTeacherAssignmentNotFoundError ||
    error instanceof StudentProfileNotFoundError ||
    error instanceof ActiveEnrollmentNotFoundError
  ) {
    return res.status(404).json({ message: error.message });
  }

  if (
    error instanceof AcademicYearNotActiveError ||
    error instanceof SectionNotActiveError ||
    error instanceof SectionAcademicYearMismatchError ||
    error instanceof TeacherNotActiveError ||
    error instanceof InvalidTeacherRoleError ||
    error instanceof ReservedSubjectAssignmentError ||
    error instanceof SubjectNotActiveError ||
    error instanceof SubjectNotMappedToGradeError ||
    error instanceof NoActiveAcademicYearFoundError
  ) {
    return res.status(400).json({ message: error.message });
  }

  if (
    error instanceof TeacherAlreadyClassTeacherError ||
    error instanceof SectionAlreadyHasClassTeacherError ||
    error instanceof SubjectAlreadyAssignedError
  ) {
    return res.status(409).json({ message: error.message });
  }

  if (
    error instanceof UnauthorizedAttendanceError ||
    error instanceof UnauthorizedSubjectHomeworkError ||
    error instanceof UnauthorizedGeneralHomeworkError
  ) {
    return res.status(403).json({ message: error.message });
  }

  console.error("Teacher Assignment Error:", error);
  return res.status(500).json({ message: "Internal Server Error" });
};

module.exports = {
  createClassTeacher,
  updateClassTeacher,
  createSubjectTeacher,
  updateSubjectTeacher,
  getClassTeacherController,
  getSubjectTeachersController,
  getTeacherAssignmentsController,
  getAssignmentsByYearController,
  getStudentMyTeachersController,
};
