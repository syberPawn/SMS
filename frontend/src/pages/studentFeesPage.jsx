import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchStudentDashboard } from "../api/analytics.api";
import { fetchStudentFeeStatus } from "../api/fee.api";
import { fetchActiveNotices } from "../api/notice.api";
import { AuthContext } from "../context/AuthContext";
import "./adminDashboardPage.css";
import "./roleDashboard.css";

const examSlots = ["HALF_YEARLY", "END_TERM"];
const examTypeOrder = {
  HALF_YEARLY: 1,
  END_TERM: 2,
};
const feeToneClasses = ["blue", "purple", "green", "red", "gold"];

const formatPercent = (value) =>
  value === null || value === undefined ? "N/A" : `${Math.round(value)} %`;

const formatStatNumber = (value, size = 3) => {
  if (value === null || value === undefined) {
    return "0".repeat(size);
  }

  return String(Math.round(value)).padStart(size, "0");
};

const formatChange = (value) => {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return `${value > 0 ? "+" : ""}${Math.round(value)} %`;
};

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

const formatExamDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "Exam Date";

const formatFeeMonth = (value) => {
  if (!value) {
    return "Month";
  }

  const [year, month] = value.split("-").map(Number);

  if (!year || !month) {
    return value;
  }

  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
};

const percentWidth = (value) =>
  `${Math.max(Math.min(typeof value === "number" ? value : 0, 100), 0)}%`;

function StudentFeesPage() {
  const { authLoading, userId } = useContext(AuthContext);
  const [dashboard, setDashboard] = useState(null);
  const [fees, setFees] = useState([]);
  const [notices, setNotices] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadFees = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const [dashboardResponse, feeStatus, activeNotices] = await Promise.all([
        fetchStudentDashboard(userId),
        fetchStudentFeeStatus(),
        fetchActiveNotices(),
      ]);

      setDashboard(dashboardResponse?.data === null ? null : dashboardResponse);
      setFees(feeStatus || []);
      setNotices(activeNotices || []);
      setMessage(feeStatus.length === 0 ? "No fee records available." : "");
    } catch (error) {
      console.error("Failed to load fee status:", error);
      setDashboard(null);
      setFees([]);
      setNotices([]);
      setMessage(error?.response?.data?.message || "Error loading fee status.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!authLoading && userId) {
      loadFees();
    }
  }, [authLoading, loadFees, userId]);

  const exams = useMemo(
    () =>
      [...(Array.isArray(dashboard?.exams) ? dashboard.exams : [])].sort(
        (a, b) =>
          (examTypeOrder[a.type] || 99) - (examTypeOrder[b.type] || 99) ||
          formatExamType(a.type).localeCompare(formatExamType(b.type)),
      ),
    [dashboard],
  );
  const halfYearlyExam = exams.find((exam) => exam.type === "HALF_YEARLY") || null;

  if (loading) {
    return <div className="role-dashboard-empty">Loading fees...</div>;
  }

  return (
    <div className="admin-dashboard student-admin-dashboard">
      <div className="admin-dashboard-main">
        <div className="admin-stat-grid">
          <article className="admin-stat-card purple">
            <h3>{formatStatNumber(dashboard?.attendancePercentage)}</h3>
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
            <h3>{formatChange(dashboard?.comparison)}</h3>
            <p>Delta</p>
          </article>
        </div>

        <section className="admin-panel-card student-fees-panel">
          <div className="admin-panel-header">
            <div>
              <h3>My fees</h3>
              <p className="admin-panel-subtitle">
                Monthly payment status for the active academic year.
              </p>
            </div>
          </div>

          {message ? <div className="admin-panel-empty">{message}</div> : null}

          {!message && fees.length > 0 ? (
            <div className="student-fee-list-card">
              {fees.map((fee, index) => (
                <article
                  className={`student-fee-row ${
                    feeToneClasses[index % feeToneClasses.length]
                  }`}
                  key={fee.month}
                >
                  <span>{formatFeeMonth(fee.month)}</span>
                  <strong>{fee.status}</strong>
                  <small>{fee.amount}</small>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      <aside className="student-admin-side">
        <article className="student-teacher-summary">
          <div className="student-teacher-thumb" />
          <div>
            <span>Class teacher</span>
            <h3>{dashboard?.classTeacher?.fullName || "Teacher's Name"}</h3>
            <p>
              {dashboard?.classTeacher?.highestQualification ||
                "Highest Qualification"}
            </p>
            <p>Assigned class or subject teacher</p>
          </div>
        </article>

        <section className="admin-notices-panel student-notices-panel">
          <h3>Notices</h3>
          {notices.length === 0 ? (
            <div className="admin-panel-empty">No notices available.</div>
          ) : (
            <div className="admin-notice-list">
              {notices.slice(0, 4).map((notice, index) => (
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
            <span className="admin-bar-label">
              {dashboard?.student?.fullName || "Student"}
            </span>
            <div className="admin-bar-track">
              <div
                className={`admin-bar-fill${
                  (dashboard?.attendancePercentage || 0) < 50 ? " low" : ""
                }`}
                style={{ width: percentWidth(dashboard?.attendancePercentage) }}
              />
            </div>
            <span>{formatPercent(dashboard?.attendancePercentage)}</span>
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
}

export default StudentFeesPage;
