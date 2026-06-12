import axios from "./axiosInstance";

/*
=====================================
ANALYTICS API LAYER
=====================================
Pure HTTP communication.
No validation logic.
No state logic.
No auth logic.
*/

/*
=====================================
ADMIN DASHBOARD
=====================================
*/

// GET /analytics/admin-overview
export const fetchAdminOverview = async (
  date,
  yearId,
  attendanceWindow,
  examType,
) => {
  const response = await axios.get("/analytics/admin-overview", {
    params: { date, yearId, attendanceWindow, examType },
  });

  return response.data;
};

/*
=====================================
SECTION DRILLDOWN
=====================================
*/

// GET /analytics/section-drilldown
export const fetchSectionDrilldown = async (
  sectionId,
  yearId,
  examInstanceId,
  examType,
  subjectId,
) => {
  const response = await axios.get("/analytics/section-drilldown", {
    params: { sectionId, yearId, examInstanceId, examType, subjectId },
  });

  return response.data;
};

/*
=====================================
TEACHER DASHBOARD
=====================================
*/

// GET /analytics/teacher-dashboard
export const fetchTeacherDashboard = async (userId, yearId) => {
  const response = await axios.get("/analytics/teacher-dashboard", {
    params: { userId, yearId },
  });

  return response.data;
};

/*
=====================================
STUDENT DASHBOARD
=====================================
*/

// GET /analytics/student-dashboard
export const fetchStudentDashboard = async (userId, yearId) => {
  const response = await axios.get("/analytics/student-dashboard", {
    params: { userId, yearId },
  });

  return response.data;
};
