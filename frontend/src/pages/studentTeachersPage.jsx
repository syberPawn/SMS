import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchStudentDashboard } from "../api/analytics.api";
import { fetchActiveNotices } from "../api/notice.api";
import { fetchStudentMyTeachers } from "../api/teacherAssignment.api";
import { AuthContext } from "../context/AuthContext";
import "./adminDashboardPage.css";
import "./roleDashboard.css";

const examSlots = ["HALF_YEARLY", "END_TERM"];
const examTypeOrder = {
  HALF_YEARLY: 1,
  END_TERM: 2,
};

const subjectToneClasses = ["blue", "purple", "green", "red", "gold"];

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

const percentWidth = (value) =>
  `${Math.max(Math.min(typeof value === "number" ? value : 0, 100), 0)}%`;

const getTeacherName = (teacher) => teacher?.fullName || "Teacher's Name";

const StudentTeachersPage = () => {
  const { userId } = useContext(AuthContext);
  const [dashboard, setDashboard] = useState(null);
  const [teacherData, setTeacherData] = useState(null);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const [dashboardResponse, activeNotices, myTeachers] = await Promise.all([
        fetchStudentDashboard(userId),
        fetchActiveNotices(),
        fetchStudentMyTeachers(),
      ]);

      setDashboard(dashboardResponse?.data === null ? null : dashboardResponse);
      setNotices(activeNotices || []);
      setTeacherData(myTeachers);
    } catch (error) {
      console.error("Failed to load student teachers:", error);
      setDashboard(null);
      setNotices([]);
      setTeacherData(null);
      setMessage(
        error?.response?.data?.message || "Failed to load teacher data.",
      );
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

    loadTeachers();
  }, [loadTeachers, userId]);

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
    return <div className="role-dashboard-empty">Loading teachers...</div>;
  }

  if (message) {
    return <div className="role-dashboard-empty">{message}</div>;
  }

  const classTeacher = teacherData?.classTeacher || dashboard?.classTeacher;
  const subjectTeachers = teacherData?.subjectTeachers || [];

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

        <section className="admin-panel-card student-teachers-panel">
          <div className="admin-panel-header">
            <div>
              <h3>My teachers</h3>
              <p className="admin-panel-subtitle">
                {teacherData?.section
                  ? `${teacherData.section.gradeName || "Grade"} - ${
                      teacherData.section.sectionName
                    }`
                  : "Class and subject teacher assignments"}
              </p>
            </div>
          </div>

          {subjectTeachers.length === 0 && !classTeacher ? (
            <div className="admin-panel-empty">No teachers assigned yet.</div>
          ) : (
            <div className="student-teacher-list-card">
              {classTeacher ? (
                <article className="student-teacher-row gold">
                  <span>Class Teacher</span>
                  <strong>{getTeacherName(classTeacher)}</strong>
                </article>
              ) : null}

              {subjectTeachers.map((teacher, index) => (
                <article
                  className={`student-teacher-row ${
                    subjectToneClasses[index % subjectToneClasses.length]
                  }`}
                  key={`${teacher.subjectId}-${teacher.teacherId || index}`}
                >
                  <span>{teacher.subjectName}</span>
                  <strong>{getTeacherName(teacher)}</strong>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <aside className="student-admin-side">
        <article className="student-teacher-summary">
          <div className="student-teacher-thumb" />
          <div>
            <span>Class teacher</span>
            <h3>{getTeacherName(classTeacher)}</h3>
            <p>{classTeacher?.highestQualification || "Highest Qualification"}</p>
            <p>
              Assigned class teacher
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
};

export default StudentTeachersPage;
