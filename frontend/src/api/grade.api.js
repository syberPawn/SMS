import axios from "./axiosInstance";

/*
=====================================
Grade API Layer
=====================================
Pure HTTP communication.
No validation logic.
No state logic.
No auth logic.
*/

// GET /grades?academicYearId=...
export const fetchGradesByYear = async (academicYearId) => {
  const response = await axios.get("/grades", {
    params: { academicYearId },
  });
  return response.data;
};

// POST /grades
export const createGrade = async (data) => {
  const response = await axios.post("/grades", data);
  return response.data;
};

// PATCH /grades/:id/deactivate
export const deactivateGrade = async (id) => {
  const response = await axios.patch(`/grades/${id}/deactivate`);
  return response.data;
};
