import axios from "./axiosInstance";

/*
=====================================
Grade-Subject Mapping API Layer
=====================================
Pure HTTP communication.
No validation logic.
No state logic.
No auth logic.
*/

// GET /grade-subject-mappings?gradeId=...
export const fetchMappingsByGrade = async (gradeId) => {
  const response = await axios.get("/grade-subject-mappings", {
    params: { gradeId },
  });
  return response.data;
};

// POST /grade-subject-mappings
export const mapSubjectToGrade = async (data) => {
  const response = await axios.post("/grade-subject-mappings", data);
  return response.data;
};

// PATCH /grade-subject-mappings/:id/unmap
export const unmapSubjectFromGrade = async (id) => {
  const response = await axios.patch(`/grade-subject-mappings/${id}/unmap`);
  return response.data;
};
