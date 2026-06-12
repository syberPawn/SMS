const { createStudentWithEnrollment } = require("../services/studentOnboarding.service");

const {
  AdmissionNumberAlreadyExistsError,
  StudentIdentityValidationError,
} = require("../services/studentIdentity.service");

const {
  AcademicYearNotFoundError,
  AcademicYearNotActiveError,
  AcademicYearInactiveWindowError,
  SectionNotFoundError,
  SectionAcademicYearMismatchError,
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

const {
  DuplicateUserError,
  ValidationError,
} = require("../../user/services/user.service");

const createCombined = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await createStudentWithEnrollment(req.body, req.user.userId);

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
      error instanceof StudentIdentityValidationError ||
      error instanceof ValidationError ||
      error instanceof AcademicYearNotActiveError ||
      error instanceof AcademicYearInactiveWindowError ||
      error instanceof SectionAcademicYearMismatchError
    ) {
      return res.status(400).json({ message: error.message });
    }

    if (
      error instanceof AdmissionNumberAlreadyExistsError ||
      error instanceof DuplicateUserError
    ) {
      return res.status(409).json({ message: error.message });
    }

    if (
      error instanceof AcademicYearNotFoundError ||
      error instanceof SectionNotFoundError
    ) {
      return res.status(404).json({ message: error.message });
    }

    console.error("Student Onboarding Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  createCombined,
};
