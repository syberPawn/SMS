const express = require("express");

const {
  createAttendance,
  getSectionAttendanceController,
  getStudentAttendanceHistoryController,
  getStudentAttendancePercentageController,
  getSectionAttendancePercentageController,
} = require("../controllers/attendance.controller");

const router = express.Router();

/*
  =====================================
  ATTENDANCE
  =====================================
*/

router.post("/", createAttendance);
router.get("/", getSectionAttendanceController);
/*
  Student self attendance history
*/
router.get("/student", getStudentAttendanceHistoryController);

/*
  =====================================
  STUDENT PERCENTAGE
  =====================================
*/

router.get("/student/percentage", getStudentAttendancePercentageController);

/*
  =====================================
  SECTION PERCENTAGE
  =====================================
*/

router.get("/section/percentage", getSectionAttendancePercentageController);

module.exports = router;
