import axiosInstance from "./axiosInstance";

/*
  =====================================
  User API
  =====================================
*/

export const fetchAllUsers = async () => {
  const response = await axiosInstance.get("/users");
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await axiosInstance.patch(`/users/${id}`, data);
  return response.data;
};

export const deactivateUser = async (id) => {
  const response = await axiosInstance.patch(`/users/${id}/deactivate`);
  return response.data;
};
