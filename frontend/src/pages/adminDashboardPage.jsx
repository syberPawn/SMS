import { useEffect, useState } from "react";
import {
  fetchAdminOverview,
  fetchSectionDrilldown,
} from "../api/analytics.api";
import { createNotice, fetchAdminNotices } from "../api/notice.api";
import "./adminDashboardPage.css";

const formatPercent = (value) =>
  value === null || value === undefined ? "--" : `${Math.round(value)} %`;

const buildBarRows = (items) =>
  [...items]
    .filter((item) => item.percentage !== null && item.percentage !== undefined)
    .sort((a, b) => (b.percentage || 0) - (a.percentage || 0));

const AdminDashboardPage = () => {
  const today = new Date().toISOString().slice(0, 10);

  const [data, setData] = useState(null);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [attendanceWindow, setAttendanceWindow] = useState("MONTHLY");
  const [performanceExamType, setPerformanceExamType] = useState("HALF_YEARLY");
  const [noticeForm, setNoticeForm] = useState({
    title: "",
    description: "",
  });
  const [noticeFeedback, setNoticeFeedback] = useState({
    type: "",
    message: "",
  });
  const [submittingPriority, setSubmittingPriority] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);
  const [drilldown, setDrilldown] = useState(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [drilldownError, setDrilldownError] = useState("");

  useEffect(() => {
    if (!selectedSection?.sectionId) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedSection(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedSection]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setPageError("");

      try {
        const [overview, adminNotices] = await Promise.all([
          fetchAdminOverview(
            today,
            undefined,
            attendanceWindow,
            performanceExamType,
          ),
          fetchAdminNotices(),
        ]);

        setData(overview);
        setNotices(adminNotices || []);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
        setPageError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [attendanceWindow, performanceExamType, today]);

  useEffect(() => {
    if (!selectedSection?.sectionId) {
      setDrilldown(null);
      setDrilldownError("");
      return;
    }

    const loadDrilldown = async () => {
      setDrilldownLoading(true);
      setDrilldownError("");

      try {
        const details = await fetchSectionDrilldown(
          selectedSection.sectionId,
          undefined,
          undefined,
          performanceExamType,
        );

        setDrilldown(details);
      } catch (error) {
        console.error("Failed to load section drilldown:", error);
        setDrilldown(null);
        setDrilldownError("Failed to load section details.");
      } finally {
        setDrilldownLoading(false);
      }
    };

    loadDrilldown();
  }, [performanceExamType, selectedSection]);

  const handleNoticeSubmit = async (priority) => {
    const title = noticeForm.title.trim();
    const description = noticeForm.description.trim();

    if (!title || !description) {
      setNoticeFeedback({
        type: "error",
        message: "Title and description are required.",
      });
      return;
    }

    setSubmittingPriority(priority);
    setNoticeFeedback({ type: "", message: "" });

    try {
      const created = await createNotice({
        title,
        description,
        priority,
      });

      setNotices((current) => [created, ...current]);
      setNoticeForm({
        title: "",
        description: "",
      });
      setNoticeFeedback({
        type: "success",
        message:
          priority === "URGENT"
            ? "Urgent notice posted."
            : "Notice posted.",
      });
    } catch (error) {
      setNoticeFeedback({
        type: "error",
        message:
          error?.response?.data?.message || "Failed to post notice.",
      });
    } finally {
      setSubmittingPriority("");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (pageError) return <p>{pageError}</p>;
  if (!data) return <p>No data available</p>;

  const maleCount = data.genderDistribution?.male || 0;
  const femaleCount = data.genderDistribution?.female || 0;
  const otherCount = data.genderDistribution?.other || 0;
  const totalGender = maleCount + femaleCount + otherCount || 1;
  const malePercent = Math.round((maleCount / totalGender) * 1000) / 10;
  const femalePercent = Math.round((femaleCount / totalGender) * 1000) / 10;
  const presentToday = data.totalPresentStudents ?? 0;
  const absentToday = String(
    Math.max((data.totalActiveStudents || 0) - presentToday, 0),
  ).padStart(4, "0");
  const attendanceRows = buildBarRows(data.sectionAttendance || []);
  const performanceRows = buildBarRows(data.sectionPerformance || []);
  const topAttendance = data.attendanceRank?.top?.[0] || null;
  const topPerformance = data.performanceRank?.top?.[0] || null;
  const visibleNotices = notices.slice(0, 7);
  const donutStyle = {
    background: `conic-gradient(#a9b7ff 0 ${malePercent}%, #f9e39a ${malePercent}% ${malePercent + femalePercent}%, #ece5f7 ${malePercent + femalePercent}% 100%)`,
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-main">
        <div className="admin-stat-grid">
          <div className="admin-stat-card purple">
            <h3>{String(data.totalActiveStudents || 0).padStart(4, "0")}</h3>
            <p>Students</p>
          </div>
          <div className="admin-stat-card gold">
            <h3>{String(data.totalActiveTeachers || 0).padStart(3, "0")}</h3>
            <p>Teachers</p>
          </div>
          <div className="admin-stat-card purple">
            <h3>{String(presentToday).padStart(4, "0")}</h3>
            <p>Present Today</p>
          </div>
          <div className="admin-stat-card gold">
            <h3>{absentToday}</h3>
            <p>Absent</p>
          </div>
        </div>

        <div className="admin-analytics-grid">
          <section className="admin-panel-card">
            <div className="admin-panel-header">
              <h3>Students</h3>
            </div>

            <div className="admin-gender-wrap">
              <div className="admin-gender-chart" style={donutStyle} />
            </div>

            <div className="admin-gender-legend">
              <div className="admin-gender-stat">
                <span className="admin-gender-dot" style={{ background: "#9eb0ff" }} />
                <div>
                  <strong>{malePercent.toFixed(1)} %</strong>
                  <span>Boys</span>
                </div>
              </div>
              <div className="admin-gender-stat">
                <span className="admin-gender-dot" style={{ background: "#f8dc84" }} />
                <div>
                  <strong>{femalePercent.toFixed(1)} %</strong>
                  <span>Girls</span>
                </div>
              </div>
            </div>
          </section>

          <section className="admin-panel-card">
            <div className="admin-panel-header">
              <div>
                <h3>Attendance</h3>
                <p className="admin-panel-subtitle">
                  {attendanceWindow === "MONTHLY"
                    ? "Month to date"
                    : "Last 7 days"}
                </p>
              </div>
              <div className="admin-tab-row">
                <button
                  className={`admin-tab${attendanceWindow === "MONTHLY" ? " active" : ""}`}
                  type="button"
                  onClick={() => setAttendanceWindow("MONTHLY")}
                >
                  Monthly
                </button>
                <button
                  className={`admin-tab${attendanceWindow === "WEEKLY" ? " active" : ""}`}
                  type="button"
                  onClick={() => setAttendanceWindow("WEEKLY")}
                >
                  Weekly
                </button>
              </div>
            </div>

            {attendanceRows.length === 0 ? (
              <div className="admin-panel-empty">No attendance analytics available.</div>
            ) : (
              <div className="admin-bars scrollable">
                {attendanceRows.map((item) => (
                  <button
                    className="admin-bar-button"
                    key={item.sectionId}
                    type="button"
                    onClick={() => setSelectedSection(item)}
                  >
                    <div className="admin-bar-row">
                      <span className="admin-bar-label">{item.sectionCode}</span>
                      <div className="admin-bar-track">
                        <div
                          className={`admin-bar-fill${(item.percentage || 0) < 50 ? " low" : ""}`}
                          style={{
                            width: `${Math.max(Math.min(item.percentage || 0, 100), 0)}%`,
                          }}
                        />
                      </div>
                      <span>{formatPercent(item.percentage)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="admin-analytics-grid bottom">
          <section className="admin-panel-card">
            <div className="admin-panel-header">
              <div>
                <h3>Performance</h3>
                <p className="admin-panel-subtitle">
                  {performanceExamType === "HALF_YEARLY"
                    ? "Half-yearly results"
                    : "End-term results"}
                </p>
              </div>
              <div className="admin-tab-row">
                <button
                  className={`admin-tab${performanceExamType === "HALF_YEARLY" ? " active" : ""}`}
                  type="button"
                  onClick={() => setPerformanceExamType("HALF_YEARLY")}
                >
                  Half-Yearly
                </button>
                <button
                  className={`admin-tab${performanceExamType === "END_TERM" ? " active" : ""}`}
                  type="button"
                  onClick={() => setPerformanceExamType("END_TERM")}
                >
                  End-term
                </button>
              </div>
            </div>

            {performanceRows.length === 0 ? (
              <div className="admin-panel-empty">No performance analytics available.</div>
            ) : (
              <div className="admin-bars scrollable">
                {performanceRows.map((item) => (
                  <button
                    className="admin-bar-button"
                    key={item.sectionId}
                    type="button"
                    onClick={() => setSelectedSection(item)}
                  >
                    <div className="admin-bar-row">
                      <span className="admin-bar-label">{item.sectionCode}</span>
                      <div className="admin-bar-track">
                        <div
                          className={`admin-bar-fill${(item.percentage || 0) < 50 ? " low" : ""}`}
                          style={{
                            width: `${Math.max(Math.min(item.percentage || 0, 100), 0)}%`,
                          }}
                        />
                      </div>
                      <span>{formatPercent(item.percentage)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <div className="admin-top-cards">
            <button
              className="admin-top-card admin-top-card-button"
              type="button"
              onClick={() => topAttendance && setSelectedSection(topAttendance)}
              disabled={!topAttendance}
            >
              <h4>Top Attendance</h4>
              <span className="admin-top-chip">
                {topAttendance ? formatPercent(topAttendance.percentage) : "--"}
              </span>
              <div className="admin-top-class">
                {topAttendance?.sectionCode || "No Data"}
              </div>
            </button>

            <button
              className="admin-top-card admin-top-card-button"
              type="button"
              onClick={() => topPerformance && setSelectedSection(topPerformance)}
              disabled={!topPerformance}
            >
              <h4>Top Performance</h4>
              <span className="admin-top-chip">
                {topPerformance ? formatPercent(topPerformance.percentage) : "--"}
              </span>
              <div className="admin-top-class">
                {topPerformance?.sectionCode || "No Data"}
              </div>
            </button>
          </div>
        </div>

      </div>

      <aside className="admin-notices-panel">
        <h3>Notices</h3>

        {visibleNotices.length === 0 ? (
          <div className="admin-panel-empty">No notices available.</div>
        ) : (
          <div className="admin-notice-list">
            {visibleNotices.map((notice, index) => (
              <article
                className={`admin-notice-card ${
                  notice.priority === "URGENT"
                    ? "urgent"
                    : index % 3 === 0
                      ? "soft-red"
                      : "soft-yellow"
                }`}
                key={notice._id}
              >
                <div className="admin-notice-head">
                  <h4>{notice.title}</h4>
                  <span>
                    Date: {new Date(notice.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="admin-notice-meta">
                  <span className={`admin-priority-chip ${notice.priority === "URGENT" ? "urgent" : ""}`}>
                    {notice.priority === "URGENT" ? "Urgent" : "Notice"}
                  </span>
                </div>
                <p>{notice.description}</p>
              </article>
            ))}
          </div>
        )}

        <div className="admin-notice-compose">
          <input
            type="text"
            placeholder="Notice title"
            value={noticeForm.title}
            maxLength={120}
            onChange={(event) =>
              setNoticeForm((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
          />
          <textarea
            placeholder="Write your notice to post..."
            value={noticeForm.description}
            maxLength={1000}
            onChange={(event) =>
              setNoticeForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
          {noticeFeedback.message ? (
            <p className={`admin-notice-feedback ${noticeFeedback.type}`}>
              {noticeFeedback.message}
            </p>
          ) : null}
          <div className="admin-notice-actions">
            <button
              type="button"
              onClick={() => handleNoticeSubmit("NORMAL")}
              disabled={submittingPriority !== ""}
            >
              {submittingPriority === "NORMAL" ? "Posting..." : "Post"}
            </button>
            <button
              type="button"
              className="admin-urgent-button"
              onClick={() => handleNoticeSubmit("URGENT")}
              disabled={submittingPriority !== ""}
            >
              {submittingPriority === "URGENT" ? "Posting..." : "Urgent"}
            </button>
          </div>
        </div>
      </aside>

      {selectedSection?.sectionId ? (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onClick={() => setSelectedSection(null)}
        >
          <section
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-section-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <h3 id="admin-section-details-title">Section Details</h3>
                <p className="admin-panel-subtitle">
                  {selectedSection.sectionCode}
                </p>
              </div>
              <button
                className="admin-clear-button"
                type="button"
                onClick={() => setSelectedSection(null)}
              >
                Close
              </button>
            </div>

            {drilldownLoading ? (
              <div className="admin-panel-empty">Loading section details...</div>
            ) : drilldownError ? (
              <div className="admin-panel-empty">{drilldownError}</div>
            ) : (
              <div className="admin-drilldown-grid">
                <div className="admin-drilldown-card">
                  <h4>Student Attendance</h4>
                  {drilldown?.studentAttendance?.length ? (
                    <div className="admin-detail-list">
                      {drilldown.studentAttendance.map((item) => (
                        <div className="admin-detail-row" key={item.enrollmentId}>
                          <span>{item.studentName}</span>
                          <strong>{formatPercent(item.percentage)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="admin-panel-empty">No attendance details.</div>
                  )}
                </div>

                <div className="admin-drilldown-card">
                  <h4>Student Performance</h4>
                  {drilldown?.studentPerformance?.length ? (
                    <div className="admin-detail-list">
                      {drilldown.studentPerformance.map((item) => (
                        <div className="admin-detail-row" key={item.enrollmentId}>
                          <span>{item.studentName}</span>
                          <strong>{formatPercent(item.percentage)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="admin-panel-empty">No performance details.</div>
                  )}
                </div>

                <div className="admin-drilldown-card">
                  <h4>Subject Averages</h4>
                  {drilldown?.subjectAverages?.length ? (
                    <div className="admin-detail-list">
                      {drilldown.subjectAverages.map((item) => (
                        <div className="admin-detail-row" key={item.subjectId}>
                          <span>{item.subjectName}</span>
                          <strong>{formatPercent(item.percentage)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="admin-panel-empty">No subject averages.</div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default AdminDashboardPage;
