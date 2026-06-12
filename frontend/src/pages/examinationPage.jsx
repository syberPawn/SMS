import { useEffect, useMemo, useState } from "react";
import { fetchAcademicYears } from "../api/academicYear.api";
import { fetchAdminOverview } from "../api/analytics.api";
import {
  createExamInstances,
  fetchExamInstances,
} from "../api/examination.api";
import "./examinationPage.css";

const examLabels = {
  HALF_YEARLY: "Half Yearly",
  END_TERM: "End Term",
};

const formatDate = (value) => {
  if (!value) return "ExamDate";
  return new Date(value).toLocaleDateString();
};

const formatStat = (value) =>
  value === null || value === undefined
    ? "0000"
    : String(value).padStart(value < 100 ? 3 : 4, "0");

const buildPerformanceRows = (items = []) =>
  [...items]
    .filter((item) => item.percentage !== null && item.percentage !== undefined)
    .sort((a, b) => a.sectionCode.localeCompare(b.sectionCode));

function ExaminationPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [halfYearlyDate, setHalfYearlyDate] = useState("");
  const [endTermDate, setEndTermDate] = useState("");
  const [examInstances, setExamInstances] = useState([]);
  const [overview, setOverview] = useState(null);
  const [performanceExamType, setPerformanceExamType] = useState("HALF_YEARLY");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadAcademicYears = async () => {
      setLoading(true);

      try {
        const data = await fetchAcademicYears();
        const years = data || [];
        const activeYear = years.find((year) => year.status === "ACTIVE");
        const initialYearId = activeYear?._id || years[0]?._id || "";

        setAcademicYears(years);
        setSelectedYear(initialYearId);
      } catch (error) {
        console.error("Failed to load academic years", error);
        setMessage({ type: "error", text: "Failed to load academic years." });
      } finally {
        setLoading(false);
      }
    };

    loadAcademicYears();
  }, []);

  useEffect(() => {
    if (!selectedYear) {
      setExamInstances([]);
      setOverview(null);
      return;
    }

    const loadExamWorkspace = async () => {
      setLoading(true);

      try {
        const [instances, analytics] = await Promise.all([
          fetchExamInstances(selectedYear),
          fetchAdminOverview(today, selectedYear, "MONTHLY", performanceExamType),
        ]);

        setExamInstances(instances || []);
        setOverview(analytics);
      } catch (error) {
        console.error("Failed to load examination workspace", error);
        setMessage({ type: "error", text: "Failed to load examination data." });
      } finally {
        setLoading(false);
      }
    };

    loadExamWorkspace();
  }, [performanceExamType, selectedYear, today]);

  const existingExamByType = useMemo(
    () =>
      examInstances.reduce((lookup, instance) => {
        lookup[instance.type] = instance;
        return lookup;
      }, {}),
    [examInstances],
  );

  const performanceRows = useMemo(
    () => buildPerformanceRows(overview?.sectionPerformance),
    [overview],
  );

  const presentToday = overview?.totalPresentStudents;
  const absentToday =
    presentToday === null || presentToday === undefined
      ? null
      : Math.max((overview?.totalActiveStudents || 0) - presentToday, 0);

  const handleCreate = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    setSaving(true);

    try {
      await createExamInstances({
        academicYearId: selectedYear,
        halfYearlyExamDate: halfYearlyDate,
        endTermExamDate: endTermDate,
      });

      const instances = await fetchExamInstances(selectedYear);
      setExamInstances(instances || []);
      setHalfYearlyDate("");
      setEndTermDate("");
      setMessage({ type: "success", text: "Exam instances created successfully." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Error creating exam instances.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading && academicYears.length === 0) {
    return <div className="exams-empty">Loading examination workspace...</div>;
  }

  return (
    <div className="exams-dashboard">
      <div className="exams-main">
        <section className="exams-stat-grid">
          <article className="exams-stat-card purple">
            <span className="exams-stat-plus">+</span>
            <h3>{formatStat(overview?.totalActiveStudents)}</h3>
            <p>Students</p>
          </article>
          <article className="exams-stat-card gold highlighted">
            <span className="exams-stat-plus">+</span>
            <h3>{formatStat(overview?.totalActiveTeachers)}</h3>
            <p>Teachers</p>
          </article>
          <article className="exams-stat-card purple">
            <h3>{formatStat(presentToday)}</h3>
            <p>Present Today</p>
          </article>
          <article className="exams-stat-card gold">
            <h3>{formatStat(absentToday)}</h3>
            <p>Absent</p>
          </article>
        </section>

        <section className="exams-panel-card">
          <div className="exams-panel-head">
            <div>
              <h3>Exam Instance</h3>
              <p>Create the two supported exam windows for an academic year.</p>
            </div>
            <label className="exams-year-chip">
              Academic Year
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                required
              >
                <option value="">Select Academic Year</option>
                {academicYears.map((year) => (
                  <option key={year._id} value={year._id}>
                    {year.name} ({year.status})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <form className="exams-form" onSubmit={handleCreate}>
            <label className="exams-pill-field">
              <span>Half Yearly</span>
              <input
                type="date"
                value={halfYearlyDate}
                onChange={(event) => setHalfYearlyDate(event.target.value)}
                required
              />
            </label>
            <label className="exams-pill-field">
              <span>End Term</span>
              <input
                type="date"
                value={endTermDate}
                onChange={(event) => setEndTermDate(event.target.value)}
                required
              />
            </label>
            <div className="exams-actions">
              <button type="submit" disabled={saving || !selectedYear}>
                {saving ? "Creating..." : "Create"}
                <span>+</span>
              </button>
            </div>
          </form>

          {message.text && (
            <p className={`exams-feedback ${message.type}`}>{message.text}</p>
          )}
        </section>

        <section className="exams-panel-card exams-performance-card">
          <div className="exams-panel-head">
            <div>
              <h3>Performance</h3>
              <p>Section-wise averages from submitted marks.</p>
            </div>
            <div className="exams-tabs">
              {["HALF_YEARLY", "END_TERM"].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={performanceExamType === type ? "active" : ""}
                  onClick={() => setPerformanceExamType(type)}
                >
                  {examLabels[type]}
                </button>
              ))}
            </div>
          </div>

          {performanceRows.length === 0 ? (
            <div className="exams-empty compact">
              No performance data available for this exam.
            </div>
          ) : (
            <div className="exams-bars">
              {performanceRows.map((row) => (
                <div className="exams-bar-row" key={row.sectionId}>
                  <span>{row.sectionCode}</span>
                  <div className="exams-bar-track">
                    <div
                      className={`exams-bar-fill ${row.percentage < 50 ? "low" : ""}`}
                      style={{ width: `${Math.min(row.percentage, 100)}%` }}
                    />
                  </div>
                  <strong>{Math.round(row.percentage)}%</strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <aside className="exams-side">
        <section className="exams-panel-card exams-list-card">
          <div className="exams-panel-head">
            <div>
              <h3>Exams</h3>
              <p>Dates configured for the selected academic year.</p>
            </div>
          </div>

          {["HALF_YEARLY", "END_TERM"].map((type) => (
            <article className="exams-instance-card" key={type}>
              <h4>{examLabels[type]}</h4>
              <span>{formatDate(existingExamByType[type]?.examDate)}</span>
            </article>
          ))}
        </section>
      </aside>
    </div>
  );
}

export default ExaminationPage;
