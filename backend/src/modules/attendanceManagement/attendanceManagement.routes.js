const express = require("express");

const attendanceRoutes = require("./routes/attendance.routes");

const router = express.Router();

/*
  Mount Attendance Routes
*/

router.use("/attendance", attendanceRoutes);

module.exports = router;
