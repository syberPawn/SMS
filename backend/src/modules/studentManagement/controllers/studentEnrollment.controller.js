const {
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
} = require("../services/studentEnrollment.service");

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
  POST /enrollments
  =====================================
*/

const create = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await createEnrollment(req.body, req.user.userId);

    return res.status(201).json(result);
  } catch (error) {
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
      error instanceof StudentNotFoundError ||
      error instanceof AcademicYearNotFoundError ||
      error instanceof SectionNotFoundError
    ) {
      return res.status(404).json({ message: error.message });
    }

    if (
      error instanceof AcademicYearNotActiveError ||
      error instanceof AcademicYearInactiveWindowError ||
      error instanceof SectionAcademicYearMismatchError
    ) {
      return res.status(400).json({ message: error.message });
    }

    if (
      error instanceof EnrollmentAlreadyExistsError ||
      error instanceof ActiveEnrollmentOverlapError
    ) {
      return res.status(409).json({ message: error.message });
    }

    console.error("Enrollment Create Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/*
  =====================================
  PATCH /enrollments/:id/class
  =====================================
*/

const updateClass = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await updateEnrollmentClass(
      req.params.id,
      req.body.sectionId,
    );

    return res.status(200).json(result);
  } catch (error) {
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
      error instanceof EnrollmentNotFoundError ||
      error instanceof AcademicYearNotFoundError ||
      error instanceof SectionNotFoundError
    ) {
      return res.status(404).json({ message: error.message });
    }

    if (
      error instanceof EnrollmentClassUpdateNotAllowedError ||
      error instanceof SectionAcademicYearMismatchError
    ) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Enrollment Class Update Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/*
  =====================================
  PATCH /enrollments/:id/status
  =====================================
*/

const updateStatus = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await updateEnrollmentStatus(
      req.params.id,
      req.body.enrollmentStatus,
    );

    return res.status(200).json(result);
  } catch (error) {
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
      error instanceof EnrollmentNotFoundError ||
      error instanceof AcademicYearNotFoundError
    ) {
      return res.status(404).json({ message: error.message });
    }

    if (
      error instanceof InvalidEnrollmentStatusTransitionError ||
      error instanceof AcademicYearNotActiveError ||
      error instanceof AcademicYearInactiveWindowError
    ) {
      return res.status(400).json({ message: error.message });
    }

    if (error instanceof ActiveEnrollmentOverlapError) {
      return res.status(409).json({ message: error.message });
    }

    console.error("Enrollment Status Update Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/*
  =====================================
  GET /enrollments
  =====================================
*/

const getAll = async (req, res) => {
  try {
    await verifyAuthenticated(req);

    const result = await listStudents(req.query, req.user);

    return res.status(200).json(result);
  } catch (error) {
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

    if (error instanceof AcademicYearNotFoundError) {
      return res.status(404).json({ message: error.message });
    }

    console.error("Enrollment List Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  create,
  updateClass,
  updateStatus,
  getAll,
};
