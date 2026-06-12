const {
  authenticate,
  AuthenticationFailedError,
  AccountDeactivatedError,
  SessionExpiredError,
} = require("../services/auth.service");

const login = async (req, res) => {
  try {
    const result = await authenticate(req.body);

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AuthenticationFailedError) {
      return res.status(401).json({ message: error.message });
    }

    if (error instanceof AccountDeactivatedError) {
      return res.status(403).json({ message: error.message });
    }

    if (error instanceof SessionExpiredError) {
      return res.status(401).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  login,
};
