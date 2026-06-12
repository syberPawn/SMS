const Notice = require("../models/notice.model");
const AcademicYear = require("../../academicStructure/models/academicYear.model");

/*
  ==============================
  DOMAIN ERRORS
  ==============================
*/

class UnauthorizedNoticeActionError extends Error {}
class AcademicYearNotFoundError extends Error {}
class NoticeNotFoundError extends Error {}
class InvalidNoticeStatusError extends Error {}
class InvalidDateRangeError extends Error {}
class InvalidNoticePayloadError extends Error {}

/*
  ==============================
  CREATE NOTICE
  FR-NOT-01
  ==============================
*/

const createNotice = async (payload, context) => {
  const {
    title,
    description,
    attachmentReference,
    priority = "NORMAL",
  } = payload;

  const { authenticatedUserId, authenticatedUserRole, selectedAcademicYearId } =
    context;

  /*
    STEP 1 — Role Validation
    BR-NOT-08
  */

  if (authenticatedUserRole !== "ADMIN") {
    throw new UnauthorizedNoticeActionError(
      "Only administrators can create notices",
    );
  }

  const normalizedTitle = typeof title === "string" ? title.trim() : "";
  const normalizedDescription =
    typeof description === "string" ? description.trim() : "";

  if (!normalizedTitle || !normalizedDescription) {
    throw new InvalidNoticePayloadError("Title and description are required");
  }

  if (normalizedTitle.length > 120) {
    throw new InvalidNoticePayloadError("Title must be 120 characters or less");
  }

  if (normalizedDescription.length > 1000) {
    throw new InvalidNoticePayloadError(
      "Description must be 1000 characters or less",
    );
  }

  if (!["NORMAL", "URGENT"].includes(priority)) {
    throw new InvalidNoticePayloadError("Invalid notice priority");
  }

  /*
    STEP 2 — Academic Year Validation
    DS-NOT-02
  */

  let academicYear;

  if (selectedAcademicYearId) {
    academicYear = await AcademicYear.findById(selectedAcademicYearId);
  } else {
    academicYear = await AcademicYear.findOne({ status: "ACTIVE" });
  }

  if (!academicYear) {
    throw new AcademicYearNotFoundError("Academic year not found");
  }

  /*
    STEP 3 — Create Notice
  */

  const notice = await Notice.create({
    academicYearId: academicYear._id,
    title: normalizedTitle,
    description: normalizedDescription,
    attachmentReference: attachmentReference || null,
    priority,
    status: "Active",
    createdAt: new Date(),
    createdBy: authenticatedUserId,
  });

  return notice;
};

/*
  ==============================
  GET NOTICES FOR ADMIN
  FR-NOT-04
  ==============================
*/

const getNoticesForAdmin = async (filters, context) => {
  const { authenticatedUserRole, selectedAcademicYearId } = context;

  /*
    STEP 1 — Role Validation
  */

  if (authenticatedUserRole !== "ADMIN") {
    throw new UnauthorizedNoticeActionError(
      "Only administrators can access admin notice listing",
    );
  }

  /*
    STEP 2 — Determine Academic Year Scope
  */

  let academicYear;

  if (filters.academicYearId) {
    academicYear = await AcademicYear.findById(filters.academicYearId);
  } else if (selectedAcademicYearId) {
    academicYear = await AcademicYear.findById(selectedAcademicYearId);
  } else {
    academicYear = await AcademicYear.findOne({ status: "ACTIVE" });
  }

  if (!academicYear) {
    throw new AcademicYearNotFoundError("Academic year not found");
  }

  const effectiveAcademicYearId = academicYear._id;

  /*
    STEP 3 — Date Range Validation
  */

  if (filters.startDate && filters.endDate) {
    if (new Date(filters.startDate) > new Date(filters.endDate)) {
      throw new InvalidDateRangeError("startDate must be before endDate");
    }
  }

  /*
    STEP 4 — Query Construction
  */

  const query = {
    academicYearId: effectiveAcademicYearId,
  };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.priority) {
    query.priority = filters.priority;
  }

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};

    if (filters.startDate) {
      query.createdAt.$gte = new Date(filters.startDate);
    }

    if (filters.endDate) {
      query.createdAt.$lte = new Date(filters.endDate);
    }
  }

  /*
    STEP 5 — Query Execution
  */

  const notices = await Notice.find(query).sort({ createdAt: -1 });

  return notices;
};

/*
  ==============================
  GET ACTIVE NOTICES FOR USER
  FR-NOT-02
  ==============================
*/

const getActiveNoticesForUser = async (context) => {
  const { authenticatedUserRole, selectedAcademicYearId } = context;

  if (!["TEACHER", "STUDENT"].includes(authenticatedUserRole)) {
    throw new UnauthorizedNoticeActionError(
      "Only teachers or students can access active notices",
    );
  }

  let academicYear;

  if (selectedAcademicYearId) {
    academicYear = await AcademicYear.findById(selectedAcademicYearId);
  } else {
    academicYear = await AcademicYear.findOne({ status: "ACTIVE" });
  }

  if (!academicYear) {
    throw new AcademicYearNotFoundError("Academic year not found");
  }

  const notices = await Notice.find({
    academicYearId: academicYear._id,
    status: "Active",
  }).sort({ createdAt: -1 });

  return notices;
};

/*
  ==============================
  CHANGE NOTICE STATUS
  FR-NOT-03
  ==============================
*/

const changeNoticeStatus = async (noticeId, newStatus, context) => {
  const { authenticatedUserRole } = context;

  /*
    STEP 1 — Role Validation
    BR-NOT-08
  */

  if (authenticatedUserRole !== "ADMIN") {
    throw new UnauthorizedNoticeActionError(
      "Only administrators can change notice status",
    );
  }

  /*
    STEP 2 — Status Validation
  */

  if (!["Active", "Inactive"].includes(newStatus)) {
    throw new InvalidNoticeStatusError("Invalid notice status");
  }

  /*
    STEP 3 — Fetch Notice
  */

  const notice = await Notice.findById(noticeId);

  if (!notice) {
    throw new NoticeNotFoundError("Notice not found");
  }

  /*
    STEP 4 — Update Status Only
    BR-NOT-03
  */

  notice.status = newStatus;

  await notice.save();

  return notice;
};

module.exports = {
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
};
