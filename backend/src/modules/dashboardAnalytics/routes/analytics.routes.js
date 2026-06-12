const express = require("express");
const router = express.Router();

const {
  getAdminOverviewController,
  getAdminSectionDrilldownController,
  getTeacherDashboardController,
  getStudentDashboardController,
} = require("../controllers/analytics.controller");

/*
  ==============================
  Admin Dashboard Routes
  ==============================
*/

// GET /api/analytics/admin-overview?yearId=&date=
router.get("/admin-overview", getAdminOverviewController);

/*
  ==============================
  Admin Section Drilldown Route
  ==============================
*/

// GET /analytics/section-drilldown?sectionId=&yearId=&examInstanceId=
router.get("/section-drilldown", getAdminSectionDrilldownController);

/*
  ==============================
  Teacher Dashboard Route
  ==============================
*/

// GET /analytics/teacher-dashboard?userId=&yearId=
router.get(
  "/teacher-dashboard",
  getTeacherDashboardController
);

/*
  ==============================
  Student Dashboard Route
  ==============================
*/

// GET /analytics/student-dashboard?userId=&yearId=
router.get(
  "/student-dashboard",
  getStudentDashboardController
);

module.exports = router;
