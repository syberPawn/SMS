const {
  createAcademicYear,
  activateAcademicYear,
  deactivateAcademicYear,
  listAcademicYears,

  AcademicYearNotFoundError,
  AcademicYearAlreadyActiveError,
  InvalidDateRangeError,
  OverlappingAcademicYearError,
  InvalidFirstYearStatusError,
  AcademicYearDeactivationNotAllowedError,
  AcademicYearValidationError,
} = require("../services/academicYear.service");

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
  POST /academic-years
  =====================================
*/

const create = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await createAcademicYear(req.body, req.user.userId);

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
      error instanceof InvalidDateRangeError ||
      error instanceof InvalidFirstYearStatusError ||
      error instanceof AcademicYearValidationError
    ) {
      return res.status(400).json({ message: error.message });
    }

    if (
      error instanceof OverlappingAcademicYearError ||
      error instanceof AcademicYearAlreadyActiveError
    ) {
      return res.status(409).json({ message: error.message });
    }

    console.error("AcademicYear Create Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

/*
  =====================================
  PATCH /academic-years/:id/activate
  =====================================
*/

const activate = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await activateAcademicYear(req.params.id, req.user.userId);

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

    if (error instanceof AcademicYearAlreadyActiveError) {
      return res.status(409).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/*
  =====================================
  PATCH /academic-years/:id/deactivate
  =====================================
*/

const deactivate = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await deactivateAcademicYear(req.params.id, req.user.userId);

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

    if (error instanceof AcademicYearDeactivationNotAllowedError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/*
  =====================================
  GET /academic-years
  =====================================
*/

const getAll = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN", "TEACHER", "STUDENT"]);

    const result = await listAcademicYears(req.query);

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

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  create,
  activate,
  deactivate,
  getAll,
};
