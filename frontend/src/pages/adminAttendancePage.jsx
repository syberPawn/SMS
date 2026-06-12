import { useEffect, useMemo, useState } from "react";
import { fetchAcademicYears } from "../api/academicYear.api";
import { fetchAdminOverview } from "../api/analytics.api";
import {
  fetchSectionAttendance,
  fetchSectionAttendancePercentage,
} from "../api/attendance.api";
import { fetchGradesByYear } from "../api/grade.api";
import { fetchSectionsByGrade } from "../api/section.api";
import "./adminAttendancePage.css";

const formatDateInput = (date) => date.toISOString().slice(0, 10);

const formatSectionLabel = (section) =>
  `${section.gradeName || "Class"} ${section.name || ""}`.trim();

const sortSections = (sections) =>
  [...sections].sort((left, right) =>
    formatSectionLabel(left).localeCompare(formatSectionLabel(right), undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

const resolveStudentName = (entry) =>
  entry.enrollmentId?.studentId?.fullName ||
  entry.enrollmentId?.fullName ||
  "Unknown Student";

const normalizeAttendanceRows = (entries) =>
  entries.map((entry) => ({
    id: entry._id,
    studentName: resolveStudentName(entry),
    status: entry.status,
    date: entry.date,
  }));

const AdminAttendancePage = () => {
  const today = formatDateInput(new Date());

  const [academicYearId, setAcademicYearId] = useState("");
  const [grades, setGrades] = useState([]);
  const [gradeId, setGradeId] = useState("");
  const [sections, setSections] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [sectionId, setSectionId] = useState("");
  const [overview, setOverview] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [todaySectionPercentage, setTodaySectionPercentage] = useState(null);
  const [sectionPercentages, setSectionPercentages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [modalSection, setModalSection] = useState(null);
  const [modalMode, setModalMode] = useState("today");
  const [modalRows, setModalRows] = useState([]);
  const [modalFilters, setModalFilters] = useState({
    startDate: today,
    endDate: today,
  });

  const statCards = useMemo(() => {
    const totalStudents = overview?.totalActiveStudents || 0;
    const totalTeachers = overview?.totalActiveTeachers || 0;
    const presentToday = overview?.totalPresentStudents ?? 0;
    const absentToday = Math.max(totalStudents - presentToday, 0);

    return [
      {
        label: "Students",
        value: String(totalStudents).padStart(4, "0"),
        toneClass: "purple",
      },
      {
        label: "Teachers",
        value: String(totalTeachers).padStart(3, "0"),
        toneClass: "gold",
      },
      {
        label: "Present Today",
        value: String(presentToday).padStart(4, "0"),
        toneClass: "purple",
      },
      {
        label: "Absent",
        value: String(absentToday).padStart(4, "0"),
        toneClass: "gold",
      },
    ];
  }, [overview]);

  useEffect(() => {
    const bootstrapPage = async () => {
      setLoading(true);

      try {
        const years = await fetchAcademicYears({ status: "ACTIVE" });
        const activeYear = years[0] || null;

        if (!activeYear?._id) {
          setFeedback({
            type: "error",
            message: "No active academic year found. Activate one to view attendance.",
          });
          return;
        }

        setAcademicYearId(activeYear._id);
        const overviewData = await fetchAdminOverview(today, activeYear._id);
        setOverview(overviewData);
      } catch (error) {
        console.error("Failed to bootstrap attendance workspace", error);
        setFeedback({
          type: "error",
          message: "Failed to load the attendance workspace.",
        });
      } finally {
        setLoading(false);
      }
    };

    bootstrapPage();
  }, [today]);

  useEffect(() => {
    if (!academicYearId) {
      setGrades([]);
      setGradeId("");
      setSections([]);
      setSectionId("");
      setAllSections([]);
      return;
    }

    const loadYearData = async () => {
      try {
        const gradeData = await fetchGradesByYear(academicYearId);
        const activeGrades = gradeData.filter((grade) => grade.status === "ACTIVE");
        setGrades(activeGrades);

        const sectionGroups = await Promise.all(
          activeGrades.map(async (grade) => {
            const sectionData = await fetchSectionsByGrade(grade._id);
            return sectionData
              .filter((section) => section.status === "ACTIVE")
              .map((section) => ({
                ...section,
                gradeName: grade.name,
              }));
          }),
        );

        const mergedSections = sortSections(sectionGroups.flat());
        setAllSections(mergedSections);

        if (!activeGrades.some((grade) => grade._id === gradeId)) {
          const nextGradeId = activeGrades[0]?._id || "";
          setGradeId(nextGradeId);

          const nextSections = mergedSections.filter(
            (section) => section.gradeId === nextGradeId,
          );
          setSections(nextSections);
          setSectionId(nextSections[0]?._id || "");
        }
      } catch (error) {
        console.error("Failed to load attendance year data", error);
      }
    };

    loadYearData();
  }, [academicYearId]);

  useEffect(() => {
    if (!gradeId) {
      setSections([]);
      setSectionId("");
      return;
    }

    const filteredSections = sortSections(
      allSections.filter(
      (section) => section.gradeId === gradeId,
      ),
    );

    setSections(filteredSections);

    if (!filteredSections.some((section) => section._id === sectionId)) {
      setSectionId(filteredSections[0]?._id || "");
    }
  }, [allSections, gradeId]);

  useEffect(() => {
    if (!academicYearId || !allSections.length) {
      setSectionPercentages([]);
      return;
    }

    const loadSectionPercentages = async () => {
      try {
        const results = await Promise.all(
          allSections.map(async (section) => {
            try {
              const percentage = await fetchSectionAttendancePercentage(
                section._id,
                academicYearId,
              );

              return {
                ...section,
                percentage,
              };
            } catch (error) {
              return {
                ...section,
                percentage: null,
              };
            }
          }),
        );

        setSectionPercentages(results);
      } catch (error) {
        console.error("Failed to load section percentages", error);
        setSectionPercentages([]);
      }
    };

    loadSectionPercentages();
  }, [academicYearId, allSections]);

  useEffect(() => {
    if (!academicYearId || !sectionId) {
      setTodayAttendance([]);
      setTodaySectionPercentage(null);
      return;
    }

    const loadTodayAttendance = async () => {
      try {
        const [attendanceData, percentageData] = await Promise.all([
          fetchSectionAttendance(academicYearId, sectionId, today, today),
          fetchSectionAttendancePercentage(sectionId, academicYearId),
        ]);

        setTodayAttendance(normalizeAttendanceRows(attendanceData));
        setTodaySectionPercentage(percentageData);
      } catch (error) {
        console.error("Failed to load today attendance", error);
        setTodayAttendance([]);
        setTodaySectionPercentage(null);
      }
    };

    loadTodayAttendance();
  }, [academicYearId, sectionId, today]);

  const openSectionModal = async (section, mode = "today") => {
    if (!academicYearId || !section?._id) {
      return;
    }

    setModalSection(section);
    setModalMode(mode);
    setModalFilters({
      startDate: today,
      endDate: today,
    });
    setModalRows([]);
    setModalLoading(true);

    try {
      const attendanceData = await fetchSectionAttendance(
        academicYearId,
        section._id,
        today,
        today,
      );
      setModalRows(normalizeAttendanceRows(attendanceData));
    } catch (error) {
      console.error("Failed to load modal attendance", error);
      setModalRows([]);
    } finally {
      setModalLoading(false);
    }
  };

  const loadModalAllRecords = async () => {
    if (!academicYearId || !modalSection?._id) {
      return;
    }

    setModalMode("all");
    setModalLoading(true);

    try {
      const attendanceData = await fetchSectionAttendance(
        academicYearId,
        modalSection._id,
        modalFilters.startDate,
        modalFilters.endDate,
      );
      setModalRows(normalizeAttendanceRows(attendanceData));
    } catch (error) {
      console.error("Failed to load filtered attendance", error);
      setModalRows([]);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return <div className="attendance-empty">Loading attendance workspace...</div>;
  }

  return (
    <div className="attendance-dashboard">
      <div className="attendance-main">
        <section className="attendance-stat-grid">
          {statCards.map((card) => (
            <article className={`attendance-stat-card ${card.toneClass}`} key={card.label}>
              <span className="attendance-stat-plus">+</span>
              <h3>{card.value}</h3>
              <p>{card.label}</p>
            </article>
          ))}
        </section>

        <section className="attendance-panel-card">
          <div className="attendance-panel-head">
            <h3>Today's Attendance</h3>
            <div className="attendance-filter-pills">
              <label>
                <span>Class</span>
                <select
                  value={gradeId}
                  onChange={(event) => {
                    setGradeId(event.target.value);
                    setSectionId("");
                  }}
                  disabled={!academicYearId}
                >
                  <option value="">Choose class</option>
                  {grades.map((grade) => (
                    <option key={grade._id} value={grade._id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Section</span>
                <select
                  value={sectionId}
                  onChange={(event) => setSectionId(event.target.value)}
                  disabled={!gradeId}
                >
                  <option value="">Choose section</option>
                  {sections.map((section) => (
                    <option key={section._id} value={section._id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {feedback.message ? (
            <p className={`attendance-feedback ${feedback.type}`}>{feedback.message}</p>
          ) : null}

          <div className="attendance-table-shell">
            <div className="attendance-table-head">
              <span>Name</span>
              <span>Attendance Status</span>
            </div>

            <div className="attendance-table-scroll">
              {todayAttendance.map((entry) => (
                <article className="attendance-table-row" key={entry.id}>
                  <span>{entry.studentName}</span>
                  <div className="attendance-status-pills">
                    <span
                      className={`attendance-status-pill ${
                        entry.status === "PRESENT" ? "present" : "muted"
                      }`}
                    >
                      Present
                    </span>
                    <span
                      className={`attendance-status-pill ${
                        entry.status === "ABSENT" ? "absent" : "muted"
                      }`}
                    >
                      Absent
                    </span>
                  </div>
                </article>
              ))}

              {todayAttendance.length === 0 ? (
                <div className="attendance-empty compact">
                  No attendance records found for today.
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <aside className="attendance-side">
        <section className="attendance-side-card">
          <div className="attendance-side-head">
            <h3>Attendance</h3>
            <div className="attendance-side-tabs">
              <button type="button" className="active">
                Monthly
              </button>
              <button type="button" disabled>
                Weekly
              </button>
            </div>
          </div>

          <div className="attendance-percent-scroll">
            {sectionPercentages.map((section) => {
              const percentageValue = section.percentage ?? 0;

              return (
                <button
                  className="attendance-percent-row"
                  key={section._id}
                  type="button"
                  onClick={() => openSectionModal(section)}
                >
                  <span className="attendance-percent-label">
                    {formatSectionLabel(section)}
                  </span>
                  <span className="attendance-percent-track">
                    <span
                      className={`attendance-percent-fill ${
                        percentageValue < 50 ? "low" : ""
                      }`}
                      style={{ width: `${percentageValue}%` }}
                    />
                  </span>
                  <span className="attendance-percent-value">
                    {section.percentage === null
                      ? "N/A"
                      : `${Math.round(percentageValue)} %`}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="attendance-side-card">
          <div className="attendance-side-head">
            <h3>Attendance History</h3>
          </div>

          <div className="attendance-history-scroll">
            {allSections.map((section) => (
              <button
                className="attendance-history-pill"
                key={section._id}
                type="button"
                onClick={() => openSectionModal(section)}
              >
                Class : {formatSectionLabel(section)}
              </button>
            ))}
          </div>
        </section>
      </aside>

      {modalSection ? (
        <div className="attendance-modal-backdrop" onClick={() => setModalSection(null)}>
          <div className="attendance-modal" onClick={(event) => event.stopPropagation()}>
            <div className="attendance-modal-head">
              <div>
                <h3>{formatSectionLabel(modalSection)}</h3>
                <p>
                  {modalMode === "today"
                    ? `Showing today's attendance for ${formatSectionLabel(modalSection)}.`
                    : "Showing attendance records for the selected date range."}
                </p>
              </div>

              <button
                className="attendance-modal-close"
                type="button"
                onClick={() => setModalSection(null)}
              >
                Close
              </button>
            </div>

            <div className="attendance-modal-actions">
              <button
                className={modalMode === "today" ? "active" : ""}
                type="button"
                onClick={() => openSectionModal(modalSection, "today")}
              >
                Today
              </button>
              <button
                className={modalMode === "all" ? "active" : ""}
                type="button"
                onClick={loadModalAllRecords}
              >
                View All Records
              </button>
            </div>

            <div className="attendance-modal-filters">
              <label>
                <span>Start Date</span>
                <input
                  type="date"
                  value={modalFilters.startDate}
                  onChange={(event) =>
                    setModalFilters((current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>End Date</span>
                <input
                  type="date"
                  value={modalFilters.endDate}
                  onChange={(event) =>
                    setModalFilters((current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                />
              </label>
              <button type="button" onClick={loadModalAllRecords}>
                Apply Filter
              </button>
            </div>

            <div className="attendance-modal-table">
              <div className="attendance-modal-table-head">
                <span>Date</span>
                <span>Student</span>
                <span>Status</span>
              </div>

              <div className="attendance-modal-scroll">
                {modalLoading ? (
                  <div className="attendance-empty compact">Loading attendance records...</div>
                ) : modalRows.length === 0 ? (
                  <div className="attendance-empty compact">No attendance records found.</div>
                ) : (
                  modalRows.map((entry) => (
                    <article className="attendance-modal-row" key={entry.id}>
                      <span>{new Date(entry.date).toLocaleDateString()}</span>
                      <span>{entry.studentName}</span>
                      <span
                        className={`attendance-modal-status ${
                          entry.status === "PRESENT" ? "present" : "absent"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminAttendancePage;
