import { useEffect, useState } from "react";

import {
  createNotice,
  fetchAdminNotices,
  changeNoticeStatus,
} from "../api/notice.api";

function AdminNoticesPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [notices, setNotices] = useState([]);

  const [message, setMessage] = useState("");

  const loadNotices = async () => {
    try {
      const data = await fetchAdminNotices();
      setNotices(data);
    } catch (error) {
      console.error("Failed to load notices");
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await createNotice({
        title,
        description,
      });

      setMessage("Notice created successfully");

      setTitle("");
      setDescription("");

      loadNotices();
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message);
      } else {
        setMessage("Error creating notice");
      }
    }
  };

  const handleStatusChange = async (noticeId, currentStatus) => {
    try {
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";

      await changeNoticeStatus(noticeId, {
        status: newStatus,
      });

      loadNotices();
    } catch (error) {
      console.error("Failed to change notice status");
    }
  };

  return (
    <div>
      <h2>Notice Management</h2>

      <h3>Create Notice</h3>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label>
          <br />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <br />

        <div>
          <label>Description:</label>
          <br />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <br />

        <button type="submit">Create Notice</button>
      </form>

      {message && <p style={{ color: "blue" }}>{message}</p>}

      <hr />

      <h3>All Notices</h3>

      {notices.length === 0 ? (
        <p>No notices available</p>
      ) : (
        <ul>
          {notices.map((notice) => (
            <li key={notice._id}>
              <strong>{notice.title}</strong> — {notice.status}
              <br />
              {notice.description}
              <br />
              <button
                onClick={() => handleStatusChange(notice._id, notice.status)}
              >
                Toggle Status
              </button>
              <hr />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminNoticesPage;
