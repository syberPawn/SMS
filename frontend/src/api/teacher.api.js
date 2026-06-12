import axios from "./axiosInstance";

/*
=====================================
Teacher API Layer
=====================================
*/

export const createTeacher = async (data) => {
  const response = await axios.post("/teachers", data);
  return response.data;
};

export const fetchTeachers = async (params = {}) => {
  const response = await axios.get("/teachers", { params });
  return response.data;
};
