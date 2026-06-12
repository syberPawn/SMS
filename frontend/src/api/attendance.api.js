import axios from "./axiosInstance";

/*
=====================================
Attendance API Layer
=====================================
Pure HTTP communication.
No validation logic.
No state logic.
No auth logic.
*/

/*
=====================================
ATTENDANCE RECORDING
=====================================
*/

// POST /attendance
export const recordAttendance = async (data) => {
  const response = await axios.post("/attendance", data);
  return response.data;
};

/*
=====================================
SECTION VIEW
=====================================
*/

// GET /attendance
export const fetchSectionAttendance = async (
  academicYearId,
  sectionId,
  startDate,
  endDate,
) => {
  const response = await axios.get("/attendance", {
    params: { academicYearId, sectionId, startDate, endDate },
  });
  return response.data;
};

/*
=====================================
STUDENT SELF VIEW
=====================================
*/

// GET /attendance/student
export const fetchStudentAttendance = async (academicYearId) => {
  const response = await axios.get("/attendance/student", {
    params: { academicYearId },
  });
  return response.data;
};

/*
=====================================
PERCENTAGES
=====================================
*/

// GET /attendance/student/percentage
export const fetchStudentAttendancePercentage = async (academicYearId) => {
  const response = await axios.get("/attendance/student/percentage", {
    params: { academicYearId },
  });

  return response.data;
};

// GET /attendance/section/percentage
export const fetchSectionAttendancePercentage = async (
  sectionId,
  academicYearId,
) => {
  const response = await axios.get("/attendance/section/percentage", {
    params: { sectionId, academicYearId },
  });
  return response.data;
};

/*
=====================================
SECTION ATTENDANCE PERCENTAGE
=====================================
*/

