import axios from "./axiosInstance";

/*
=====================================
Examination API Layer
=====================================
Pure HTTP communication.
No validation logic.
No state logic.
No auth logic.
*/

/*
=====================================
EXAM INSTANCE MANAGEMENT
=====================================
*/

// POST /examination/instances
export const createExamInstances = async (data) => {
  const response = await axios.post("/examination/instances", data);
  return response.data;
};

// GET /examination/instances
export const fetchExamInstances = async (academicYearId) => {
  const response = await axios.get("/examination/instances", {
    params: { academicYearId },
  });
  return response.data;
};

/*
=====================================
SUBMIT SUBJECT MARKS
=====================================
*/

// POST /examination/marks
export const submitSubjectMarks = async (data) => {
  const response = await axios.post("/examination/marks", data);
  return response.data;
};

/*
=====================================
VIEW MARKS
=====================================
*/

// GET /examination/marks/subject
export const fetchMarksForSubjectTeacher = async (params) => {
  const response = await axios.get("/examination/marks/subject", {
    params,
  });
  console.log("Marks Response:", JSON.stringify(response.data, null, 2));
  return response.data;
};

// GET /examination/marks/class
export const fetchMarksForClassTeacher = async (params) => {
  const response = await axios.get("/examination/marks/class", {
    params,
  });
  return response.data;
};

// GET /examination/marks/admin
export const fetchMarksForAdmin = async (params) => {
  const response = await axios.get("/examination/marks/admin", {
    params,
  });
  return response.data;
};

// GET /examination/marks/student
export const fetchMarksForStudent = async (examInstanceId) => {
  const response = await axios.get("/examination/marks/student", {
    params: { examInstanceId },
  });
  return response.data;
};

/*
=====================================
REPORT CARD
=====================================
*/

// GET /examination/report-card
export const fetchReportCard = async (examInstanceId) => {
  const response = await axios.get("/examination/report-card", {
    params: { examInstanceId },
  });
  return response.data;
};


