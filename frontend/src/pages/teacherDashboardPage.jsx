import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchSectionDrilldown,
  fetchTeacherDashboard,
} from "../api/analytics.api";
import { fetchActiveNotices } from "../api/notice.api";
import { AuthContext } from "../context/AuthContext";
import "./adminDashboardPage.css";
import "./roleDashboard.css";

const formatPercent = (value) =>
  value === null || value === undefined ? "N/A" : `${value} %`;

const formatCount = (value) =>
  value === null || value === undefined ? "0" : String(value);

const averagePercent = (values) => {
  const numeric = values.filter((value) => typeof value === "number");

  if (numeric.length === 0) {
    return null;
  }

  return Math.round(
    (numeric.reduce((sum, value) => sum + value, 0) / numeric.length) * 10,
  ) / 10;
};

const percentWidth = (value) =>
  `${Math.max(Math.min(typeof value === "number" ? value : 0, 100), 0)}%`;

const formatClassLabel = (value) => {
  const label = String(value || "").trim();

  if (!label) {
    return "Class";
  }

  const className = label.replace(/^class:?\s*/i, "").trim();
  const parts = className.split(/\s+/).filter(Boolean);

  if (parts.length === 2 && /^[A-Za-z]$/.test(parts[1])) {
    return `Class ${parts[0]}${parts[1].toUpperCase()}`;
  }

  return /^class/i.test(label) ? label : `Class ${className}`;
};

const TeacherDashboardPage = () => {
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
        fetchTeacherDashboard(userId),
        fetchActiveNotices(),
      ]);
      setData(response);
      setNotices(activeNotices || []);
    } catch (error) {
      console.error("Failed to load teacher dashboard:", error);
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
      setMessage("Teacher session not available.");
      return;
    }

    loadDashboard();
  }, [loadDashboard, userId]);

  const sections = useMemo(
    () => (Array.isArray(data?.sections) ? data.sections : []),
    [data],
  );

  const dashboardSummary = useMemo(() => {
    const attendanceAverage = averagePercent(
      sections.map((section) => section.sectionAttendance),
    );
    const overallPerformanceAverage = averagePercent(
      sections.map((section) => section.sectionPerformance),
    );
    const studentCount = sections.reduce(
      (total, section) => total + (section.studentAttendance?.length || 0),
      0,
    );
    const assignmentSummary = data?.assignmentSummary || {};
    const summaryClassTeacherSection =
      assignmentSummary.classTeacherSection || null;
    const fullClassTeacherSection =
      sections.find(
        (section) =>
          section.isClassTeacher ||
          String(section.sectionId) ===
            String(summaryClassTeacherSection?.sectionId),
      ) || null;
    const classTeacherSection =
      summaryClassTeacherSection || fullClassTeacherSection;
    const assignedSectionIds = new Set();
    const assignedSubjectKeys = new Set();

    sections.forEach((section) => {
      const assignedSubjects = Array.isArray(section.assignedSubjects)
        ? section.assignedSubjects
        : [];

      if (assignedSubjects.length > 0) {
        assignedSectionIds.add(String(section.sectionId));
      }

      assignedSubjects.forEach((subject) => {
        assignedSubjectKeys.add(
          String(subject.subjectId || subject.subjectName || "").toLowerCase(),
        );
      });
    });

    return {
      classTeacherAttendance:
        classTeacherSection?.sectionAttendance ??
        fullClassTeacherSection?.sectionAttendance ??
        null,
      attendanceAverage,
      classTeacherPerformance:
        classTeacherSection?.sectionPerformance ??
        fullClassTeacherSection?.sectionPerformance ??
        null,
      myClassLabel: classTeacherSection
        ? formatClassLabel(classTeacherSection.sectionCode || classTeacherSection.sectionName)
        : "N/A",
      overallPerformanceAverage,
      studentCount,
      subjectClassCount:
        assignmentSummary.subjectClassCount ?? assignedSectionIds.size,
      subjectCount: assignmentSummary.subjectCount ?? assignedSubjectKeys.size,
    };
  }, [data?.assignmentSummary, sections]);

  if (loading) {
    return <div className="role-dashboard-empty">Loading teacher dashboard...</div>;
  }

  if (message) {
    return <div className="role-dashboard-empty">{message}</div>;
  }

  if (!data) {
    return <div className="role-dashboard-empty">No data available.</div>;
  }

  return (
    <TeacherDashboardView
      notices={notices.slice(0, 4)}
      sections={sections}
      summary={dashboardSummary}
    />
  );
};

  /*

  if (loading) return <p>Loading...</p>;
  if (!data) return <p>No data available</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Teacher Dashboard</h1>

      {data.sections.length === 0 ? (
        <p>No assigned sections</p>
      ) : (
        data.sections.map((section) => (
          <div key={section.sectionId} style={sectionStyle}>
            <h2>{section.sectionCode || section.sectionName || "Unknown"}</h2>

            <p>Attendance: {section.sectionAttendance ?? "N/A"}</p>
            <p>Performance: {section.sectionPerformance ?? "N/A"}</p>

            <h4>Student Attendance</h4>
            {section.studentAttendance.map((s, index) => (
              <p key={index}>
                {s.studentName} — {s.percentage ?? "N/A"}
              </p>
            ))}

            <h4>Subject Averages</h4>
            {section.subjectAverages.map((sub, index) => (
              <p key={index}>
                {sub.subjectName} — {sub.percentage ?? "N/A"}
              </p>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

const sectionStyle = {
  border: "1px solid #ccc",
  padding: "15px",
  marginBottom: "20px",
  borderRadius: "8px",
};

*/

