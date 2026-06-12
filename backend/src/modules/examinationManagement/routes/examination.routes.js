const express = require("express");

const {
  createExamInstancesController,
  getExamInstancesController,
  submitSubjectMarksController,
  getMarksForSubjectTeacherController,
  getMarksForClassTeacherController,
  getMarksForAdminController,
  getMarksForStudentController,
  generateReportCardController,
} = require("../controllers/examination.controller");

const router = express.Router();

/*
  =====================================
  EXAM INSTANCES
  =====================================
*/

router.post("/instances", createExamInstancesController);
router.get("/instances", getExamInstancesController);

/*
  =====================================
  SUBMIT MARKS
  =====================================
*/

router.post("/marks", submitSubjectMarksController);

/*
  =====================================
  VIEW MARKS
  =====================================
*/

router.get("/marks/subject", getMarksForSubjectTeacherController);
router.get("/marks/class", getMarksForClassTeacherController);
router.get("/marks/admin", getMarksForAdminController);
router.get("/marks/student", getMarksForStudentController);

/*
  =====================================
  REPORT CARD
  =====================================
*/

router.get("/report-card", generateReportCardController);

module.exports = router;
