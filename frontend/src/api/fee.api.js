import axios from "./axiosInstance";

/*
=====================================
Fee Management API Layer
=====================================
Pure HTTP communication.
No validation logic.
No state logic.
No auth logic.
*/

/*
=====================================
FEE STRUCTURE
=====================================
*/

// POST /fees/structure
export const createFeeStructure = async (data) => {
  const response = await axios.post("/fees/structure", data);
  return response.data;
};

// GET /fees/structure
export const fetchFeeStructures = async (params = {}) => {
  const response = await axios.get("/fees/structure", { params });
  return response.data;
};
/*
=====================================
RECORD PAYMENT
=====================================
*/

// POST /fees/payment
export const recordPayment = async (data) => {
  const response = await axios.post("/fees/payment", data);
  return response.data;
};
/*
=====================================
STUDENT FEE STATUS
=====================================
*/

// GET /fees/student-status
export const fetchStudentFeeStatus = async (enrollmentId) => {
  const res = await axios.get("/fees/student-status", {
    params: enrollmentId ? { enrollmentId } : {},
  });

  return res.data;
};

/*
=====================================
SECTION FEE SUMMARY
=====================================
*/

// GET /fees/section-summary
export const fetchSectionFeeSummary = async (params) => {
  const response = await axios.get("/fees/section-summary", {
    params,
  });

  return response.data;
};
