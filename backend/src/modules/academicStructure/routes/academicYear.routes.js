const express = require("express");
const router = express.Router();

const {
  create,
  activate,
  deactivate,
  getAll,
} = require("../controllers/academicYear.controller");

/*
  =====================================
  Academic Year Routes
  =====================================
*/

router.post("/", create);
router.patch("/:id/activate", activate);
router.patch("/:id/deactivate", deactivate);
router.get("/", getAll);

module.exports = router;
