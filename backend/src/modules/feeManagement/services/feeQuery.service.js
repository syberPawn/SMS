const Enrollment = require("../../studentManagement/models/enrollments.model");
const PaymentRecords = require("../models/paymentRecords.model");
const MonthlyFees = require("../models/monthlyFees.model");
const AcademicYear = require("../../academicStructure/models/academicYear.model");
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
class FeeStructureNotFoundError extends Error {}
class SectionNotFoundError extends Error {}

/*
  ==============================
  GET STUDENT MONTHLY STATUS
  FR-FEE-05
  ==============================
*/

const getStudentMonthlyStatus = async ({ enrollmentId }) => {
  const enrollment = await Enrollment.findById(enrollmentId);

  if (!enrollment) {
    throw new EnrollmentNotFoundError("Enrollment not found");
  }

  const academicYear = await AcademicYear.findById(enrollment.academicYearId);

  if (!academicYear) {
    throw new AcademicYearNotFoundError("Academic Year not found");
  }

  /*
  FETCH SECTION
*/

  const section = await Section.findById(enrollment.sectionId);

  if (!section) {
    throw new SectionNotFoundError("Section not found for enrollment");
  }

  /*
  FETCH FEE STRUCTURE
*/

  const feeStructure = await MonthlyFees.findOne({
    academicYearId: enrollment.academicYearId,
    gradeId: section.gradeId,
  });


  if (!feeStructure) {
    throw new FeeStructureNotFoundError(
      "Fee structure not defined for this grade and academic year",
    );
  }

  const academicMonths = determineAcademicMonths(academicYear);

  const payableMonths = determinePayableMonthsForEnrollment({
    academicMonths,
    enrollment,
  });

  const payments = await PaymentRecords.find({
    enrollmentId,
  });

  const paidMonths = new Set(payments.map((p) => p.month));

  const result = payableMonths.map((month) => ({
    month,
    status: paidMonths.has(month) ? "PAID" : "UNPAID",
    amount: feeStructure.monthlyAmount,
  }));

  return result;
};

/*
  ==============================
  GET SECTION MONTHLY SUMMARY
  FR-FEE-06
  ==============================
*/

const getSectionMonthlySummary = async ({ sectionId, month }) => {
  const enrollments = await Enrollment.find({
    sectionId,
  });

  if (enrollments.length === 0) {
    throw new SectionNotFoundError("No enrollments found for this section");
  }

  const enrollmentIds = enrollments.map((e) => e._id);

  const payments = await PaymentRecords.find({
    enrollmentId: { $in: enrollmentIds },
    month,
  });

  const paidEnrollmentIds = new Set(
    payments.map((p) => String(p.enrollmentId)),
  );

  let paidCount = 0;
  let unpaidCount = 0;

  for (const enrollment of enrollments) {
    if (paidEnrollmentIds.has(String(enrollment._id))) {
      paidCount++;
    } else {
      unpaidCount++;
    }
  }

  return {
    paidCount,
    unpaidCount,
  };
};

module.exports = {
  getStudentMonthlyStatus,
  getSectionMonthlySummary,

  EnrollmentNotFoundError,
  AcademicYearNotFoundError,
  FeeStructureNotFoundError,
  SectionNotFoundError,
};
