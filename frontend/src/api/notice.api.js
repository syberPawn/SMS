import axios from "./axiosInstance";

/*
=====================================
Notice Management API Layer
=====================================
Pure HTTP communication.
No validation logic.
No state logic.
No auth logic.
*/

/*
=====================================
CREATE NOTICE
=====================================
*/

// POST /notices
export const createNotice = async (data) => {
  const response = await axios.post("/notices", data);
  return response.data;
};

/*
=====================================
ADMIN NOTICE LISTING
=====================================
*/

// GET /notices/admin
export const fetchAdminNotices = async (params) => {
  const response = await axios.get("/notices/admin", {
    params,
  });

  return response.data;
};

/*
=====================================
ACTIVE NOTICES (Teacher / Student)
=====================================
*/

// GET /notices
export const fetchActiveNotices = async () => {
  const response = await axios.get("/notices");
  return response.data;
};

/*
=====================================
CHANGE NOTICE STATUS
=====================================
*/

// PATCH /notices/:id/status
export const changeNoticeStatus = async (noticeId, data) => {
  const response = await axios.patch(`/notices/${noticeId}/status`, data);
  return response.data;
};
