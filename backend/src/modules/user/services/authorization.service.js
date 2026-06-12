const {
  validateToken,
  AuthenticationFailedError,
  AccountDeactivatedError,
  SessionExpiredError,
} = require("./auth.service");

class AuthorizationError extends Error {}

const extractTokenFromRequest = (request) => {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthenticationFailedError("Authorization token missing");
  }

  return authHeader.split(" ")[1];
};

/*
  verifyAuthenticated
  - Extract token
  - Validate token
  - Attach identity to request context
*/

const verifyAuthenticated = async (request) => {
  const token = extractTokenFromRequest(request);

  const validatedIdentity = await validateToken(token);

  // Attach identity to request context
  request.user = validatedIdentity;

  return validatedIdentity;
};

/*
  verifyRole
  - Enforce allowed roles
*/

const verifyRole = (request, allowedRoles = []) => {
  if (!request.user) {
    throw new AuthorizationError("Unauthorized access");
  }

  if (!allowedRoles.includes(request.user.role)) {
    throw new AuthorizationError("Forbidden");
  }

  return true;
};

/*
  verifyAssignment
  - Delegates assignment validation to another domain
  - Does NOT implement academic logic
*/

const verifyAssignment = async (request, validationFn) => {
  if (typeof validationFn !== "function") {
    throw new AuthorizationError("Invalid assignment validation handler");
  }

  return await validationFn(request.user);
};

module.exports = {
  verifyAuthenticated,
  verifyRole,
  verifyAssignment,
  AuthorizationError,
};
