import axios from "./axiosInstance";

/*
=====================================
Academic Year API Layer
=====================================
Pure HTTP communication.
No validation logic.
No state logic.
No auth logic.
*/

// GET /academic-years
export const fetchAcademicYears = async (params = {}) => {
  const response = await axios.get("/academic-years", { params });
  return response.data;
};

// POST /academic-years
export const createAcademicYear = async (data) => {
  const response = await axios.post("/academic-years", data);
  return response.data;
};

// PATCH /academic-years/:id/activate
export const activateAcademicYear = async (id) => {
  const response = await axios.patch(`/academic-years/${id}/activate`);
  return response.data;
};

// PATCH /academic-years/:id/deactivate
export const deactivateAcademicYear = async (id) => {
  const response = await axios.patch(`/academic-years/${id}/deactivate`);
  return response.data;
};
