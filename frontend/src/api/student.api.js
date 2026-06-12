import axios from "./axiosInstance";

/*
=====================================
Student Identity API Layer
=====================================
Pure HTTP communication.
No validation logic.
No state logic.
No auth logic.
*/

// POST /students
export const createStudent = async (data) => {
  const response = await axios.post("/students", data);
  return response.data;
};

// POST /students/onboard
export const createStudentWithEnrollment = async (data) => {
  const response = await axios.post("/students/onboard", data);
  return response.data;
};

// PATCH /students/:id
export const updateStudent = async (id, data) => {
  const response = await axios.patch(`/students/${id}`, data);
  return response.data;
};

// PATCH /students/:id/deactivate
export const deactivateStudent = async (id) => {
  const response = await axios.patch(`/students/${id}/deactivate`);
  return response.data;
};

// GET /students/:id
export const fetchStudentProfile = async (id) => {
  const response = await axios.get(`/students/${id}`);
  return response.data;
};

export const fetchStudents = async () => {
  const response = await axios.get("/students");
  return response.data;
};
