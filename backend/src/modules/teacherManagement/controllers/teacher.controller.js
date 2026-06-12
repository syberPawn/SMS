const {
  createTeacher,
  listTeachers,
  TeacherValidationError,
  TeacherUsernameGenerationError,
} = require("../services/teacher.service");

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

const {
  DuplicateUserError,
  ValidationError,
} = require("../../user/services/user.service");

const create = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await createTeacher(req.body, req.user);

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
      error instanceof TeacherValidationError ||
      error instanceof TeacherUsernameGenerationError ||
      error instanceof ValidationError
    ) {
      return res.status(400).json({ message: error.message });
    }

    if (error instanceof DuplicateUserError) {
      return res.status(409).json({ message: error.message });
    }

    console.error("Teacher Create Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAll = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await listTeachers(req.query);

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

    console.error("Teacher Read Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  create,
  getAll,
};
