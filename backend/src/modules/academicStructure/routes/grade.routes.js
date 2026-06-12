const express = require("express");
const router = express.Router();

const {
  create,
  deactivate,
  getByAcademicYear,
} = require("../controllers/grade.controller");

/*
  =====================================
  Grade Routes
  =====================================
*/

router.post("/", create);
router.patch("/:id/deactivate", deactivate);
router.get("/", getByAcademicYear);

module.exports = router;
