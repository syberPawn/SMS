const {
  mapSubjectToGrade,
  unmapSubjectFromGrade,
  listMappingsByGrade,
  copyCurriculumFromPreviousYear,

  GradeNotFoundError,
  SubjectNotFoundError,
  GradeInactiveError,
  SubjectInactiveError,
  MappingNotFoundError,
  DuplicateActiveMappingError,
  AcademicYearNotFoundError,
  CurriculumCopyError,
  MappingValidationError,
  StructuralDependencyError,
} = require("../services/gradeSubjectMapping.service");

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
  POST /grade-subject-mappings
  =====================================
*/

const create = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await mapSubjectToGrade(req.body, req.user.userId);

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
      error instanceof GradeNotFoundError ||
      error instanceof SubjectNotFoundError
    ) {
      return res.status(404).json({ message: error.message });
    }

    if (error instanceof DuplicateActiveMappingError) {
      return res.status(409).json({ message: error.message });
    }

    if (
      error instanceof GradeInactiveError ||
      error instanceof SubjectInactiveError ||
      error instanceof MappingValidationError
    ) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/*
  =====================================
  PATCH /grade-subject-mappings/:id/unmap
  =====================================
*/

const unmap = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await unmapSubjectFromGrade(req.params.id);

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

    if (error instanceof MappingNotFoundError) {
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
  GET /grade-subject-mappings?gradeId=...
  =====================================
*/

const getByGrade = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const { gradeId } = req.query;

    const result = await listMappingsByGrade(gradeId);

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

/*
  =====================================
  POST /grade-subject-mappings/copy
  =====================================
*/

const copy = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await copyCurriculumFromPreviousYear({
      ...req.body,
      adminId: req.user.userId,
    });

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

    if (error instanceof CurriculumCopyError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  create,
  unmap,
  getByGrade,
  copy,
};
