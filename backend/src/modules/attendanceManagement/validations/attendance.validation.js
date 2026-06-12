const Joi = require("joi");

/*
  ==============================
  ATTENDANCE RECORDING VALIDATION
  ==============================
*/

const recordAttendanceSchema = Joi.object({
  academicYearId: Joi.string().required(),
  sectionId: Joi.string().required(),
  attendanceDate: Joi.date().required(),

  studentAttendanceList: Joi.array()
    .items(
      Joi.object({
        enrollmentId: Joi.string().required(),
        status: Joi.string().valid("PRESENT", "ABSENT").required(),
      }).unknown(false),
    )
    .min(1)
    .required(),
}).unknown(false);

/*
  ==============================
  VIEW SECTION ATTENDANCE
  ==============================
*/

const getSectionAttendanceSchema = Joi.object({
  academicYearId: Joi.string().required(),
  sectionId: Joi.string().required(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
}).unknown(false);

/*
  ==============================
  STUDENT ATTENDANCE HISTORY
  ==============================
*/

const getStudentAttendanceHistorySchema = Joi.object({
  academicYearId: Joi.string().required(),
}).unknown(false);

/*
  ==============================
  STUDENT PERCENTAGE
  ==============================
*/

const getStudentAttendancePercentageSchema = Joi.object({
  enrollmentId: Joi.string().required(),
  academicYearId: Joi.string().required(),
}).unknown(false);

/*
  ==============================
  SECTION PERCENTAGE
  ==============================
*/

const getSectionAttendancePercentageSchema = Joi.object({
  sectionId: Joi.string().required(),
  academicYearId: Joi.string().required(),
}).unknown(false);

module.exports = {
  recordAttendanceSchema,
  getSectionAttendanceSchema,
  getStudentAttendanceHistorySchema,
  getStudentAttendancePercentageSchema,
  getSectionAttendancePercentageSchema,
};
