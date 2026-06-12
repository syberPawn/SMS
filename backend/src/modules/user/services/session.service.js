const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  const payload = {
    userId: user._id,
    role: user.role,
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, options);

  return token;
};

const isSessionExpired = (decodedToken) => {
  if (!decodedToken || !decodedToken.exp) {
    return true;
  }

  const currentTimeInSeconds = Math.floor(Date.now() / 1000);

  return currentTimeInSeconds > decodedToken.exp;
};

module.exports = {
  generateToken,
  isSessionExpired,
};
