const AcademicYear = require("../../academicStructure/models/academicYear.model");
const Enrollment = require("../../studentManagement/models/enrollments.model");

const MonthlyFees = require("../models/monthlyFees.model");
const PaymentRecords = require("../models/paymentRecords.model");
const Section = require("../../academicStructure/models/section.model");

const {
  determineAcademicMonths,
  determinePayableMonthsForEnrollment,
} = require("./feeGeneration.service");

/*
  ==============================
  DOMAIN ERRORS
  ==============================
*/

class EnrollmentNotFoundError extends Error {}
class AcademicYearNotFoundError extends Error {}
class InvalidMonthError extends Error {}
class MonthOutsideEnrollmentRangeError extends Error {}
class PaymentAlreadyExistsError extends Error {}
class FeeStructureNotFoundError extends Error {}
class IncorrectPaymentAmountError extends Error {}
class SectionNotFoundError extends Error {}

/*
  ==============================
  RECORD PAYMENT
  FR-FEE-04
  ==============================
*/

const recordPayment = async ({ enrollmentId, month, amount, recordedBy }) => {
  /*
    STEP 1 — Enrollment Validation
  */

  const enrollment = await Enrollment.findById(enrollmentId);

  if (!enrollment) {
    throw new EnrollmentNotFoundError("Enrollment not found");
  }

  /*
    STEP 2 — Academic Year Validation
  */

  const academicYear = await AcademicYear.findById(enrollment.academicYearId);

  if (!academicYear) {
    throw new AcademicYearNotFoundError("Academic Year not found");
  }

  /*
    STEP 3 — Determine Academic Months
  */

  const academicMonths = determineAcademicMonths(academicYear);

  if (!academicMonths.includes(month)) {
    throw new InvalidMonthError("Month is not part of the academic year");
  }

  /*
    STEP 4 — Determine Payable Months
  */

  const payableMonths = determinePayableMonthsForEnrollment({
    academicMonths,
    enrollment,
  });

  if (!payableMonths.includes(month)) {
    throw new MonthOutsideEnrollmentRangeError(
      "Month is outside student's payable range",
    );
  }

  /*
    STEP 5 — Prevent Duplicate Payment
  */

  const existingPayment = await PaymentRecords.findOne({
    enrollmentId,
    month,
  });

  if (existingPayment) {
    throw new PaymentAlreadyExistsError(
      "Payment already recorded for this month",
    );
  }

  /*
    STEP 6 — Fetch Fee Structure
  */

  // Fetch the section linked to the enrollment
  const section = await Section.findById(enrollment.sectionId);

  if (!section) {
    throw new SectionNotFoundError("Section not found for enrollment");
  }

  // Now fetch fee structure using the grade of the section
  const feeStructure = await MonthlyFees.findOne({
    academicYearId: enrollment.academicYearId,
    gradeId: section.gradeId,
  });

  if (!feeStructure) {
    throw new FeeStructureNotFoundError(
      "Fee structure not defined for this grade and academic year",
    );
  }

  /*
    STEP 7 — Validate Payment Amount
  */

  if (amount !== feeStructure.monthlyAmount) {
    throw new IncorrectPaymentAmountError(
      "Payment amount must match monthly fee amount",
    );
  }

  /*
    STEP 8 — Create Payment Record
  */

  const payment = await PaymentRecords.create({
    academicYearId: enrollment.academicYearId,
    enrollmentId,
    gradeId: section.gradeId,
    sectionId: enrollment.sectionId,
    month,
    amount,
    paidAt: new Date(),
    recordedBy,
  });

  return payment;
};

module.exports = {
  recordPayment,

  EnrollmentNotFoundError,
  AcademicYearNotFoundError,
  InvalidMonthError,
  MonthOutsideEnrollmentRangeError,
  PaymentAlreadyExistsError,
  FeeStructureNotFoundError,
  IncorrectPaymentAmountError,
  SectionNotFoundError,
};
