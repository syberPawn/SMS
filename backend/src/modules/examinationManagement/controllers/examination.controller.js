const {
  createAcademicYearExamInstances,
  getExamInstancesByYear,

  AcademicYearNotFoundError,
  AcademicYearNotActiveError,
  ExamInstancesAlreadyExistError,
  NoSectionsFoundError,
  NoGradeSubjectMappingFoundError,
} = require("../services/examInstance.service");

const {
  submitSubjectMarks,
  getMarksForSubjectTeacher,
  getMarksForClassTeacher,
  getMarksForAdmin,
  getMarksForStudent,

  ExamInstanceNotFoundError,
  SectionNotFoundError,
  SectionNotActiveError,
  SectionAcademicYearMismatchError,
  TeacherNotFoundError,
  UnauthorizedMarkEntryError,
  SubjectNotFoundError,
  SubjectNotActiveError,
  SubjectNotInSnapshotError,
  AtomicSubmissionMismatchError,
  DuplicateMarkEntryError,
  InvalidMarksValueError,
  ExamDateNotReachedError,
} = require("../services/examMark.service");

const {
  generateReportCard,
  EnrollmentNotFoundError,
  AcademicYearMismatchError,
  ReportCardSectionNotFoundError,
} = require("../services/reportCard.service");

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
  CREATE EXAM INSTANCES
  =====================================
*/

const createExamInstancesController = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await createAcademicYearExamInstances(req.body);

    return res.status(201).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

/*
  =====================================
  GET EXAM INSTANCES BY YEAR
  =====================================
*/

const getExamInstancesController = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN", "TEACHER", "STUDENT"]);

    const result = await getExamInstancesByYear(req.query);

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

/*
  =====================================
  SUBMIT SUBJECT MARKS
  =====================================
*/

const submitSubjectMarksController = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["TEACHER"]);

    const result = await submitSubjectMarks({
      teacherId: req.user.userId,
      ...req.body,
    });

    return res.status(201).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

/*
  =====================================
  VIEW MARKS — SUBJECT TEACHER
  =====================================
*/

const getMarksForSubjectTeacherController = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["TEACHER"]);

    const result = await getMarksForSubjectTeacher({
      teacherId: req.user.userId,
      ...req.query,
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

/*
  =====================================
  VIEW MARKS — CLASS TEACHER
  =====================================
*/

const getMarksForClassTeacherController = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["TEACHER"]);

    const result = await getMarksForClassTeacher(req.query);

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

/*
  =====================================
  VIEW MARKS — ADMIN
  =====================================
*/

const getMarksForAdminController = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await getMarksForAdmin(req.query);

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

/*
  =====================================
  VIEW MARKS — STUDENT
  =====================================
*/

const getMarksForStudentController = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["STUDENT"]);

    const result = await getMarksForStudent({
      userId: req.user.userId,
      ...req.query,
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

/*
  =====================================
  GENERATE REPORT CARD
  =====================================
*/

const generateReportCardController = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["STUDENT", "ADMIN"]);

    const result = await generateReportCard({
      userId: req.user.userId,
      ...req.query,
    });

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
    error instanceof SectionNotFoundError ||
    error instanceof ExamInstanceNotFoundError ||
    error instanceof EnrollmentNotFoundError ||
    error instanceof ReportCardSectionNotFoundError
  ) {
    return res.status(404).json({ message: error.message });
  }

  if (
    error instanceof AcademicYearNotActiveError ||
    error instanceof SectionNotActiveError ||
    error instanceof SectionAcademicYearMismatchError ||
    error instanceof SubjectNotFoundError ||
    error instanceof SubjectNotActiveError ||
    error instanceof SubjectNotInSnapshotError ||
    error instanceof AtomicSubmissionMismatchError ||
    error instanceof InvalidMarksValueError ||
    error instanceof ExamDateNotReachedError ||
    error instanceof AcademicYearMismatchError ||
    error instanceof NoSectionsFoundError ||
    error instanceof NoGradeSubjectMappingFoundError
  ) {
    return res.status(400).json({ message: error.message });
  }

  if (
    error instanceof DuplicateMarkEntryError ||
    error instanceof ExamInstancesAlreadyExistError
  ) {
    return res.status(409).json({ message: error.message });
  }

  if (error instanceof UnauthorizedMarkEntryError) {
    return res.status(403).json({ message: error.message });
  }

  console.error("Examination Error:", error);
  return res.status(500).json({ message: "Internal Server Error" });
};



module.exports = {
  createExamInstancesController,
  getExamInstancesController,
  submitSubjectMarksController,
  getMarksForSubjectTeacherController,
  getMarksForClassTeacherController,
  getMarksForAdminController,
  getMarksForStudentController,
  generateReportCardController,
};
