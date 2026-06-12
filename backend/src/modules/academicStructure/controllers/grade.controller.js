const {
  createGrade,
  deactivateGrade,
  listGradesByAcademicYear,
  GradeNotFoundError,
  AcademicYearNotFoundError,
  DuplicateGradeError,
  MissingGradeFieldsError,
} = require("../services/grade.service");

const {
  StructuralDependencyError,
} = require("../services/validators/structuralDependency.validator");

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
  POST /grades
  =====================================
*/

const create = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await createGrade(req.body, req.user.userId);

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

    if (error instanceof AcademicYearNotFoundError) {
      return res.status(404).json({ message: error.message });
    }

    if (error instanceof DuplicateGradeError) {
      return res.status(409).json({ message: error.message });
    }

    if (error instanceof MissingGradeFieldsError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/*
  =====================================
  PATCH /grades/:id/deactivate
  =====================================
*/

const deactivate = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await deactivateGrade(req.params.id);

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

    if (error instanceof GradeNotFoundError) {
      return res.status(404).json({ message: error.message });
    }

    if (error instanceof StructuralDependencyError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/*
  =====================================
  GET /grades?academicYearId=...
  =====================================
*/

const getByAcademicYear = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const { academicYearId } = req.query;

    const result = await listGradesByAcademicYear(academicYearId);

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

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  create,
  deactivate,
  getByAcademicYear,
};
