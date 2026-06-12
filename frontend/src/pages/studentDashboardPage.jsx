import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchStudentDashboard } from "../api/analytics.api";
import { fetchActiveNotices } from "../api/notice.api";
import { AuthContext } from "../context/AuthContext";
import "./adminDashboardPage.css";
import "./roleDashboard.css";

const formatPercent = (value) =>
  value === null || value === undefined ? "N/A" : `${value} %`;

const formatStatNumber = (value, size = 3) => {
  if (value === null || value === undefined) {
    return "0".repeat(size);
  }

  return String(Math.round(value)).padStart(size, "0");
};

const percentWidth = (value) =>
  `${Math.max(Math.min(typeof value === "number" ? value : 0, 100), 0)}%`;

const formatExamType = (type) => {
  if (type === "HALF_YEARLY") return "Half Yearly";
  if (type === "END_TERM") return "End Term";

  return type
    ? type
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Exam";
};

const examTypeOrder = {
  HALF_YEARLY: 1,
  END_TERM: 2,
};

const examSlots = ["HALF_YEARLY", "END_TERM"];

const formatExamDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "Exam Date";

const formatChange = (value) => {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return `${value > 0 ? "+" : ""}${value} %`;
};

const getSubjectPercent = (subject) =>
  subject.maxMarks > 0
    ? Math.round((subject.marksObtained / subject.maxMarks) * 1000) / 10
    : null;

const getTotalMaxMarks = (subjects) =>
  subjects.reduce((total, subject) => total + (subject.maxMarks || 0), 0);

const StudentDashboardPage = () => {
  const { userId } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const [response, activeNotices] = await Promise.all([
        fetchStudentDashboard(userId),
        fetchActiveNotices(),
      ]);
      setData(response?.data === null ? null : response);
      setNotices(activeNotices || []);
    } catch (error) {
      console.error("Failed to load student dashboard:", error);
      setData(null);
      setNotices([]);
      setMessage("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setData(null);
      setMessage("Student session not available.");
      return;
    }

    loadDashboard();
  }, [loadDashboard, userId]);

  const exams = useMemo(
    () =>
      [...(Array.isArray(data?.exams) ? data.exams : [])].sort(
        (a, b) =>
          (examTypeOrder[a.type] || 99) - (examTypeOrder[b.type] || 99) ||
          formatExamType(a.type).localeCompare(formatExamType(b.type)),
      ),
    [data],
  );
  const halfYearlyExam = exams.find((exam) => exam.type === "HALF_YEARLY") || null;
  if (loading) {
    return <div className="role-dashboard-empty">Loading student dashboard...</div>;
  }

  if (message) {
    return <div className="role-dashboard-empty">{message}</div>;
  }

  if (!data) {
    return <div className="role-dashboard-empty">No data available.</div>;
  }

  if (
    exams.length === 0 &&
    data.attendancePercentage === null &&
    data.comparison === null
  ) {
    return (
      <div className="role-dashboard-empty">
        No dashboard data is available for your active enrollment yet.
      </div>
    );
  }

  return (
    <StudentDashboardView
      attendancePercentage={data.attendancePercentage}
      classTeacher={data.classTeacher}
      comparison={data.comparison}
      exams={exams}
      halfYearlyExam={halfYearlyExam}
      notices={notices.slice(0, 4)}
      student={data.student}
    />
  );
};

  /*

  if (loading) return <p>Loading...</p>;
  if (message) return <p>{message}</p>;
  if (!data) return <p>No data available</p>;

  const exams = Array.isArray(data.exams) ? data.exams : [];

  if (
    exams.length === 0 &&
    data.attendancePercentage === null &&
    data.comparison === null
  ) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>Student Dashboard</h1>
        <p>No dashboard data is available for your active enrollment yet.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Student Dashboard</h1>

      <p>Attendance: {data.attendancePercentage ?? "N/A"}%</p>

      <h2>Exams</h2>

      {exams.length === 0 ? (
        <p>No exam records available.</p>
      ) : (
        exams.map((exam) => (
          <div key={exam.examInstanceId} style={cardStyle}>
            <h3>{exam.type}</h3>

            {exam.subjects.length === 0 ? (
              <p>No marks available</p>
            ) : (
              exam.subjects.map((s, index) => (
                <p key={index}>
                {s.subjectName} — {s.marksObtained}/{s.maxMarks}
                </p>
              ))
            )}

            <p>Total: {exam.totalMarks ?? "N/A"}</p>
            <p>Percentage: {exam.percentage ?? "N/A"}</p>
          </div>
        ))
      )}

      <h2>Comparison</h2>
      <p>
        {data.comparison === null
          ? "Not available"
          : `Change: ${data.comparison}`}
      </p>
    </div>
  );
};

const cardStyle = {
  border: "1px solid #ccc",
  padding: "15px",
  marginBottom: "15px",
  borderRadius: "8px",
};

*/

