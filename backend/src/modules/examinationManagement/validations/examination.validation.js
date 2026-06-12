const Joi = require("joi");

/*
  ==============================
  CREATE EXAM INSTANCES
  ==============================
*/

const createExamInstancesSchema = Joi.object({
  academicYearId: Joi.string().required(),
  halfYearlyExamDate: Joi.date().required(),
  endTermExamDate: Joi.date().required(),
}).unknown(false);

/*
  ==============================
  GET EXAM INSTANCES BY YEAR
  ==============================
*/

const getExamInstancesByYearSchema = Joi.object({
  academicYearId: Joi.string().required(),
}).unknown(false);

/*
  ==============================
  SUBMIT SUBJECT MARKS
  ==============================
*/

const submitSubjectMarksSchema = Joi.object({
  examInstanceId: Joi.string().required(),
  sectionId: Joi.string().required(),
  subjectId: Joi.string().required(),
  teacherId: Joi.string().required(),

  marks: Joi.array()
    .items(
      Joi.object({
        enrollmentId: Joi.string().required(),
        marksObtained: Joi.number().required(),
      }).unknown(false),
    )
    .min(1)
    .required(),
}).unknown(false);

/*
  ==============================
  VIEW MARKS — SUBJECT TEACHER
  ==============================
*/

const getMarksForSubjectTeacherSchema = Joi.object({
  teacherId: Joi.string().required(),
  examInstanceId: Joi.string().required(),
  sectionId: Joi.string().required(),
  subjectId: Joi.string().required(),
}).unknown(false);

/*
  ==============================
  VIEW MARKS — CLASS TEACHER
  ==============================
*/

const getMarksForClassTeacherSchema = Joi.object({
  sectionId: Joi.string().required(),
  examInstanceId: Joi.string().required(),
}).unknown(false);

/*
  ==============================
  VIEW MARKS — ADMIN
  ==============================
*/

const getMarksForAdminSchema = Joi.object({
  examInstanceId: Joi.string().optional(),
  academicYearId: Joi.string().optional(),
}).unknown(false);

/*
  ==============================
  VIEW MARKS — STUDENT
  ==============================
*/

const getMarksForStudentSchema = Joi.object({
  studentId: Joi.string().required(),
  examInstanceId: Joi.string().required(),
}).unknown(false);

/*
  ==============================
  GENERATE REPORT CARD
  ==============================
*/

const generateReportCardSchema = Joi.object({
  studentId: Joi.string().required(),
  examInstanceId: Joi.string().required(),
}).unknown(false);

module.exports = {
  createExamInstancesSchema,
  getExamInstancesByYearSchema,
  submitSubjectMarksSchema,
  getMarksForSubjectTeacherSchema,
  getMarksForClassTeacherSchema,
  getMarksForAdminSchema,
  getMarksForStudentSchema,
  generateReportCardSchema,
};
