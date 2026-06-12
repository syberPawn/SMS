const bcrypt = require("bcrypt");

const User = require("../models/user.model");
const {
  createUserSchema,
  updateUserSchema,
} = require("../validations/user.validation");

/*
  Domain Errors
*/

class AuthorizationError extends Error {}
class ValidationError extends Error {}
class DuplicateUserError extends Error {}

const SALT_ROUNDS = 10;

/*
  createUser
*/

const createUser = async (adminContext, userData) => {
  // Authorization: ADMIN only
  if (!adminContext || adminContext.role !== "ADMIN") {
    throw new AuthorizationError("Only ADMIN can create users");
  }

  // Validate input
  const { error, value } = createUserSchema.validate(userData);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { username, password, role } = value;

  // Enforce exactly one role (structural + validation)
  if (!role) {
    throw new ValidationError("Role is required");
  }

  // Check unique username
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    throw new DuplicateUserError("Username already exists");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const newUser = new User({
    username,
    passwordHash,
    role,
    status: "ACTIVE",
    createdBy: adminContext.userId,
    updatedBy: adminContext.userId,
  });

  await newUser.save();

  return {
    userId: newUser._id,
    username: newUser.username,
    role: newUser.role,
    status: newUser.status,
  };
};

/*
  updateUser
*/

const updateUser = async (adminContext, userId, updateData) => {
  // Authorization: ADMIN only
  if (!adminContext || adminContext.role !== "ADMIN") {
    throw new AuthorizationError("Only ADMIN can update users");
  }

  // Validate update payload
  const { error, value } = updateUserSchema.validate(updateData);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ValidationError("User not found");
  }

  // Apply allowed updates only
  if (value.password) {
    user.passwordHash = await bcrypt.hash(value.password, SALT_ROUNDS);
  }

  if (value.status) {
    user.status = value.status;
  }

  user.updatedBy = adminContext.userId;

  await user.save();

  return {
    userId: user._id,
    username: user.username,
    role: user.role,
    status: user.status,
  };
};

/*
  deactivateUser
*/

const deactivateUser = async (adminContext, userId) => {
  if (!adminContext || adminContext.role !== "ADMIN") {
    throw new AuthorizationError("Only ADMIN can deactivate users");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ValidationError("User not found");
  }

  user.status = "INACTIVE";
  user.updatedBy = adminContext.userId;

  await user.save();

  return {
    userId: user._id,
    status: user.status,
  };
};

/*
  getUserById
*/

const getUserById = async (requestContext, userId) => {
  const user = await User.findById(userId).select("-passwordHash");

  if (!user) {
    throw new ValidationError("User not found");
  }

  return user;
};
/*
  getAllUsers
*/

const getAllUsers = async (adminContext) => {
  if (!adminContext || adminContext.role !== "ADMIN") {
    throw new AuthorizationError("Only ADMIN can view users");
  }

  const users = await User.find().select("-passwordHash");

  return users;
};

module.exports = {
  createUser,
  updateUser,
  deactivateUser,
  getUserById,
  getAllUsers,
  AuthorizationError,
  ValidationError,
  DuplicateUserError,
};
