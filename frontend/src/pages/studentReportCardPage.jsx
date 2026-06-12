import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchStudentDashboard } from "../api/analytics.api";
import { fetchAcademicYears } from "../api/academicYear.api";
import { fetchExamInstances, fetchReportCard } from "../api/examination.api";
import { fetchActiveNotices } from "../api/notice.api";
import { AuthContext } from "../context/AuthContext";
import "./adminDashboardPage.css";
import "./roleDashboard.css";

const examSlots = ["HALF_YEARLY", "END_TERM"];
const examTypeOrder = {
  HALF_YEARLY: 1,
  END_TERM: 2,
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

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "Exam Date";

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

const percentWidth = (value) =>
  `${Math.max(Math.min(typeof value === "number" ? value : 0, 100), 0)}%`;

const getSubjectPercent = (subject) =>
  subject.maxMarks > 0 && subject.marksObtained !== null
    ? Math.round((subject.marksObtained / subject.maxMarks) * 1000) / 10
    : null;

const StudentReportCardPage = () => {
  const { userId } = useContext(AuthContext);
  const [dashboard, setDashboard] = useState(null);
  const [notices, setNotices] = useState([]);
  const [academicYear, setAcademicYear] = useState(null);
  const [examInstances, setExamInstances] = useState([]);
  const [selectedExamInstanceId, setSelectedExamInstanceId] = useState("");
  const [reportCard, setReportCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadShellData = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const [years, dashboardData, activeNotices] = await Promise.all([
        fetchAcademicYears({ status: "ACTIVE" }),
        fetchStudentDashboard(userId),
        fetchActiveNotices(),
      ]);

      setAcademicYear(years[0] || null);
      setDashboard(dashboardData?.data === null ? null : dashboardData);
      setNotices(activeNotices || []);
    } catch (error) {
      console.error("Failed to load report card workspace:", error);
      setMessage("Failed to load report card data.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setMessage("Student session not available.");
      return;
    }

    loadShellData();
  }, [loadShellData, userId]);

  useEffect(() => {
    if (!academicYear) return;

    const loadExamInstances = async () => {
      try {
        const data = await fetchExamInstances(academicYear._id);
        const sorted = [...data].sort(
          (a, b) =>
            (examTypeOrder[a.type] || 99) - (examTypeOrder[b.type] || 99) ||
            formatExamType(a.type).localeCompare(formatExamType(b.type)),
        );

        setExamInstances(sorted);
        setSelectedExamInstanceId((current) => current || sorted[0]?._id || "");
        setMessage(sorted.length === 0 ? "No exam instances are available yet." : "");
      } catch (error) {
        console.error("Failed to load exam instances:", error);
        setMessage("Failed to load exams.");
      }
    };

    loadExamInstances();
  }, [academicYear]);

  useEffect(() => {
    if (!selectedExamInstanceId) {
      setReportCard(null);
      return;
    }

    const loadReportCard = async () => {
      try {
        setMessage("");
        const data = await fetchReportCard(selectedExamInstanceId);
        setReportCard(data);
      } catch (error) {
        console.error("Failed to load report card:", error);
        setReportCard(null);
        setMessage(error?.response?.data?.message || "Failed to load report card.");
      }
    };

    loadReportCard();
  }, [selectedExamInstanceId]);

  const dashboardExams = useMemo(
    () =>
      [...(Array.isArray(dashboard?.exams) ? dashboard.exams : [])].sort(
        (a, b) =>
          (examTypeOrder[a.type] || 99) - (examTypeOrder[b.type] || 99) ||
          formatExamType(a.type).localeCompare(formatExamType(b.type)),
      ),
    [dashboard],
  );
  const halfYearlyExam =
    dashboardExams.find((exam) => exam.type === "HALF_YEARLY") || null;

  if (loading) {
    return <div className="role-dashboard-empty">Loading report card...</div>;
  }

  if (message && !reportCard && examInstances.length === 0) {
    return <div className="role-dashboard-empty">{message}</div>;
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
            <h3>{formatStatNumber(dashboardExams.length, 2)}</h3>
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

        <section className="admin-panel-card student-report-card-panel">
          <div className="admin-panel-header">
            <div>
              <h3>Report Card</h3>
              <p className="admin-panel-subtitle">
                {academicYear ? `Academic year: ${academicYear.name}` : "Active academic year"}
              </p>
            </div>
            <label className="student-report-select">
              <span>Exam Type Name</span>
              <select
                value={selectedExamInstanceId}
                onChange={(event) => setSelectedExamInstanceId(event.target.value)}
              >
                <option value="">Select exam</option>
                {examInstances.map((exam) => (
                  <option key={exam._id} value={exam._id}>
                    {formatExamType(exam.type)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {message ? <div className="admin-panel-empty">{message}</div> : null}

          {!message && !reportCard ? (
            <div className="admin-panel-empty">Select an exam to view your report card.</div>
          ) : null}

          {reportCard ? (
            <div className="student-report-content">
              <div className="student-report-summary">
                <div>
                  <span>Student</span>
                  <strong>{reportCard.student.fullName}</strong>
                  <p>{reportCard.student.admissionNumber}</p>
                </div>
                <div>
                  <span>Section</span>
                  <strong>{reportCard.section.name}</strong>
                  <p>{reportCard.academicYear.name}</p>
                </div>
                <div>
                  <span>Exam</span>
                  <strong>{formatExamType(reportCard.examInstance.type)}</strong>
                  <p>{formatDate(reportCard.examInstance.examDate)}</p>
                </div>
                <div>
                  <span>Result</span>
                  <strong>{formatPercent(reportCard.percentage)}</strong>
                  <p>Total marks: {reportCard.totalMarks}</p>
                </div>
              </div>

              <div className="admin-bars student-report-bars">
                {reportCard.subjects.map((subject) => {
                  const percentage = getSubjectPercent(subject);

                  return (
                    <div className="admin-bar-row" key={subject.subjectName}>
                      <span className="admin-bar-label">{subject.subjectName}</span>
                      <div className="admin-bar-track">
                        <div
                          className={`admin-bar-fill${(percentage || 0) < 50 ? " low" : ""}`}
                          style={{ width: percentWidth(percentage) }}
                        />
                      </div>
                      <span>
                        {subject.marksObtained === null
                          ? "N/A"
                          : `${subject.marksObtained}/${subject.maxMarks}`}
                      </span>
                    </div>
                  );
                })}
              </div>
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
              const exam = examInstances.find((item) => item.type === type);

              return (
                <article className="admin-top-card" key={type}>
                  <h4>{formatExamType(type)}</h4>
                  <span className="admin-top-chip">
                    {formatDate(exam?.examDate)}
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

export default StudentReportCardPage;
