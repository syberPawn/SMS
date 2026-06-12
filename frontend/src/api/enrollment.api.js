import axios from "./axiosInstance";

/*
=====================================
Student Enrollment API Layer
=====================================
Pure HTTP communication.
No validation logic.
No state logic.
No auth logic.
*/

// POST /enrollments
export const createEnrollment = async (data) => {
  const response = await axios.post("/enrollments", data);
  return response.data;
};

// PATCH /enrollments/:id/class
export const updateEnrollmentClass = async (id, sectionId) => {
  const response = await axios.patch(`/enrollments/${id}/class`, {
    sectionId,
  });
  return response.data;
};

// PATCH /enrollments/:id/status
export const updateEnrollmentStatus = async (id, enrollmentStatus) => {
  const response = await axios.patch(`/enrollments/${id}/status`, {
    enrollmentStatus,
  });
  return response.data;
};

// GET /enrollments
export const fetchStudentsByEnrollment = async (params) => {
  const response = await axios.get("/enrollments", { params });
  return response.data;
};
