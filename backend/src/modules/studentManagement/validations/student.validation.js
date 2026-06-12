const Joi = require("joi");

/*
  ENUMS
*/

const identityStatusEnum = ["ACTIVE", "INACTIVE"];
const genderEnum = ["MALE", "FEMALE", "OTHER"];
const enrollmentStatusEnum = [
  "ACTIVE",
  "PROMOTED",
  "REPEATING",
  "WITHDRAWN",
  "COMPLETED",
];

/*
  ==============================
  STUDENT IDENTITY VALIDATIONS
  ==============================
*/

/*
  Create Student Identity
  - identityStatus must NOT be accepted from client
*/
const createStudentIdentitySchema = Joi.object({
  userId: Joi.string().required(),
  fullName: Joi.string().required(),
  dateOfBirth: Joi.date().required(),
  gender: Joi.string()
    .valid(...genderEnum)
    .required(),
  admissionNumber: Joi.string().required(),
}).unknown(false);

/*
  Update Student Identity
  - Immutable fields must NOT be accepted
*/
const updateStudentIdentitySchema = Joi.object({
  fullName: Joi.string().optional(),
  gender: Joi.string()
    .valid(...genderEnum)
    .optional(),
})
  .min(1)
  .unknown(false);

/*
  Deactivate Student Identity
  - No body required
*/
const deactivateStudentIdentitySchema = Joi.object({}).unknown(false);

/*
  ==============================
  ENROLLMENT VALIDATIONS
  ==============================
*/

/*
  Create Enrollment
  - enrollmentStatus must NOT be accepted from client
*/
const createEnrollmentSchema = Joi.object({
  studentId: Joi.string().required(),
  academicYearId: Joi.string().required(),
  sectionId: Joi.string().required(),
}).unknown(false);

/*
  Update Enrollment Class
*/
const updateEnrollmentClassSchema = Joi.object({
  sectionId: Joi.string().required(),
}).unknown(false);

/*
  Update Enrollment Status
*/
const updateEnrollmentStatusSchema = Joi.object({
  enrollmentStatus: Joi.string()
    .valid(...enrollmentStatusEnum)
    .required(),
}).unknown(false);

/*
  List Students (Query Validation)
*/
const listStudentsSchema = Joi.object({
  academicYearId: Joi.string().required(),
  sectionId: Joi.string().optional(),
  name: Joi.string().optional(),
  admissionNumber: Joi.string().optional(),
}).unknown(false);

module.exports = {
  createStudentIdentitySchema,
  updateStudentIdentitySchema,
  deactivateStudentIdentitySchema,
  createEnrollmentSchema,
  updateEnrollmentClassSchema,
  updateEnrollmentStatusSchema,
  listStudentsSchema,
};
