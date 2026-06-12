const Joi = require("joi");

/*
  ==============================
  CLASS TEACHER VALIDATIONS
  ==============================
*/

/*
  Assign Class Teacher
*/
const assignClassTeacherSchema = Joi.object({
  teacherId: Joi.string().required(),
  sectionId: Joi.string().required(),
  academicYearId: Joi.string().required(),
}).unknown(false);

/*
  Replace Class Teacher
  - academicYearId must be provided (immutable)
  - sectionId must be provided (immutable)
*/
const replaceClassTeacherSchema = Joi.object({
  teacherId: Joi.string().required(),
  sectionId: Joi.string().required(),
  academicYearId: Joi.string().required(),
}).unknown(false);

/*
  ==============================
  SUBJECT TEACHER VALIDATIONS
  ==============================
*/

/*
  Assign Subject Teacher
*/
const assignSubjectTeacherSchema = Joi.object({
  teacherId: Joi.string().required(),
  sectionId: Joi.string().required(),
  subjectId: Joi.string().required(),
  academicYearId: Joi.string().required(),
}).unknown(false);

/*
  Replace Subject Teacher
*/
const replaceSubjectTeacherSchema = Joi.object({
  teacherId: Joi.string().required(),
  sectionId: Joi.string().required(),
  subjectId: Joi.string().required(),
  academicYearId: Joi.string().required(),
}).unknown(false);

/*
  ==============================
  READ OPERATIONS VALIDATIONS
  ==============================
*/

const getClassTeacherSchema = Joi.object({
  sectionId: Joi.string().required(),
  academicYearId: Joi.string().required(),
}).unknown(false);

const getSubjectTeachersSchema = Joi.object({
  sectionId: Joi.string().required(),
  academicYearId: Joi.string().required(),
}).unknown(false);

const getTeacherAssignmentsSchema = Joi.object({
  teacherId: Joi.string().required(),
  academicYearId: Joi.string().required(),
}).unknown(false);

const getAssignmentsByAcademicYearSchema = Joi.object({
  academicYearId: Joi.string().required(),
}).unknown(false);

module.exports = {
  assignClassTeacherSchema,
  replaceClassTeacherSchema,
  assignSubjectTeacherSchema,
  replaceSubjectTeacherSchema,
  getClassTeacherSchema,
  getSubjectTeachersSchema,
  getTeacherAssignmentsSchema,
  getAssignmentsByAcademicYearSchema,
};
