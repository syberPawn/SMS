import { useEffect, useState } from "react";
import { fetchActiveNotices } from "../api/notice.api";

const StudentNoticesPage = () => {
  const [notices, setNotices] = useState([]);

  /*
  =====================================
  Load Active Notices
  =====================================
  */
  useEffect(() => {
    const loadNotices = async () => {
      try {
        const data = await fetchActiveNotices();
        setNotices(data);
      } catch (error) {
        console.error("Failed to load notices", error);
        setNotices([]);
      }
    };

    loadNotices();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>School Notices</h2>

      <hr />

      {notices.length === 0 ? (
        <div>No notices available.</div>
      ) : (
        <div>
          {notices.map((notice) => (
            <div key={notice._id} style={{ marginBottom: "20px" }}>
              <strong>{notice.title}</strong>

              <p>{notice.description}</p>

              <small>
                Created At: {new Date(notice.createdAt).toLocaleString()}
              </small>

              <hr />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentNoticesPage;
