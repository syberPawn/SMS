const {
  createUser,
  updateUser,
  deactivateUser,
  getUserById,
  getAllUsers,
  AuthorizationError,
  ValidationError,
  DuplicateUserError,
} = require("../services/user.service");

const {
  verifyAuthenticated,
  verifyRole,
} = require("../services/authorization.service");

/*
  POST /users
*/

const create = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await createUser(req.user, req.body);

    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return res.status(403).json({ message: error.message });
    }

    if (error instanceof ValidationError) {
      return res.status(400).json({ message: error.message });
    }

    if (error instanceof DuplicateUserError) {
      return res.status(409).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/*
  PATCH /users/:id
*/

const update = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await updateUser(req.user, req.params.id, req.body);

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return res.status(403).json({ message: error.message });
    }

    if (error instanceof ValidationError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/*
  PATCH /users/:id/deactivate
*/

const deactivate = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const result = await deactivateUser(req.user, req.params.id);

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return res.status(403).json({ message: error.message });
    }

    if (error instanceof ValidationError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/*
  GET /users/:id
*/

const getById = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const user = await getUserById(req.user, req.params.id);

    return res.status(200).json(user);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return res.status(403).json({ message: error.message });
    }

    if (error instanceof ValidationError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};
/*
  GET /users
*/

const getAll = async (req, res) => {
  try {
    await verifyAuthenticated(req);
    verifyRole(req, ["ADMIN"]);

    const users = await getAllUsers(req.user);

    return res.status(200).json(users);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return res.status(403).json({ message: error.message });
    }

    if (error instanceof ValidationError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  create,
  update,
  deactivate,
  getById,
  getAll,
};
