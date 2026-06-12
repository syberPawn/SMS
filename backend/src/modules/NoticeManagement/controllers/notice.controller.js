const {
  createNotice,
  getNoticesForAdmin,
  getActiveNoticesForUser,
  changeNoticeStatus,

  UnauthorizedNoticeActionError,
  AcademicYearNotFoundError,
  NoticeNotFoundError,
  InvalidNoticeStatusError,
  InvalidDateRangeError,
  InvalidNoticePayloadError,
} = require("../services/notice.service");

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
  CREATE NOTICE
  =====================================
*/

const createNoticeController = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const context = {
      authenticatedUserId: req.user.userId,
      authenticatedUserRole: req.user.role,
      selectedAcademicYearId: req.user.selectedAcademicYearId,
    };

    const result = await createNotice(req.body, context);

    return res.status(201).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

/*
  =====================================
  ADMIN NOTICE LISTING
  =====================================
*/

const getNoticesForAdminController = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const context = {
      authenticatedUserRole: req.user.role,
      selectedAcademicYearId: req.user.selectedAcademicYearId,
    };

    const result = await getNoticesForAdmin(req.query, context);

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

/*
  =====================================
  GET ACTIVE NOTICES FOR USERS
  =====================================
*/

const getActiveNoticesController = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["TEACHER", "STUDENT"]);

    const context = {
      authenticatedUserRole: req.user.role,
      selectedAcademicYearId: req.user.selectedAcademicYearId,
    };

    const result = await getActiveNoticesForUser(context);

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

/*
  =====================================
  CHANGE NOTICE STATUS
  =====================================
*/

const changeNoticeStatusController = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const context = {
      authenticatedUserRole: req.user.role,
    };

    const noticeId = req.params.id;
    const newStatus = req.body.status;

    const result = await changeNoticeStatus(noticeId, newStatus, context);

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
    error instanceof NoticeNotFoundError
  ) {
    return res.status(404).json({ message: error.message });
  }

  if (
    error instanceof InvalidNoticeStatusError ||
    error instanceof InvalidDateRangeError ||
    error instanceof UnauthorizedNoticeActionError ||
    error instanceof InvalidNoticePayloadError
  ) {
    return res.status(400).json({ message: error.message });
  }

  console.error("Notice Module Error:", error);
  return res.status(500).json({ message: "Internal Server Error" });
};

module.exports = {
  createNoticeController,
  getNoticesForAdminController,
  getActiveNoticesController,
  changeNoticeStatusController,
};
