const {
  createStudentIdentity,
  updateStudentIdentity,
  deactivateStudentIdentity,
  getStudentProfile,
  listStudents,

  StudentNotFoundError,
  AdmissionNumberAlreadyExistsError,
  StudentIdentityValidationError,
  UnauthorizedStudentProfileAccessError,
} = require("../services/studentIdentity.service");

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
  POST /students
  =====================================
*/

const create = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await createStudentIdentity(req.body, req.user.userId);

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

    if (error instanceof StudentIdentityValidationError) {
      return res.status(400).json({ message: error.message });
    }

    if (error instanceof AdmissionNumberAlreadyExistsError) {
      return res.status(409).json({ message: error.message });
    }

    console.error("Student Identity Create Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/*
  =====================================
  PATCH /students/:id
  =====================================
*/

const update = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await updateStudentIdentity(
      req.params.id,
      req.body,
      req.user.userId,
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

    if (error instanceof StudentNotFoundError) {
      return res.status(404).json({ message: error.message });
    }

    if (error instanceof StudentIdentityValidationError) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Student Identity Update Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/*
  =====================================
  PATCH /students/:id/deactivate
  =====================================
*/

const deactivate = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await deactivateStudentIdentity(
      req.params.id,
      req.user.userId,
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

    if (error instanceof StudentNotFoundError) {
      return res.status(404).json({ message: error.message });
    }

    console.error("Student Identity Deactivate Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/*
  =====================================
  GET /students/:id
  =====================================
*/

const getProfile = async (req, res) => {
  try {
    await verifyAuthenticated(req);

    const result = await getStudentProfile(req.user, req.params.id);

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

    if (error instanceof StudentNotFoundError) {
      return res.status(404).json({ message: error.message });
    }

    if (error instanceof UnauthorizedStudentProfileAccessError) {
      return res.status(403).json({ message: error.message });
    }

    console.error("Student Profile Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/*
  =====================================
  GET /students
  =====================================
*/

const getAll = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await listStudents();

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

    console.error("Student List Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  create,
  update,
  deactivate,
  getProfile,
  getAll,
};
