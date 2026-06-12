const {
  createSection,
  deactivateSection,
  listSectionsByGrade,

  SectionNotFoundError,
  GradeNotFoundError,
  DuplicateSectionError,
  InactiveGradeError,
  MissingSectionFieldsError,
  StructuralDependencyError,
} = require("../services/section.service");

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
  POST /sections
  =====================================
*/

const create = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await createSection(req.body, req.user.userId);

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

    if (error instanceof GradeNotFoundError) {
      return res.status(404).json({ message: error.message });
    }

    if (error instanceof DuplicateSectionError) {
      return res.status(409).json({ message: error.message });
    }

    if (error instanceof InactiveGradeError) {
      return res.status(400).json({ message: error.message });
    }

    if (error instanceof MissingSectionFieldsError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/*
  =====================================
  PATCH /sections/:id/deactivate
  =====================================
*/

const deactivate = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await deactivateSection(req.params.id);

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

    if (error instanceof SectionNotFoundError) {
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
  GET /sections?gradeId=...
  =====================================
*/

const getByGrade = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const { gradeId } = req.query;

    const result = await listSectionsByGrade(gradeId);

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

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  create,
  deactivate,
  getByGrade,
};
