const Joi = require("joi");

/*
  Common Enums
*/

const roleEnum = ["ADMIN", "TEACHER", "STUDENT"];
const statusEnum = ["ACTIVE", "INACTIVE"];

/*
  Auth Validation
*/

const authenticateSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
}).unknown(false);

/*
  Create User Validation
*/

const createUserSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  role: Joi.string()
    .valid(...roleEnum)
    .required(),
}).unknown(false);

/*
  Update User Validation
  (Immutable fields must NOT be accepted here)
*/

const updateUserSchema = Joi.object({
  password: Joi.string().optional(),
  status: Joi.string()
    .valid(...statusEnum)
    .optional(),
})
  .min(1)
  .unknown(false);

/*
  Deactivate User Validation
  (No body required — userId handled separately)
*/

const deactivateUserSchema = Joi.object({}).unknown(false);

module.exports = {
  authenticateSchema,
  createUserSchema,
  updateUserSchema,
  deactivateUserSchema,
};
