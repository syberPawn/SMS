const express = require("express");

const {
  createClassTeacher,
  updateClassTeacher,
  createSubjectTeacher,
  updateSubjectTeacher,
  getClassTeacherController,
  getSubjectTeachersController,
  getTeacherAssignmentsController,
  getAssignmentsByYearController,
  getStudentMyTeachersController,
} = require("../controllers/teacherAssignment.controller");

const router = express.Router();

/*
  =====================================
  CLASS TEACHER
  =====================================
*/

router.post("/class-teachers", createClassTeacher);
router.patch("/class-teachers", updateClassTeacher);

/*
  =====================================
  SUBJECT TEACHER
  =====================================
*/

router.post("/subject-teachers", createSubjectTeacher);
router.patch("/subject-teachers", updateSubjectTeacher);

/*
  =====================================
  READ
  =====================================
*/

router.get("/class-teachers", getClassTeacherController);
router.get("/subject-teachers", getSubjectTeachersController);
router.get("/student-my-teachers", getStudentMyTeachersController);
router.get("/teacher-assignments", getTeacherAssignmentsController);
router.get("/assignments", getAssignmentsByYearController);

module.exports = router;