const StudentDashboardView = ({
  attendancePercentage,
  classTeacher,
  comparison,
  exams,
  halfYearlyExam,
  notices,
  student,
}) => {
  return (
    <div className="admin-dashboard student-admin-dashboard">
      <div className="admin-dashboard-main">
        <div className="admin-stat-grid">
          <article className="admin-stat-card purple">
            <h3>{formatStatNumber(attendancePercentage)}</h3>
            <p>Attendance</p>
          </article>
          <article className="admin-stat-card gold">
            <h3>{formatStatNumber(exams.length, 2)}</h3>
            <p>Exams conducted</p>
          </article>
          <article className="admin-stat-card purple">
            <h3>{formatStatNumber(halfYearlyExam?.percentage)}</h3>
            <p>Latest Score (Half yearly)</p>
          </article>
          <article className="admin-stat-card gold">
            <h3>{formatChange(comparison)}</h3>
            <p>Delta</p>
          </article>
        </div>

        <section className="admin-panel-card">
          <div className="admin-panel-header">
            <div>
              <h3>Exam results</h3>
              <p className="admin-panel-subtitle">
                Subject wise marks from available records.
              </p>
            </div>
          </div>

          {exams.length === 0 ? (
            <div className="admin-panel-empty">No exam records available.</div>
          ) : (
            <div className="student-exam-result-stack">
              {exams.map((exam) => {
                const subjects = exam.subjects || [];
                const totalMaxMarks = getTotalMaxMarks(subjects);

                return (
                  <article className="student-exam-result-card" key={exam.examInstanceId}>
                    <div className="student-exam-result-head">
                      <div>
                        <h4>{formatExamType(exam.type)}</h4>
                        <span>
                          Total: {totalMaxMarks || "N/A"} | Obtained:{" "}
                          {exam.totalMarks ?? "N/A"}
                        </span>
                      </div>
                      <span className="admin-top-chip">
                        {formatPercent(exam.percentage)}
                      </span>
                    </div>

                    {subjects.length === 0 ? (
                      <div className="admin-panel-empty student-panel-empty">
                        Marks not available.
                      </div>
                    ) : (
                      <div className="admin-bars">
                        {subjects.map((subject, index) => {
                          const percentage = getSubjectPercent(subject);

                          return (
                            <div
                              className="admin-bar-row"
                              key={`${subject.subjectName}-${index}`}
                            >
                              <span className="admin-bar-label">
                                {subject.subjectName}
                              </span>
                              <div className="admin-bar-track">
                                <div
                                  className={`admin-bar-fill${(percentage || 0) < 50 ? " low" : ""}`}
                                  style={{ width: percentWidth(percentage) }}
                                />
                              </div>
                              <span>{formatPercent(percentage)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <aside className="student-admin-side">
        <article className="student-teacher-summary">
          <div className="student-teacher-thumb" />
          <div>
            <span>Class teacher</span>
            <h3>{classTeacher?.fullName || "Teacher's Name"}</h3>
            <p>{classTeacher?.highestQualification || "Highest Qualification"}</p>
            <p>
              Assigned class or subject teacher
              {classTeacher?.qualificationDetail
                ? ` - ${classTeacher.qualificationDetail}`
                : ""}
            </p>
          </div>
        </article>

        <section className="admin-notices-panel student-notices-panel">
          <h3>Notices</h3>
          {notices.length === 0 ? (
            <div className="admin-panel-empty">No notices available.</div>
          ) : (
            <div className="admin-notice-list">
              {notices.map((notice, index) => (
                <article
                  className={`admin-notice-card ${
                    notice.priority === "URGENT"
                      ? "urgent"
                      : index % 2 === 0
                        ? "soft-red"
                        : "soft-yellow"
                  }`}
                  key={notice._id}
                >
                  <div className="admin-notice-head">
                    <h4>{notice.title}</h4>
                    <span>
                      Date:{" "}
                      {notice.createdAt
                        ? new Date(notice.createdAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <p>{notice.description}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="admin-panel-card student-side-panel">
          <div className="admin-panel-header">
            <h3>My Attendance</h3>
          </div>
          <div className="admin-bar-row">
            <span className="admin-bar-label">{student?.fullName || "Student"}</span>
            <div className="admin-bar-track">
              <div
                className={`admin-bar-fill${(attendancePercentage || 0) < 50 ? " low" : ""}`}
                style={{ width: percentWidth(attendancePercentage) }}
              />
            </div>
            <span>{formatPercent(attendancePercentage)}</span>
          </div>
        </section>

        <section className="admin-panel-card student-side-panel">
          <div className="admin-panel-header">
            <h3>Exams</h3>
          </div>
          <div className="student-exam-date-list">
            {examSlots.map((type) => {
              const exam = exams.find((item) => item.type === type);

              return (
                <article className="admin-top-card" key={type}>
                  <h4>{formatExamType(type)}</h4>
                  <span className="admin-top-chip">
                    {formatExamDate(exam?.examDate)}
                  </span>
                </article>
              );
            })}
          </div>
        </section>
      </aside>
    </div>
  );
};

export default StudentDashboardPage;
