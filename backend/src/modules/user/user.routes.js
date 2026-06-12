const express = require("express");
const router = express.Router();

const {
  create,
  update,
  deactivate,
  getById,
  getAll,
} = require("./controllers/user.controller");

// POST /users
router.post("/", create);

// GET /users
router.get("/", getAll);

// PATCH /users/:id
router.patch("/:id", update);

// PATCH /users/:id/deactivate
router.patch("/:id/deactivate", deactivate);

// GET /users/:id
router.get("/:id", getById);

module.exports = router;
