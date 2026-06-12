const Joi = require("joi");

/*
  ==============================
  CREATE FEE STRUCTURE
  FR-FEE-01
  ==============================
*/

const createFeeStructureSchema = Joi.object({
  academicYearId: Joi.string().required(),
  gradeId: Joi.string().required(),
  monthlyAmount: Joi.number().required(),
}).unknown(false);

/*
  ==============================
  GET FEE STRUCTURE
  ==============================
*/

const getFeeStructureSchema = Joi.object({
  academicYearId: Joi.string().required(),
  gradeId: Joi.string().required(),
}).unknown(false);

/*
  ==============================
  RECORD PAYMENT
  FR-FEE-04
  ==============================
*/

const recordPaymentSchema = Joi.object({
  enrollmentId: Joi.string().required(),
  month: Joi.string().required(),
  amount: Joi.number().required(),
}).unknown(false);

/*
  ==============================
  GET STUDENT MONTHLY STATUS
  FR-FEE-05
  ==============================
*/

const getStudentMonthlyStatusSchema = Joi.object({
  enrollmentId: Joi.string().required(),
}).unknown(false);

/*
  ==============================
  GET SECTION MONTHLY SUMMARY
  FR-FEE-06
  ==============================
*/

const getSectionMonthlySummarySchema = Joi.object({
  sectionId: Joi.string().required(),
  month: Joi.string().required(),
}).unknown(false);

module.exports = {
  createFeeStructureSchema,
  getFeeStructureSchema,
  recordPaymentSchema,
  getStudentMonthlyStatusSchema,
  getSectionMonthlySummarySchema,
};
