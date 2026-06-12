const {
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
} = require("../services/attendance.service");

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
  RECORD ATTENDANCE
  =====================================
*/

const createAttendance = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["TEACHER"]);

    const result = await recordAttendance({
      teacherId: req.user.userId,
      ...req.body,
    });

    return res.status(201).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

/*
  =====================================
  GET SECTION ATTENDANCE
  =====================================
*/

const getSectionAttendanceController = async (req, res) => {
  try {
    await verifyAuthenticated(req);

    // Allow only ADMIN and TEACHER
    verifyRole(req, ["ADMIN", "TEACHER"]);

    const result = await getSectionAttendance({
      requestingUser: req.user,
      ...req.query,
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

/*
  =====================================
  GET STUDENT ATTENDANCE HISTORY
  =====================================
*/

const getStudentAttendanceHistoryController = async (req, res) => {
  try {
    await verifyAuthenticated(req);

    verifyRole(req, ["STUDENT"]);

    const result = await getStudentAttendanceHistory({
      requestingUser: req.user,
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

/*
  =====================================
  GET STUDENT ATTENDANCE PERCENTAGE
  =====================================
*/

const getStudentAttendancePercentageController = async (req, res) => {
  try {
    await verifyAuthenticated(req);

    verifyRole(req, ["STUDENT"]); // tighten access

    const result = await getStudentAttendancePercentage({
      requestingUser: req.user,
      academicYearId: req.query.academicYearId,
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

/*
  =====================================
  GET SECTION ATTENDANCE PERCENTAGE
  =====================================
*/

const getSectionAttendancePercentageController = async (req, res) => {
  try {
    await verifyAuthenticated(req);

    // Allow ADMIN and TEACHER
    verifyRole(req, ["ADMIN", "TEACHER"]);

    const result = await getSectionAttendancePercentage(req.query);

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

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
    error instanceof SectionNotFoundError
  ) {
    return res.status(404).json({ message: error.message });
  }

  if (
    error instanceof AcademicYearNotActiveError ||
    error instanceof SectionNotActiveError ||
    error instanceof SectionAcademicYearMismatchError ||
    error instanceof InvalidAttendanceDateError ||
    error instanceof BackdatedAttendanceNotAllowedError ||
    error instanceof FutureAttendanceNotAllowedError ||
    error instanceof EnrollmentValidationError ||
    error instanceof InvalidAttendanceStatusError
  ) {
    return res.status(400).json({ message: error.message });
  }

  if (error instanceof DuplicateAttendanceEntryError) {
    return res.status(409).json({ message: error.message });
  }

  if (error instanceof UnauthorizedAttendanceError) {
    return res.status(403).json({ message: error.message });
  }

  console.error("Attendance Error:", error);
  return res.status(500).json({ message: "Internal Server Error" });
};

module.exports = {
  createAttendance,
  getSectionAttendanceController,
  getStudentAttendanceHistoryController,
  getStudentAttendancePercentageController,
  getSectionAttendancePercentageController,
};
