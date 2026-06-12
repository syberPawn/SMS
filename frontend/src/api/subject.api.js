import axios from "./axiosInstance";

/*
=====================================
Subject API Layer
=====================================
Pure HTTP communication.
No validation logic.
No state logic.
No auth logic.
*/

// GET /subjects
export const fetchSubjects = async () => {
  const response = await axios.get("/subjects");
  return response.data;
};

// POST /subjects
export const createSubject = async (data) => {
  const response = await axios.post("/subjects", data);
  return response.data;
};

// PATCH /subjects/:id/deactivate
export const deactivateSubject = async (id) => {
  const response = await axios.patch(`/subjects/${id}/deactivate`);
  return response.data;
};

// PATCH /subjects/:id/activate
export const activateSubject = async (id) => {
  const response = await axios.patch(`/subjects/${id}/activate`);
  return response.data;
};
