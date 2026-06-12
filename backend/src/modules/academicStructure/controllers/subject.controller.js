const {
  createSubject,
  deactivateSubject,
  activateSubject,
  listSubjects,
  SubjectNotFoundError,
  DuplicateSubjectError,
  SubjectValidationError,
} = require("../services/subject.service");

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
  POST /subjects
  =====================================
*/

const create = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await createSubject(req.body, req.user.userId);

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

    if (error instanceof SubjectValidationError) {
      return res.status(400).json({ message: error.message });
    }

    if (error instanceof DuplicateSubjectError) {
      return res.status(409).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/*
  =====================================
  PATCH /subjects/:id/deactivate
  =====================================
*/

const deactivate = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await deactivateSubject(req.params.id);

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

    if (error instanceof SubjectNotFoundError) {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/*
  =====================================
  PATCH /subjects/:id/activate
  =====================================
*/

const activate = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await activateSubject(req.params.id);

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

    if (error instanceof SubjectNotFoundError) {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/*
  =====================================
  GET /subjects
  =====================================
*/

const getAll = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await listSubjects();

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
  deactivate,
  activate,
  getAll,
};
