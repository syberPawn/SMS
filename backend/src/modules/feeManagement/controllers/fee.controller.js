const {
  createFeeStructure,
  getFeeStructure,

  AcademicYearNotFoundError,
  GradeNotFoundError,
  FeeStructureAlreadyExistsError,
  EnrollmentExistsForGradeError,
  InvalidFeeAmountError,
} = require("../services/feeStructure.service");

const {
  recordPayment,

  EnrollmentNotFoundError,
  AcademicYearNotFoundError: PaymentAcademicYearNotFoundError,
  InvalidMonthError,
  MonthOutsideEnrollmentRangeError,
  PaymentAlreadyExistsError,
  FeeStructureNotFoundError,
  IncorrectPaymentAmountError,
  SectionNotFoundError: PaymentSectionNotFoundError,
} = require("../services/payment.service");

const {
  getStudentMonthlyStatus,
  getSectionMonthlySummary,

  AcademicYearNotFoundError: QueryAcademicYearNotFoundError,
  SectionNotFoundError,
} = require("../services/feeQuery.service");

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
const Enrollment = require("../../studentManagement/models/enrollments.model");
const Student = require("../../studentManagement/models/students.model");
const AcademicYear = require("../../academicStructure/models/academicYear.model");

/*
  =====================================
  CREATE FEE STRUCTURE
  =====================================
*/

const createFeeStructureController = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await createFeeStructure(req.body);

    return res.status(201).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

/*
  =====================================
  GET FEE STRUCTURE
  =====================================
*/

const getFeeStructureController = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await getFeeStructure(req.query);

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

/*
  =====================================
  RECORD PAYMENT
  =====================================
*/

const recordPaymentController = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await recordPayment({
      recordedBy: req.user.userId,
      ...req.body,
    });

    return res.status(201).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};

/*
  =====================================
  GET STUDENT MONTHLY STATUS
  =====================================
*/




const getStudentMonthlyStatusController = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN", "STUDENT"]);

    let enrollmentId;

    /*
      If STUDENT → resolve enrollment automatically
    */

    if (req.user.role === "STUDENT") {
      const student = await Student.findOne({
        userId: req.user.userId,
      });

      if (!student) {
        throw new EnrollmentNotFoundError("Student record not found");
      }

      let academicYearId = req.user.selectedAcademicYearId;

      if (!academicYearId) {
        const activeYear = await AcademicYear.findOne({ status: "ACTIVE" });
        academicYearId = activeYear?._id || null;
      }

      const enrollmentQuery = {
        studentId: student._id,
        enrollmentStatus: "ACTIVE",
      };

      if (academicYearId) {
        enrollmentQuery.academicYearId = academicYearId;
      }

      const enrollment = await Enrollment.findOne(enrollmentQuery).sort({
        createdAt: -1,
      });

      if (!enrollment) {
        throw new EnrollmentNotFoundError("Enrollment not found");
      }

      enrollmentId = enrollment._id;
    }

    /*
      If ADMIN → allow manual enrollmentId query
    */

    if (req.user.role === "ADMIN") {
      enrollmentId = req.query.enrollmentId;
    }

    const result = await getStudentMonthlyStatus({ enrollmentId });

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
};
/*
  =====================================
  GET SECTION MONTHLY SUMMARY
  =====================================
*/

const getSectionMonthlySummaryController = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await getSectionMonthlySummary(req.query);

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
    error instanceof PaymentAcademicYearNotFoundError ||
    error instanceof QueryAcademicYearNotFoundError ||
    error instanceof EnrollmentNotFoundError ||
    error instanceof GradeNotFoundError ||
    error instanceof SectionNotFoundError ||
    error instanceof PaymentSectionNotFoundError
  ) {
    return res.status(404).json({ message: error.message });
  }

  if (
    error instanceof InvalidFeeAmountError ||
    error instanceof InvalidMonthError ||
    error instanceof MonthOutsideEnrollmentRangeError ||
    error instanceof IncorrectPaymentAmountError ||
    error instanceof EnrollmentExistsForGradeError
  ) {
    return res.status(400).json({ message: error.message });
  }

  if (
    error instanceof PaymentAlreadyExistsError ||
    error instanceof FeeStructureAlreadyExistsError
  ) {
    return res.status(409).json({ message: error.message });
  }

  if (error instanceof FeeStructureNotFoundError) {
    return res.status(404).json({ message: error.message });
  }

  console.error("Fee Module Error:", error);
  return res.status(500).json({ message: "Internal Server Error" });
};

module.exports = {
  createFeeStructureController,
  getFeeStructureController,
  recordPaymentController,
  getStudentMonthlyStatusController,
  getSectionMonthlySummaryController,
};
