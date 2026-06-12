const express = require("express");
const router = express.Router();

const {
  create,
  unmap,
  getByGrade,
  copy,
} = require("../controllers/gradeSubjectMapping.controller");

/*
  =====================================
  Grade–Subject Mapping Routes
  =====================================
*/

router.post("/", create);
router.patch("/:id/unmap", unmap);
router.get("/", getByGrade);
router.post("/copy", copy);

module.exports = router;
