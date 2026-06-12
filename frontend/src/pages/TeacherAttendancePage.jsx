import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchAcademicYears } from "../api/academicYear.api";
import {
  fetchSectionAttendance,
  fetchSectionAttendancePercentage,
  recordAttendance,
} from "../api/attendance.api";
import { fetchTeacherDashboard } from "../api/analytics.api";
import { fetchStudentsByEnrollment } from "../api/enrollment.api";
import { AuthContext } from "../context/AuthContext";
import "./adminDashboardPage.css";
import "./roleDashboard.css";

const today = new Date().toISOString().slice(0, 10);

const formatPercent = (value) =>
  value === null || value === undefined ? "N/A" : `${Math.round(value * 10) / 10} %`;

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "N/A";

const formatClassLabel = (value) => {
  const label = String(value || "").trim();

  if (!label) return "N/A";

  const className = label.replace(/^class:?\s*/i, "").trim();
  const parts = className.split(/\s+/).filter(Boolean);

  if (parts.length === 2 && /^[A-Za-z]$/.test(parts[1])) {
    return `Class ${parts[0]}${parts[1].toUpperCase()}`;
  }

  return /^class/i.test(label) ? label : `Class ${className}`;
};

const TeacherAttendancePage = () => {
  const { userId } = useContext(AuthContext);
  const [academicYear, setAcademicYear] = useState(null);
  const [classSection, setClassSection] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [attendanceDate, setAttendanceDate] = useState(today);
  const [percentage, setPercentage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  const loadAttendanceDetails = useCallback(
    async (yearId, sectionId) => {
      const [enrollments, records, sectionPercentage] = await Promise.all([
        fetchStudentsByEnrollment({
          academicYearId: yearId,
          sectionId,
          enrollmentStatus: "ACTIVE",
        }),
        fetchSectionAttendance(yearId, sectionId),
        fetchSectionAttendancePercentage(sectionId, yearId),
      ]);

      const initialAttendance = {};

      enrollments.forEach((enrollment) => {
        initialAttendance[enrollment.enrollmentId] = "PRESENT";
      });

      setStudents(enrollments);
      setAttendance(records);
      setPercentage(sectionPercentage);
      setAttendanceMap(initialAttendance);
    },
    [],
  );

  const loadPage = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setMessage("Teacher session not available.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const years = await fetchAcademicYears({ status: "ACTIVE" });
      const activeYear = years[0] || null;

      setAcademicYear(activeYear);

      if (!activeYear?._id) {
        setClassSection(null);
        setMessage("No active academic year found.");
        return;
      }

      const dashboard = await fetchTeacherDashboard(userId, activeYear._id);
      const teacherSection = dashboard?.assignmentSummary?.classTeacherSection;

      if (!teacherSection?.sectionId) {
        setClassSection(null);
        setStudents([]);
        setAttendance([]);
        setPercentage(null);
        setMessage("Attendance is available only for assigned class teachers.");
        return;
      }

      setClassSection(teacherSection);
      await loadAttendanceDetails(activeYear._id, teacherSection.sectionId);
    } catch (error) {
      console.error("Failed to load teacher attendance:", error);
      setMessage("Failed to load attendance data.");
    } finally {
      setLoading(false);
    }
  }, [loadAttendanceDetails, userId]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  useEffect(() => {
    if (!selectedRecord) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedRecord(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedRecord]);

  const attendanceSummary = useMemo(() => {
    const present = Object.values(attendanceMap).filter(
      (status) => status === "PRESENT",
    ).length;
    const absent = Object.values(attendanceMap).filter(
      (status) => status === "ABSENT",
    ).length;

    return {
      absent,
      present,
      total: students.length,
    };
  }, [attendanceMap, students.length]);

  const recentAttendance = useMemo(() => {
    const grouped = attendance.reduce((acc, entry) => {
      const dateKey = new Date(entry.date).toISOString().slice(0, 10);

      if (!acc[dateKey]) {
        acc[dateKey] = {
          absent: 0,
          date: entry.date,
          entries: [],
          present: 0,
          total: 0,
        };
      }

      acc[dateKey].entries.push(entry);
      acc[dateKey].total += 1;

      if (entry.status === "PRESENT") {
        acc[dateKey].present += 1;
      } else {
        acc[dateKey].absent += 1;
      }

      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [attendance]);

  const handleStatusChange = (enrollmentId, status) => {
    setAttendanceMap((current) => ({
      ...current,
      [enrollmentId]: status,
    }));
  };

  const handleSubmitAttendance = async () => {
    if (!academicYear?._id || !classSection?.sectionId || students.length === 0) {
      return;
    }

    if (!attendanceDate) {
      setMessage("Please select attendance date.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      await recordAttendance({
        academicYearId: academicYear._id,
        attendanceDate,
        sectionId: classSection.sectionId,
        studentAttendanceList: students.map((enrollment) => ({
          enrollmentId: enrollment.enrollmentId,
          status: attendanceMap[enrollment.enrollmentId] || "PRESENT",
        })),
      });

      await loadAttendanceDetails(academicYear._id, classSection.sectionId);
      setMessage("Attendance recorded successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Attendance submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="role-dashboard-empty">Loading attendance...</div>;
  }

  if (!classSection) {
    return <div className="role-dashboard-empty">{message || "No class assigned."}</div>;
  }

  return (
    <div className="teacher-attendance-screen">
      <section className="teacher-attendance-stats">
        <article className="teacher-v2-stat purple">
          <h3>{formatClassLabel(classSection.sectionCode)}</h3>
          <p>My Class</p>
        </article>
        <article className="teacher-v2-stat gold">
          <h3>{String(students.length).padStart(2, "0")}</h3>
          <p>Students</p>
        </article>
        <article className="teacher-v2-stat purple">
          <h3>{formatPercent(percentage)}</h3>
          <p>Attendance</p>
        </article>
        <article className="teacher-v2-stat gold">
          <h3>{formatDate(attendanceDate)}</h3>
          <p>Selected Date</p>
        </article>
      </section>

      <section className="teacher-attendance-grid">
        <article className="teacher-v2-card teacher-attendance-card">
          <div className="teacher-attendance-head">
            <div>
              <h3>Attendance</h3>
              <p>Mark today&apos;s class attendance.</p>
            </div>
            <label className="teacher-attendance-date">
              <span>Date</span>
              <input
                type="date"
                value={attendanceDate}
                onChange={(event) => setAttendanceDate(event.target.value)}
              />
            </label>
          </div>

          {students.length === 0 ? (
            <div className="teacher-v2-empty compact">No active students found.</div>
          ) : (
            <div className="teacher-attendance-list">
              {students.map((enrollment) => (
                <div className="teacher-attendance-row" key={enrollment.enrollmentId}>
                  <strong>{enrollment.fullName}</strong>
                  <div className="teacher-attendance-toggle" role="group">
                    <button
                      className={
                        attendanceMap[enrollment.enrollmentId] === "PRESENT"
                          ? "active"
                          : ""
                      }
                      type="button"
                      onClick={() =>
                        handleStatusChange(enrollment.enrollmentId, "PRESENT")
                      }
                    >
                      Present
                    </button>
                    <button
                      className={
                        attendanceMap[enrollment.enrollmentId] === "ABSENT"
                          ? "active absent"
                          : ""
                      }
                      type="button"
                      onClick={() =>
                        handleStatusChange(enrollment.enrollmentId, "ABSENT")
                      }
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {message ? <p className="teacher-attendance-message">{message}</p> : null}

          <button
            className="teacher-attendance-submit"
            disabled={submitting || students.length === 0}
            type="button"
            onClick={handleSubmitAttendance}
          >
            {submitting ? "Submitting..." : "Submit Attendance"}
          </button>
        </article>

        <aside className="teacher-attendance-side">
          <article className="teacher-v2-card teacher-attendance-summary">
            <h3>Today</h3>
            <div className="teacher-attendance-counts">
              <div>
                <strong>{attendanceSummary.present}</strong>
                <span>Present</span>
              </div>
              <div>
                <strong>{attendanceSummary.absent}</strong>
                <span>Absent</span>
              </div>
              <div>
                <strong>{attendanceSummary.total}</strong>
                <span>Total</span>
              </div>
            </div>
          </article>

          <article className="teacher-v2-card teacher-attendance-history">
            <h3>Recent Records</h3>
            {recentAttendance.length === 0 ? (
              <div className="teacher-v2-empty compact">No attendance recorded.</div>
            ) : (
              <div className="teacher-attendance-history-list">
                {recentAttendance.map((record) => (
                  <button
                    className="teacher-attendance-history-row"
                    key={record.date}
                    type="button"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <strong>{formatDate(record.date)}</strong>
                    <span>{record.present}/{record.total} present</span>
                  </button>
                ))}
              </div>
            )}
          </article>
        </aside>
      </section>

      {selectedRecord ? (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onClick={() => setSelectedRecord(null)}
        >
          <section
            className="admin-modal teacher-attendance-record-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="teacher-attendance-record-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <h3 id="teacher-attendance-record-title">Attendance Record</h3>
                <p className="admin-panel-subtitle">
                  {formatClassLabel(classSection.sectionCode)} -{" "}
                  {formatDate(selectedRecord.date)}
                </p>
              </div>
              <button
                className="admin-clear-button"
                type="button"
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </button>
            </div>

            <div className="teacher-attendance-record-grid">
              <div className="admin-drilldown-card">
                <h4>Students</h4>
                {selectedRecord.entries.length === 0 ? (
                  <div className="admin-panel-empty">No records for this date.</div>
                ) : (
                  <div className="admin-detail-list">
                    {selectedRecord.entries.map((entry) => (
                      <div className="admin-detail-row" key={entry._id}>
                        <span>
                          {entry.enrollmentId?.studentId?.fullName || "Unknown"}
                        </span>
                        <strong>{entry.status}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-drilldown-card">
                <h4>Summary</h4>
                <div className="teacher-attendance-counts">
                  <div>
                    <strong>{selectedRecord.present}</strong>
                    <span>Present</span>
                  </div>
                  <div>
                    <strong>{selectedRecord.absent}</strong>
                    <span>Absent</span>
                  </div>
                  <div>
                    <strong>{selectedRecord.total}</strong>
                    <span>Total</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default TeacherAttendancePage;