const TeacherDrilldownCard = ({ emptyText, labelKey, rows, title }) => (
  <div className="admin-drilldown-card">
    <h4>{title}</h4>
    {rows?.length ? (
      <div className="admin-detail-list">
        {rows.map((item, index) => (
          <div
            className="admin-detail-row"
            key={item.enrollmentId || item.subjectId || `${title}-${index}`}
          >
            <span>{item[labelKey] || "Unknown"}</span>
            <strong>{formatPercent(item.percentage)}</strong>
          </div>
        ))}
      </div>
    ) : (
      <div className="admin-panel-empty">{emptyText}</div>
    )}
  </div>
);

const TeacherDashboardView = ({ notices, sections, summary }) => {
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
    if (!selectedSection?.sectionId) {
      setDrilldown(null);
      setDrilldownError("");
      return undefined;
    }

    let ignore = false;

    const loadDrilldown = async () => {
      setDrilldownLoading(true);
      setDrilldownError("");

      try {
        const details = await fetchSectionDrilldown(
          selectedSection.sectionId,
          undefined,
          undefined,
          undefined,
          selectedSection.subjectId,
        );

        if (!ignore) {
          setDrilldown(details);
        }
      } catch (error) {
        console.error("Failed to load teacher section drilldown:", error);

        if (!ignore) {
          setDrilldown(null);
          setDrilldownError("Failed to load section details.");
        }
      } finally {
        if (!ignore) {
          setDrilldownLoading(false);
        }
      }
    };

    loadDrilldown();

    return () => {
      ignore = true;
    };
  }, [selectedSection]);

  const subjectRows = sections.flatMap((section) => {
    const assignedSubjects = Array.isArray(section.assignedSubjects)
      ? section.assignedSubjects
      : [];
    const assignedSubjectKeys = new Set(
      assignedSubjects.map((subject) =>
        String(subject.subjectId || subject.subjectName || "").toLowerCase(),
      ),
    );
    const assignedAverages = Array.isArray(section.assignedSubjectAverages)
      ? section.assignedSubjectAverages
      : [];
    const visibleAverages = assignedAverages.length
      ? assignedAverages
      : (section.subjectAverages || []).filter((subject) =>
          assignedSubjectKeys.has(
            String(subject.subjectId || subject.subjectName || "").toLowerCase(),
          ),
        );

    return visibleAverages.map((subject) => ({
      ...subject,
      sectionCode: section.sectionCode || section.sectionName || "Class",
    }));
  });
  const bestSubject = [...subjectRows]
    .filter((subject) => typeof subject.percentage === "number")
    .sort((a, b) => b.percentage - a.percentage)[0];
  const bestClassLabel = bestSubject
    ? formatClassLabel(bestSubject.sectionCode)
    : "N/A";
  const hasClassTeacherSection = summary.myClassLabel !== "N/A";
  const classCards = sections.flatMap((section) => {
    const assignedSubjects = Array.isArray(section.assignedSubjects)
      ? section.assignedSubjects
      : [];

    return assignedSubjects.map((subject, index) => ({
      sectionId: section.sectionId,
      subjectId: subject.subjectId,
      cardId: `${section.sectionId || "section"}-${subject.subjectId || subject.subjectName || index}`,
      classLabel: formatClassLabel(section.sectionCode || section.sectionName),
      subjectName: subject.subjectName || "Subject",
    }));
  });

  return (
    <div className="teacher-dashboard-v2">
      <section className="teacher-dashboard-v2-top">
        <article className="teacher-v2-stat purple">
          <h3>{summary.myClassLabel}</h3>
          <p>My Class</p>
        </article>
        <article className="teacher-v2-stat gold">
          <h3>{formatCount(summary.subjectClassCount)}</h3>
          <p>Classes</p>
        </article>
        <article className="teacher-v2-stat purple">
          <h3>{formatCount(summary.subjectCount)}</h3>
          <p>Subjects</p>
        </article>
        <article className="teacher-v2-stat gold">
          <h3>{formatPercent(summary.classTeacherPerformance)}</h3>
          <p>Performance</p>
        </article>
        <article className="teacher-v2-best">
          <div className="teacher-v2-best-title">
            <h3>
              Best Performing Class:
              <span> {bestClassLabel}</span>
            </h3>
          </div>
          <div className="teacher-v2-best-row">
            <span>{bestSubject?.subjectName || "N/A"}</span>
            <div className="teacher-v2-long-progress">
              <i style={{ width: percentWidth(bestSubject?.percentage) }} />
            </div>
            <strong>{formatPercent(bestSubject?.percentage)}</strong>
          </div>
        </article>
      </section>

      <section className="teacher-dashboard-v2-main">
        <div className="teacher-dashboard-v2-left">
          {hasClassTeacherSection ? (
            <article className="teacher-v2-card teacher-v2-metrics-card">
              <div className="teacher-v2-meter-box">
                <h3>My Attendance</h3>
                <div className="teacher-v2-gradient-track">
                  <i style={{ width: percentWidth(summary.classTeacherAttendance) }} />
                </div>
                <span>{formatPercent(summary.classTeacherAttendance)}</span>
              </div>
              <div className="teacher-v2-meter-box">
                <h3>Performance</h3>
                <div className="teacher-v2-gradient-track">
                  <i style={{ width: percentWidth(summary.classTeacherPerformance) }} />
                </div>
                <span>{formatPercent(summary.classTeacherPerformance)}</span>
              </div>
            </article>
          ) : null}

          <article className="teacher-v2-card teacher-v2-classes-card">
            <h3>Classes for me</h3>
            {classCards.length === 0 ? (
              <div className="teacher-v2-empty compact">
                No subject classes assigned.
              </div>
            ) : (
              <div className="teacher-v2-class-grid">
                {classCards.slice(0, 6).map((card) => (
                  <button
                    className="teacher-v2-class-tile"
                    key={card.cardId}
                    type="button"
                    onClick={() =>
                      setSelectedSection({
                        sectionCode: card.classLabel,
                        sectionId: card.sectionId,
                        subjectId: card.subjectId,
                        subjectName: card.subjectName,
                      })
                    }
                  >
                    <strong>{card.classLabel}</strong>
                    <span>{card.subjectName}</span>
                  </button>
                ))}
              </div>
            )}
          </article>
        </div>

        <aside className="teacher-v2-card teacher-v2-notices-card">
          <h3>Notices</h3>
          {notices.length === 0 ? (
            <div className="teacher-v2-empty">No notices available.</div>
          ) : (
            <div className="teacher-v2-notice-scroll">
              {notices.map((notice, index) => (
                <article
                  className={`teacher-v2-notice ${
                    notice.priority === "URGENT" || index % 2 === 0
                      ? "pink"
                      : "yellow"
                  }`}
                  key={notice._id}
                >
                  <div className="teacher-v2-notice-head">
                    <strong>{notice.title}</strong>
                    <span>
                      Date:{" "}
                      {notice.createdAt
                        ? new Date(notice.createdAt).toLocaleDateString()
                        : "dd/mm/yy"}
                    </span>
                  </div>
                  <p>{notice.description}</p>
                </article>
              ))}
            </div>
          )}
        </aside>
      </section>

      {selectedSection?.sectionId ? (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onClick={() => setSelectedSection(null)}
        >
          <section
            className="admin-modal teacher-v2-drilldown-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="teacher-section-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <h3 id="teacher-section-details-title">Section Details</h3>
                <p className="admin-panel-subtitle">
                  {drilldown?.sectionCode || selectedSection.sectionCode}
                  {selectedSection.subjectName
                    ? ` - ${selectedSection.subjectName}`
                    : ""}
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
                <TeacherDrilldownCard
                  emptyText="No attendance details."
                  labelKey="studentName"
                  rows={drilldown?.studentAttendance}
                  title="Student Attendance"
                />
                <TeacherDrilldownCard
                  emptyText="No performance details."
                  labelKey="studentName"
                  rows={drilldown?.studentPerformance}
                  title={
                    selectedSection.subjectName
                      ? `${selectedSection.subjectName} Performance`
                      : "Student Performance"
                  }
                />
                <TeacherDrilldownCard
                  emptyText="No subject averages."
                  labelKey="subjectName"
                  rows={drilldown?.subjectAverages}
                  title={
                    selectedSection.subjectName
                      ? "Selected Subject Average"
                      : "Subject Averages"
                  }
                />
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default TeacherDashboardPage;
