import axios from "./axiosInstance";

/*
=====================================
Teacher Assignment API Layer
=====================================
Pure HTTP communication.
No validation logic.
No state logic.
No auth logic.
*/

/*
=====================================
CLASS TEACHER
=====================================
*/

// POST /class-teachers
export const assignClassTeacher = async (data) => {
  const response = await axios.post("/class-teachers", data);
  return response.data;
};

// PATCH /class-teachers
export const replaceClassTeacher = async (data) => {
  const response = await axios.patch("/class-teachers", data);
  return response.data;
};

// GET /class-teachers
export const fetchClassTeacher = async (sectionId, academicYearId) => {
  const response = await axios.get("/class-teachers", {
    params: { sectionId, academicYearId },
  });
  return response.data;
};

/*
=====================================
SUBJECT TEACHER
=====================================
*/

// POST /subject-teachers
export const assignSubjectTeacher = async (data) => {
  const response = await axios.post("/subject-teachers", data);
  return response.data;
};

// PATCH /subject-teachers
export const replaceSubjectTeacher = async (data) => {
  const response = await axios.patch("/subject-teachers", data);
  return response.data;
};

// GET /subject-teachers
export const fetchSubjectTeachers = async (sectionId, academicYearId) => {
  const response = await axios.get("/subject-teachers", {
    params: { sectionId, academicYearId },
  });
  return response.data;
};

/*
=====================================
READ OPERATIONS
=====================================
*/

// GET /teacher-assignments
export const fetchTeacherAssignments = async (teacherId, academicYearId) => {
  const response = await axios.get("/teacher-assignments", {
    params: { teacherId, academicYearId },
  });
  return response.data;
};

// GET /assignments
export const fetchAssignmentsByYear = async (academicYearId) => {
  const response = await axios.get("/assignments", {
    params: { academicYearId },
  });
  return response.data;
};

// GET /student-my-teachers
export const fetchStudentMyTeachers = async (academicYearId) => {
  const response = await axios.get("/student-my-teachers", {
    params: { academicYearId },
  });
  return response.data;
};
