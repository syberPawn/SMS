import { useEffect, useMemo, useState } from "react";
import {
  fetchAcademicYears,
  createAcademicYear,
  activateAcademicYear,
  deactivateAcademicYear,
} from "../api/academicYear.api";
import { fetchAdminOverview } from "../api/analytics.api";
import { createGrade, fetchGradesByYear } from "../api/grade.api";
import { createSection, fetchSectionsByGrade } from "../api/section.api";
import "./academicYearsManagementPage.css";

const SECTION_OPTIONS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
const GRADE_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1));

function AcademicYearsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [years, setYears] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [structureMessage, setStructureMessage] = useState("");
  const [structureYearId, setStructureYearId] = useState("");
  const [grades, setGrades] = useState([]);
  const [sectionsMap, setSectionsMap] = useState({});
  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });
  const [structureForm, setStructureForm] = useState({
    grade: "",
  });
  const [selectedSections, setSelectedSections] = useState([]);

  const loadYears = async () => {
    try {
      const data = await fetchAcademicYears();
      setYears(data);
      if (!structureYearId) {
        const activeYear = data.find((year) => year.status === "ACTIVE");
        setStructureYearId(activeYear?._id || data[0]?._id || "");
      }
    } catch {
      console.error("Failed to load academic years");
    }
  };

  const loadStructures = async (academicYearId) => {
    if (!academicYearId) {
      setGrades([]);
      setSectionsMap({});
      return;
    }

    try {
      const gradesData = await fetchGradesByYear(academicYearId);
      const map = {};

      for (const grade of gradesData) {
        map[grade._id] = await fetchSectionsByGrade(grade._id);
      }

      setGrades(gradesData);
      setSectionsMap(map);
    } catch (error) {
      console.error("Failed to load grades and sections", error);
      setStructureMessage("Failed to load grades and sections");
    }
  };

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
        const [yearsData, overviewData] = await Promise.all([
          fetchAcademicYears(),
          fetchAdminOverview(today),
        ]);

        setYears(yearsData);
        setOverview(overviewData);
        const activeYear = yearsData.find((year) => year.status === "ACTIVE");
        setStructureYearId(activeYear?._id || yearsData[0]?._id || "");
      } catch (error) {
        console.error("Failed to load academic year workspace", error);
      } finally {
        setLoading(false);
      }
    };

    bootstrapPage();
  }, [today]);

  useEffect(() => {
    loadStructures(structureYearId);
  }, [structureYearId]);

  const handleFormChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleStructureFormChange = (field, value) => {
    setStructureForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleSection = (sectionName) => {
    setSelectedSections((current) =>
      current.includes(sectionName)
        ? current.filter((section) => section !== sectionName)
        : [...current, sectionName],
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    setSaving("create");

    try {
      await createAcademicYear({
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
      });

      setMessage("Academic year created successfully");
      setForm({
        name: "",
        startDate: "",
        endDate: "",
      });

      await loadYears();
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message);
      } else {
        setMessage("Error creating academic year");
      }
    } finally {
      setSaving("");
    }
  };

  const handleCreateStructure = async (e) => {
    e.preventDefault();
    setStructureMessage("");
    setSaving("structure");

    const gradeName = structureForm.grade.trim();
    const sectionNames = selectedSections;

    if (!structureYearId || !gradeName || sectionNames.length === 0) {
      setStructureMessage("Academic year, grade, and at least one section are required");
      setSaving("");
      return;
    }

    try {
      let grade = grades.find(
        (item) => String(item.name).toLowerCase() === gradeName.toLowerCase(),
      );

      if (!grade) {
        grade = await createGrade({
          name: gradeName,
          academicYearId: structureYearId,
        });
      }

      for (const sectionName of [...new Set(sectionNames)]) {
        await createSection({
          gradeId: grade._id,
          name: sectionName,
        });
      }

      setStructureForm({ grade: "" });
      setSelectedSections([]);
      setStructureMessage("Grade and sections created successfully");
      await loadStructures(structureYearId);
    } catch (error) {
      setStructureMessage(
        error.response?.data?.message || "Error creating grade and sections",
      );
    } finally {
      setSaving("");
    }
  };

  const handleActivate = async (id) => {
    setSaving(`activate-${id}`);
    setMessage("");
    try {
      await activateAcademicYear(id);
      await loadYears();
    } catch (error) {
      setMessage(error.response?.data?.message || "Activation failed");
    } finally {
      setSaving("");
    }
  };

  const handleDeactivate = async (id) => {
    setSaving(`deactivate-${id}`);
    setMessage("");
    try {
      await deactivateAcademicYear(id);
      await loadYears();
    } catch (error) {
      setMessage(error.response?.data?.message || "Deactivation failed");
    } finally {
      setSaving("");
    }
  };

  if (loading) {
    return <div className="academic-years-empty">Loading academic years workspace...</div>;
  }

  return (
    <div className="academic-years-dashboard">
      <section className="academic-years-stat-grid">
        {statCards.map((card) => (
          <article
            className={`academic-years-stat-card ${card.toneClass}`}
            key={card.label}
          >
            <span className="academic-years-stat-plus">+</span>
            <h3>{card.value}</h3>
            <p>{card.label}</p>
          </article>
        ))}
      </section>

      <div className="academic-years-main">
        <section className="academic-years-panel-card academic-years-list-card">
          <div className="academic-years-panel-head">
            <h3>Academic Years</h3>
          </div>

          {message ? (
            <p className="academic-years-feedback">{message}</p>
          ) : null}

          <div className="academic-years-grid">
            {years.map((year) => (
              <article className="academic-years-pill" key={year._id}>
                <div className="academic-years-pill-copy">
                  <span>{year.name}</span>
                  <small>
                    {new Date(year.startDate).toLocaleDateString()} -{" "}
                    {new Date(year.endDate).toLocaleDateString()}
                  </small>
                </div>
                {year.status === "ACTIVE" ? (
                  <button
                    type="button"
                    onClick={() => handleDeactivate(year._id)}
                    disabled={saving === `deactivate-${year._id}`}
                  >
                    {saving === `deactivate-${year._id}` ? "..." : "Deactivate"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleActivate(year._id)}
                    disabled={saving === `activate-${year._id}`}
                  >
                    {saving === `activate-${year._id}` ? "..." : "Activate"}
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>

      <aside className="academic-years-side">
        <section className="academic-years-panel-card">
          <div className="academic-years-panel-head">
            <h3>Define Academic Year</h3>
          </div>

          <form className="academic-years-form" onSubmit={handleCreate}>
            <label className="academic-years-field">
              <span>Academic Year Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                required
              />
            </label>

            <label className="academic-years-field">
              <span>Academic Year Start Date</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => handleFormChange("startDate", e.target.value)}
                required
              />
            </label>

            <label className="academic-years-field">
              <span>Academic Year End Date</span>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => handleFormChange("endDate", e.target.value)}
                required
              />
            </label>

            <div className="academic-years-actions">
              <button type="submit" disabled={saving === "create"}>
                {saving === "create" ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </section>
      </aside>

      <section className="academic-years-panel-card academic-years-structure-card">
        <div className="academic-years-panel-head">
          <div>
            <h3>Define Grades & Sections</h3>
            <p>Enter multiple sections like A, B, C for one grade.</p>
          </div>
          <select
            value={structureYearId}
            onChange={(e) => setStructureYearId(e.target.value)}
          >
            <option value="">Select Year</option>
            {years.map((year) => (
              <option key={year._id} value={year._id}>
                {year.name}
              </option>
            ))}
          </select>
        </div>

        <form className="academic-years-structure-form" onSubmit={handleCreateStructure}>
          <label className="academic-years-field">
            <span>Grade</span>
            <select
              value={structureForm.grade}
              onChange={(e) => handleStructureFormChange("grade", e.target.value)}
              required
            >
              <option value="">Select Grade</option>
              {GRADE_OPTIONS.map((grade) => (
                <option key={grade} value={grade}>
                  Class {grade}
                </option>
              ))}
            </select>
          </label>

          <label className="academic-years-field">
            <span>Section</span>
            <div className="academic-years-section-picker" role="group" aria-label="Select sections">
              {SECTION_OPTIONS.map((sectionName) => (
                <button
                  key={sectionName}
                  type="button"
                  className={selectedSections.includes(sectionName) ? "selected" : ""}
                  onClick={() => toggleSection(sectionName)}
                >
                  {sectionName}
                </button>
              ))}
            </div>
          </label>

          <div className="academic-years-actions">
            <button type="submit" disabled={saving === "structure"}>
              {saving === "structure" ? "Creating..." : "Create"}
            </button>
          </div>
        </form>

        {structureMessage ? (
          <p className="academic-years-feedback">{structureMessage}</p>
        ) : null}
      </section>

      <section className="academic-years-panel-card academic-years-classes-card">
        <div className="academic-years-panel-head">
          <h3>Existing Class & Sections</h3>
        </div>

        <div className="academic-years-class-list">
          {grades.map((grade) => {
            const sections = sectionsMap[grade._id] || [];
            const sectionNames = sections.map((section) => section.name).join(", ");

            return (
              <article className="academic-years-class-pill" key={grade._id}>
                <span>Class {grade.name}</span>
                <small>Sections - {sectionNames || "None"}</small>
              </article>
            );
          })}

          {grades.length === 0 ? (
            <div className="academic-years-empty compact">No classes found.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default AcademicYearsPage;
