import { useEffect, useMemo, useState } from "react";
import { fetchAcademicYears } from "../api/academicYear.api";
import { fetchAdminOverview } from "../api/analytics.api";
import { fetchGradesByYear } from "../api/grade.api";
import {
  fetchMappingsByGrade,
  mapSubjectToGrade,
  unmapSubjectFromGrade,
} from "../api/gradeSubjectMapping.api";
import {
  activateSubject,
  createSubject,
  deactivateSubject,
  fetchSubjects,
} from "../api/subject.api";
import "./subjectsManagementPage.css";

function SubjectsPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [academicYearId, setAcademicYearId] = useState("");
  const [grades, setGrades] = useState([]);
  const [gradeId, setGradeId] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [overview, setOverview] = useState(null);
  const [subjectName, setSubjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const activeSubjects = useMemo(
    () => subjects.filter((subject) => subject.status === "ACTIVE"),
    [subjects],
  );

  const activeMappings = useMemo(
    () => mappings.filter((mapping) => mapping.status === "ACTIVE"),
    [mappings],
  );

  const mappedSubjectIds = useMemo(
    () => new Set(activeMappings.map((mapping) => mapping.subjectId)),
    [activeMappings],
  );

  const unmappedSubjects = useMemo(
    () =>
      activeSubjects.filter((subject) => !mappedSubjectIds.has(subject._id)),
    [activeSubjects, mappedSubjectIds],
  );

  const assignedSubjects = useMemo(
    () =>
      activeMappings
        .map((mapping) => ({
          mappingId: mapping._id,
          subject:
            subjects.find((subject) => subject._id === mapping.subjectId) || null,
        }))
        .filter((item) => item.subject),
    [activeMappings, subjects],
  );

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

  const loadSubjects = async () => {
    const data = await fetchSubjects();
    setSubjects(data);
  };

  const loadMappings = async (nextGradeId) => {
    if (!nextGradeId) {
      setMappings([]);
      return;
    }

    const data = await fetchMappingsByGrade(nextGradeId);
    setMappings(data);
  };

  useEffect(() => {
    const bootstrapPage = async () => {
      setLoading(true);

      try {
        const [years, subjectData] = await Promise.all([
          fetchAcademicYears({ status: "ACTIVE" }),
          fetchSubjects(),
        ]);

        const activeYear = years[0] || null;
        setSubjects(subjectData);

        if (!activeYear?._id) {
          setFeedback({
            type: "error",
            message: "No active academic year found. Activate one to manage subjects.",
          });
          return;
        }

        setAcademicYearId(activeYear._id);

        const [overviewData, gradeData] = await Promise.all([
          fetchAdminOverview(today, activeYear._id),
          fetchGradesByYear(activeYear._id),
        ]);

        const activeGrades = gradeData.filter((grade) => grade.status === "ACTIVE");
        setOverview(overviewData);
        setGrades(activeGrades);

        const firstGradeId = activeGrades[0]?._id || "";
        setGradeId(firstGradeId);

        if (firstGradeId) {
          const mappingData = await fetchMappingsByGrade(firstGradeId);
          setMappings(mappingData);
        }
      } catch (error) {
        console.error("Failed to bootstrap subjects workspace", error);
        setFeedback({
          type: "error",
          message: "Failed to load the subjects workspace.",
        });
      } finally {
        setLoading(false);
      }
    };

    bootstrapPage();
  }, [today]);

  const handleCreateSubject = async (event) => {
    event.preventDefault();
    setSaving("subject");
    setFeedback({ type: "", message: "" });

    try {
      await createSubject({ name: subjectName });
      setSubjectName("");
      setFeedback({
        type: "success",
        message: "Subject created successfully.",
      });
      await loadSubjects();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "Failed to create subject.",
      });
    } finally {
      setSaving("");
    }
  };

  const handleMapSubject = async (subjectId) => {
    if (!gradeId) {
      setFeedback({
        type: "error",
        message: "Choose a class before mapping subjects.",
      });
      return;
    }

    setSaving(`map-${subjectId}`);
    setFeedback({ type: "", message: "" });

    try {
      await mapSubjectToGrade({
        gradeId,
        subjectId,
      });

      setFeedback({
        type: "success",
        message: "Subject mapped successfully.",
      });

      await loadMappings(gradeId);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "Failed to map subject.",
      });
    } finally {
      setSaving("");
    }
  };

  const handleUnmapSubject = async (mappingId) => {
    setSaving(`unmap-${mappingId}`);
    setFeedback({ type: "", message: "" });

    try {
      await unmapSubjectFromGrade(mappingId);
      setFeedback({
        type: "success",
        message: "Subject unmapped successfully.",
      });
      await loadMappings(gradeId);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "Failed to unmap subject.",
      });
    } finally {
      setSaving("");
    }
  };

  const handleToggleSubjectStatus = async (subject) => {
    setSaving(`subject-status-${subject._id}`);
    setFeedback({ type: "", message: "" });

    try {
      if (subject.status === "ACTIVE") {
        await deactivateSubject(subject._id);
      } else {
        await activateSubject(subject._id);
      }

      setFeedback({
        type: "success",
        message: `Subject ${subject.status === "ACTIVE" ? "deactivated" : "activated"} successfully.`,
      });

      await loadSubjects();
      await loadMappings(gradeId);
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error.response?.data?.message || "Failed to update subject status.",
      });
    } finally {
      setSaving("");
    }
  };

  if (loading) {
    return <div className="subjects-empty">Loading subjects workspace...</div>;
  }

  return (
    <div className="subjects-dashboard">
      <div className="subjects-main">
        <section className="subjects-stat-grid">
          {statCards.map((card) => (
            <article className={`subjects-stat-card ${card.toneClass}`} key={card.label}>
              <span className="subjects-stat-plus">+</span>
              <h3>{card.value}</h3>
              <p>{card.label}</p>
            </article>
          ))}
        </section>

        <section className="subjects-panel-card">
          <div className="subjects-panel-head">
            <h3>Assign Subject to Class</h3>
            <label className="subjects-class-chip">
              <span>Class</span>
              <select
                value={gradeId}
                onChange={async (event) => {
                  const nextGradeId = event.target.value;
                  setGradeId(nextGradeId);
                  await loadMappings(nextGradeId);
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
          </div>

          {feedback.message ? (
            <p className={`subjects-feedback ${feedback.type}`}>{feedback.message}</p>
          ) : null}

          <div className="subjects-map-grid">
            {unmappedSubjects.map((subject) => (
              <article className="subjects-map-pill" key={subject._id}>
                <span>{subject.name}</span>
                <button
                  type="button"
                  onClick={() => handleMapSubject(subject._id)}
                  disabled={!gradeId || saving === `map-${subject._id}`}
                >
                  {saving === `map-${subject._id}` ? "..." : "MAP"}
                </button>
              </article>
            ))}

            {unmappedSubjects.length === 0 ? (
              <div className="subjects-empty compact">
                All active subjects are already mapped for this class.
              </div>
            ) : null}
          </div>
        </section>

        <section className="subjects-panel-card">
          <div className="subjects-panel-head">
            <h3>Class Wise Assigned Subjects</h3>
            <label className="subjects-class-chip">
              <span>Class</span>
              <select
                value={gradeId}
                onChange={async (event) => {
                  const nextGradeId = event.target.value;
                  setGradeId(nextGradeId);
                  await loadMappings(nextGradeId);
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
          </div>

          <div className="subjects-assigned-grid">
            {assignedSubjects.map((item) => (
              <article className="subjects-assigned-pill" key={item.mappingId}>
                <span>{item.subject?.name}</span>
                <button
                  type="button"
                  onClick={() => handleUnmapSubject(item.mappingId)}
                  disabled={saving === `unmap-${item.mappingId}`}
                >
                  {saving === `unmap-${item.mappingId}` ? "..." : "Unmap"}
                </button>
              </article>
            ))}

            {assignedSubjects.length === 0 ? (
              <div className="subjects-empty compact">
                No subjects mapped for this class yet.
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <aside className="subjects-side">
        <section className="subjects-panel-card">
          <div className="subjects-panel-head">
            <h3>Define Subject</h3>
          </div>

          <form className="subjects-create-form" onSubmit={handleCreateSubject}>
            <label className="subjects-create-field">
              <span>Subject Name</span>
              <input
                type="text"
                value={subjectName}
                onChange={(event) => setSubjectName(event.target.value)}
                placeholder="Enter subject name"
                required
              />
            </label>

            <div className="subjects-create-actions">
              <button
                className="subjects-create-button"
                type="submit"
                disabled={saving === "subject"}
              >
                {saving === "subject" ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </section>

        <section className="subjects-panel-card">
          <div className="subjects-panel-head">
            <h3>Subjects List</h3>
          </div>

          <div className="subjects-list-card">
            <h4>Subject Names</h4>
            <div className="subjects-list-scroll">
              {subjects.map((subject) => (
                <article className="subjects-list-row" key={subject._id}>
                  <div className="subjects-list-copy">
                    <span>{subject.name}</span>
                    <small>{subject.status}</small>
                  </div>
                  <button
                    className="subjects-status-button"
                    type="button"
                    onClick={() => handleToggleSubjectStatus(subject)}
                    disabled={saving === `subject-status-${subject._id}`}
                  >
                    {saving === `subject-status-${subject._id}`
                      ? "..."
                      : subject.status === "ACTIVE"
                        ? "Deactivate"
                        : "Activate"}
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}

export default SubjectsPage;
