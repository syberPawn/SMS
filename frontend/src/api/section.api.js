import axios from "./axiosInstance";

/*
=====================================
Section API Layer
=====================================
Pure HTTP communication.
No validation logic.
No state logic.
No auth logic.
*/

// GET /sections?gradeId=...
export const fetchSectionsByGrade = async (gradeId) => {
  const response = await axios.get("/sections", {
    params: { gradeId },
  });
  return response.data;
};

// POST /sections
export const createSection = async (data) => {
  const response = await axios.post("/sections", data);
  return response.data;
};

// PATCH /sections/:id/deactivate
export const deactivateSection = async (id) => {
  const response = await axios.patch(`/sections/${id}/deactivate`);
  return response.data;
};

export const fetchAllSections = async () => {
  const response = await axios.get("/sections");
  return response.data;
};
