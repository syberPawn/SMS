const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const User = require("../models/user.model");
const { authenticateSchema } = require("../validations/user.validation");
const { generateToken, isSessionExpired } = require("./session.service");

/*
  Domain Errors (Temporary Basic Implementation)
  Later we will move these to a dedicated errors module
*/

class AuthenticationFailedError extends Error {}
class AccountDeactivatedError extends Error {}
class SessionExpiredError extends Error {}

const authenticate = async (credentials) => {
  // Validate input structure
  const { error, value } = authenticateSchema.validate(credentials);
  if (error) {
    throw new AuthenticationFailedError("Invalid credentials format");
  }

  const { username, password } = value;

  // Fetch user including passwordHash
  const user = await User.findOne({ username }).select("+passwordHash");

  if (!user) {
    throw new AuthenticationFailedError("Invalid username or password");
  }

  // Enforce ACTIVE status (BR-UA-03)
  if (user.status !== "ACTIVE") {
    throw new AccountDeactivatedError("Account is deactivated");
  }

  // Validate password
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    throw new AuthenticationFailedError("Invalid username or password");
  }

  // Generate JWT
  const token = generateToken(user);

  return {
    token,
    userId: user._id,
    role: user.role,
  };
};

const validateToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Expiration check (DS-UA-04)
    if (isSessionExpired(decoded)) {
      throw new SessionExpiredError("Session expired");
    }

    // Check user still ACTIVE
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new AuthenticationFailedError("Invalid session");
    }

    if (user.status !== "ACTIVE") {
      throw new AccountDeactivatedError("Account is deactivated");
    }

    return {
      userId: user._id,
      role: user.role,
      status: user.status,
    };
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new SessionExpiredError("Session expired");
    }

    throw new AuthenticationFailedError("Invalid token");
  }
};

module.exports = {
  authenticate,
  validateToken,
  AuthenticationFailedError,
  AccountDeactivatedError,
  SessionExpiredError,
};
