import { useEffect, useMemo, useState } from "react";
import { fetchAcademicYears } from "../api/academicYear.api";
import { fetchAdminOverview } from "../api/analytics.api";
import { fetchGradesByYear } from "../api/grade.api";
import { fetchMappingsByGrade } from "../api/gradeSubjectMapping.api";
import { fetchSectionsByGrade } from "../api/section.api";
import { fetchSubjects } from "../api/subject.api";
import { createTeacher, fetchTeachers } from "../api/teacher.api";
import {
  assignClassTeacher,
  assignSubjectTeacher,
  fetchClassTeacher,
  fetchSubjectTeachers,
  replaceClassTeacher,
  replaceSubjectTeacher,
} from "../api/teacherAssignment.api";
import "./teacherAssignmentPage.css";

const qualificationOptions = [
  "10+2",
  "Bachelor Degree",
  "Master's Degree",
  "Phd",
  "Other",
];

const subjectToneClasses = ["blue", "purple", "green", "rose", "gold"];

const formatTeacherName = (teacher) =>
  teacher?.fullName || teacher?.username || "Unknown Teacher";

const qualificationLabel = (teacher) => {
  if (!teacher) {
    return "";
  }

  return teacher.qualificationDetail
    ? `${teacher.highestQualification} - ${teacher.qualificationDetail}`
    : teacher.highestQualification;
};

function TeacherManagementPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [academicYearId, setAcademicYearId] = useState("");
  const [academicYearName, setAcademicYearName] = useState("");
  const [grades, setGrades] = useState([]);
  const [gradeId, setGradeId] = useState("");
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState("");
  const [allSubjects, setAllSubjects] = useState([]);
  const [mappedSubjects, setMappedSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [teacherFilter, setTeacherFilter] = useState("ALL");
  const [classTeacherDraftId, setClassTeacherDraftId] = useState("");
  const [currentClassTeacher, setCurrentClassTeacher] = useState(null);
  const [subjectAssignments, setSubjectAssignments] = useState([]);
  const [subjectTeacherDrafts, setSubjectTeacherDrafts] = useState({});
  const [teacherForm, setTeacherForm] = useState({
    fullName: "",
    highestQualification: "10+2",
    qualificationDetail: "",
  });

  const showQualificationDetail = [
    "Bachelor Degree",
    "Master's Degree",
    "Phd",
    "Other",
  ].includes(teacherForm.highestQualification);

  const activeTeachers = useMemo(
    () => teachers.filter((teacher) => teacher.status === "ACTIVE"),
    [teachers],
  );

  const selectedGrade = useMemo(
    () => grades.find((grade) => grade._id === gradeId) || null,
    [gradeId, grades],
  );

  const selectedSection = useMemo(
    () => sections.find((section) => section._id === sectionId) || null,
    [sectionId, sections],
  );

  const currentClassTeacherProfile = useMemo(
    () =>
      teachers.find((teacher) => teacher.userId === currentClassTeacher?.teacherId) ||
      null,
    [currentClassTeacher, teachers],
  );

  const mappedSubjectRows = useMemo(() => {
    const activeSubjectIds = new Set(
      mappedSubjects
        .filter((mapping) => mapping.status === "ACTIVE")
        .map((mapping) => mapping.subjectId),
    );

    return allSubjects
      .filter(
        (subject) =>
          subject.status === "ACTIVE" &&
          subject.isReserved !== true &&
          activeSubjectIds.has(subject._id),
      )
      .map((subject, index) => ({
        ...subject,
        toneClass: subjectToneClasses[index % subjectToneClasses.length],
      }));
  }, [allSubjects, mappedSubjects]);

  const filteredTeachers = useMemo(() => {
    if (teacherFilter === "CLASS") {
      return teachers.filter((teacher) => teacher.isClassTeacher);
    }

    if (teacherFilter === "SUBJECT") {
      return teachers.filter((teacher) => !teacher.isClassTeacher);
    }

    return teachers;
  }, [teacherFilter, teachers]);

  const statCards = useMemo(() => {
    const totalStudents = overview?.totalActiveStudents || 0;
    const totalTeachers = overview?.totalActiveTeachers || activeTeachers.length;
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
  }, [activeTeachers.length, overview]);

  const loadTeachers = async (yearId) => {
    const data = await fetchTeachers(yearId ? { academicYearId: yearId } : {});
    setTeachers(data);
  };

  const loadOverview = async (yearId) => {
    try {
      const data = await fetchAdminOverview(today, yearId || undefined);
      setOverview(data);
    } catch (error) {
      console.error("Failed to load teacher overview", error);
      setOverview(null);
    }
  };

  const loadAssignments = async (yearId, nextSectionId) => {
    if (!yearId || !nextSectionId) {
      setCurrentClassTeacher(null);
      setClassTeacherDraftId("");
      setSubjectAssignments([]);
      setSubjectTeacherDrafts({});
      return;
    }

    try {
      const [classTeacher, subjects] = await Promise.all([
        fetchClassTeacher(nextSectionId, yearId),
        fetchSubjectTeachers(nextSectionId, yearId),
      ]);

      setCurrentClassTeacher(classTeacher);
      setClassTeacherDraftId(classTeacher?.teacherId || "");
      setSubjectAssignments(subjects);
      setSubjectTeacherDrafts(
        subjects.reduce((accumulator, assignment) => {
          accumulator[assignment.subjectId] = assignment.teacherId;
          return accumulator;
        }, {}),
      );
    } catch (error) {
      console.error("Failed to load teacher assignments", error);
      setCurrentClassTeacher(null);
      setClassTeacherDraftId("");
      setSubjectAssignments([]);
      setSubjectTeacherDrafts({});
    }
  };

  useEffect(() => {
    const bootstrapPage = async () => {
      setLoading(true);

      try {
        const [years, subjects] = await Promise.all([
          fetchAcademicYears({ status: "ACTIVE" }),
          fetchSubjects(),
        ]);

        setAllSubjects(subjects);

        const activeYear = years[0] || null;

        if (activeYear?._id) {
          setAcademicYearId(activeYear._id);
          setAcademicYearName(activeYear.name || "");
          await Promise.all([
            loadTeachers(activeYear._id),
            loadOverview(activeYear._id),
          ]);
        } else {
          setAcademicYearName("");
          await Promise.all([loadTeachers(), loadOverview()]);
          setFeedback({
            type: "error",
            message: "No active academic year found. Activate one to manage assignments.",
          });
        }
      } catch (error) {
        console.error("Failed to bootstrap teacher page", error);
        setFeedback({
          type: "error",
          message: "Failed to load the teacher workspace.",
        });
      } finally {
        setLoading(false);
      }
    };

    bootstrapPage();
  }, []);

  useEffect(() => {
    if (!academicYearId) {
      setGrades([]);
      setGradeId("");
      setSections([]);
      setSectionId("");
      setMappedSubjects([]);
      return;
    }

    const loadYearData = async () => {
      try {
        const [gradeData] = await Promise.all([
          fetchGradesByYear(academicYearId),
          loadTeachers(academicYearId),
          loadOverview(academicYearId),
        ]);

        const activeGrades = gradeData.filter((grade) => grade.status === "ACTIVE");
        setGrades(activeGrades);

        if (!activeGrades.some((grade) => grade._id === gradeId)) {
          setGradeId("");
          setSectionId("");
        }
      } catch (error) {
        console.error("Failed to load academic year data", error);
      }
    };

    loadYearData();
  }, [academicYearId]);

  useEffect(() => {
    if (!gradeId) {
      setSections([]);
      setSectionId("");
      setMappedSubjects([]);
      return;
    }

    const loadGradeData = async () => {
      try {
        const [sectionData, mappingData] = await Promise.all([
          fetchSectionsByGrade(gradeId),
          fetchMappingsByGrade(gradeId),
        ]);

        const activeSections = sectionData.filter(
          (section) => section.status === "ACTIVE",
        );

        setSections(activeSections);
        setMappedSubjects(mappingData);

        if (!activeSections.some((section) => section._id === sectionId)) {
          setSectionId("");
        }
      } catch (error) {
        console.error("Failed to load grade data", error);
      }
    };

    loadGradeData();
  }, [gradeId]);

  useEffect(() => {
    loadAssignments(academicYearId, sectionId);
  }, [academicYearId, sectionId]);

  const refreshTeacherWorkspace = async (options = {}) => {
    const nextYearId = options.academicYearId || academicYearId;
    await Promise.all([
      loadTeachers(nextYearId),
      loadOverview(nextYearId),
      loadAssignments(nextYearId, options.sectionId ?? sectionId),
    ]);
  };

  const handleTeacherFormChange = (field, value) => {
    setTeacherForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateTeacher = async (event) => {
    event.preventDefault();
    setSaving("create-teacher");
    setFeedback({ type: "", message: "" });

    try {
      const response = await createTeacher({
        fullName: teacherForm.fullName,
        highestQualification: teacherForm.highestQualification,
        qualificationDetail: showQualificationDetail
          ? teacherForm.qualificationDetail
          : "",
      });

      setTeacherForm({
        fullName: "",
        highestQualification: "10+2",
        qualificationDetail: "",
      });

      setFeedback({
        type: "success",
        message: `Teacher created. Username: ${response.credentials.username} | Password: ${response.credentials.password}`,
      });

      await refreshTeacherWorkspace();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "Failed to create teacher.",
      });
    } finally {
      setSaving("");
    }
  };

  const handleAssignClassTeacher = async () => {
    if (!academicYearId || !sectionId || !classTeacherDraftId) {
      setFeedback({
        type: "error",
        message: "Select class, section, and class teacher.",
      });
      return;
    }

    setSaving("class-teacher");
    setFeedback({ type: "", message: "" });

    try {
      if (currentClassTeacher?._id) {
        await replaceClassTeacher({
          academicYearId,
          sectionId,
          teacherId: classTeacherDraftId,
        });
      } else {
        await assignClassTeacher({
          academicYearId,
          sectionId,
          teacherId: classTeacherDraftId,
        });
      }

      setFeedback({
        type: "success",
        message: "Class teacher assignment updated.",
      });

      await refreshTeacherWorkspace();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error.response?.data?.message ||
          "Failed to update class teacher assignment.",
      });
    } finally {
      setSaving("");
    }
  };

  const handleAssignSubjectTeacher = async (subjectId) => {
    const teacherId = subjectTeacherDrafts[subjectId];

    if (!academicYearId || !sectionId || !subjectId || !teacherId) {
      setFeedback({
        type: "error",
        message: "Select a teacher before saving the subject assignment.",
      });
      return;
    }

    setSaving(`subject-${subjectId}`);
    setFeedback({ type: "", message: "" });

    try {
      const existingAssignment = subjectAssignments.find(
        (assignment) => assignment.subjectId === subjectId,
      );

      if (existingAssignment?._id) {
        await replaceSubjectTeacher({
          academicYearId,
          sectionId,
          subjectId,
          teacherId,
        });
      } else {
        await assignSubjectTeacher({
          academicYearId,
          sectionId,
          subjectId,
          teacherId,
        });
      }

      setFeedback({
        type: "success",
        message: "Subject teacher assignment updated.",
      });

      await refreshTeacherWorkspace();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error.response?.data?.message ||
          "Failed to update subject teacher assignment.",
      });
    } finally {
      setSaving("");
    }
  };

  if (loading) {
    return <div className="teacher-screen-empty">Loading teacher workspace...</div>;
  }

  return (
    <div className="teacher-screen">
      <div className="teacher-screen-main">
        <section className="teacher-stat-grid">
          {statCards.map((card) => (
            <article
              className={`teacher-stat-card ${card.toneClass}`}
              key={card.label}
            >
              <span className="teacher-stat-plus">+</span>
              <h3>{card.value}</h3>
              <p>{card.label}</p>
            </article>
          ))}
        </section>

        <section className="teacher-panel-card">
          <div className="teacher-panel-head">
            <h3>Add New Teacher</h3>
          </div>

          <form className="teacher-form" onSubmit={handleCreateTeacher}>
            <label className="teacher-pill-field">
              <span>Full Name</span>
              <input
                type="text"
                placeholder="Enter teacher name"
                value={teacherForm.fullName}
                onChange={(event) =>
                  handleTeacherFormChange("fullName", event.target.value)
                }
                required
              />
            </label>

            <label className="teacher-pill-field">
              <span>Highest Qualification</span>
              <select
                value={teacherForm.highestQualification}
                onChange={(event) =>
                  setTeacherForm({
                    fullName: teacherForm.fullName,
                    highestQualification: event.target.value,
                    qualificationDetail: "",
                  })
                }
              >
                {qualificationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            {showQualificationDetail ? (
              <label className="teacher-pill-field">
                <span>
                  {teacherForm.highestQualification === "Other"
                    ? "Qualification Detail"
                    : "Specialization"}
                </span>
                <input
                  type="text"
                  placeholder="Enter specialization"
                  value={teacherForm.qualificationDetail}
                  onChange={(event) =>
                    handleTeacherFormChange(
                      "qualificationDetail",
                      event.target.value,
                    )
                  }
                  required
                />
              </label>
            ) : null}

            {feedback.message ? (
              <p className={`teacher-feedback ${feedback.type}`}>
                {feedback.message}
              </p>
            ) : null}

            <div className="teacher-form-actions">
              <button className="teacher-action-button" type="submit">
                {saving === "create-teacher" ? "Saving..." : "Add"}
                <span>+</span>
              </button>
            </div>
          </form>
        </section>

        <section className="teacher-panel-card">
          <div className="teacher-panel-head">
            <h3>Teacher Assignment</h3>
            <div className="teacher-assignment-filters">
              <label>
                <span>Class</span>
                <select
                  value={gradeId}
                  onChange={(event) => setGradeId(event.target.value)}
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

          <div className="teacher-toolbar">
            <div className="teacher-toolbar-field teacher-context-card">
              <span>Academic Year In Context</span>
              <strong>{academicYearName || "No active academic year"}</strong>
            </div>

            <div className="teacher-toolbar-summary">
              <strong>
                {selectedGrade?.name || "Class"} {selectedSection?.name || "Section"}
              </strong>
              <span>
                {selectedGrade && selectedSection
                  ? "Assignments are saved for the selected class and section."
                  : "Choose a class and section to manage assignments."}
              </span>
            </div>
          </div>

          <div className="teacher-assignment-board">
            <div className="teacher-assignment-scroll">
              <article className="teacher-assignment-row rose">
                <div className="teacher-assignment-labels">
                  <span>Class Teacher</span>
                  {currentClassTeacherProfile ? (
                    <small>
                      Current: {formatTeacherName(currentClassTeacherProfile)}
                    </small>
                  ) : (
                    <small>No class teacher assigned yet</small>
                  )}
                </div>

                <div className="teacher-assignment-controls">
                  <select
                    value={classTeacherDraftId}
                    onChange={(event) => setClassTeacherDraftId(event.target.value)}
                    disabled={!sectionId}
                  >
                    <option value="">Select Class Teacher</option>
                    {activeTeachers.map((teacher) => (
                      <option key={teacher.userId} value={teacher.userId}>
                        {formatTeacherName(teacher)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAssignClassTeacher}
                    disabled={!classTeacherDraftId || !sectionId}
                  >
                    {saving === "class-teacher" ? "Saving..." : "Save"}
                  </button>
                </div>
              </article>

              {mappedSubjectRows.map((subject) => {
                const currentAssignment = subjectAssignments.find(
                  (assignment) => assignment.subjectId === subject._id,
                );
                const currentTeacher = teachers.find(
                  (teacher) => teacher.userId === currentAssignment?.teacherId,
                );

                return (
                  <article
                    className={`teacher-assignment-row ${subject.toneClass}`}
                    key={subject._id}
                  >
                    <div className="teacher-assignment-labels">
                      <span>{subject.name}</span>
                      <small>
                        {currentTeacher
                          ? `Current: ${formatTeacherName(currentTeacher)}`
                          : "No subject teacher assigned"}
                      </small>
                    </div>

                    <div className="teacher-assignment-controls">
                      <select
                        value={subjectTeacherDrafts[subject._id] || ""}
                        onChange={(event) =>
                          setSubjectTeacherDrafts((current) => ({
                            ...current,
                            [subject._id]: event.target.value,
                          }))
                        }
                        disabled={!sectionId}
                      >
                        <option value="">Select Teacher</option>
                        {activeTeachers.map((teacher) => (
                          <option key={teacher.userId} value={teacher.userId}>
                            {formatTeacherName(teacher)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAssignSubjectTeacher(subject._id)}
                        disabled={!subjectTeacherDrafts[subject._id] || !sectionId}
                      >
                        {saving === `subject-${subject._id}` ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </article>
                );
              })}

              {!gradeId ? (
                <div className="teacher-screen-empty compact">
                  Select a class to load mapped subjects.
                </div>
              ) : null}

              {gradeId && mappedSubjectRows.length === 0 ? (
                <div className="teacher-screen-empty compact">
                  No active subject mappings found for this class.
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <aside className="teacher-directory-card">
        <div className="teacher-directory-head">
          <h3>Teachers</h3>
          <select
            value={teacherFilter}
            onChange={(event) => setTeacherFilter(event.target.value)}
          >
            <option value="ALL">All Teachers</option>
            <option value="CLASS">Class Teachers</option>
            <option value="SUBJECT">Subject Teachers</option>
          </select>
        </div>

        <div className="teacher-directory-scroll">
          {filteredTeachers.map((teacher) => (
            <article className="teacher-directory-item" key={teacher.teacherId}>
              <div className="teacher-avatar">
                {(teacher.fullName || teacher.username || "T")
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </div>

              <div className="teacher-directory-copy">
                <h4>{formatTeacherName(teacher)}</h4>
                <p>{qualificationLabel(teacher)}</p>
                <p>{teacher.assignmentLabel}</p>
                {teacher.subjectAssignmentCount > 0 ? (
                  <span>
                    {teacher.subjectAssignmentCount} subject
                    {teacher.subjectAssignmentCount > 1 ? "s" : ""} assigned
                  </span>
                ) : (
                  <span>No subject assignments yet</span>
                )}
              </div>
            </article>
          ))}

          {filteredTeachers.length === 0 ? (
            <div className="teacher-screen-empty compact">
              No teachers match the selected filter.
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

export default TeacherManagementPage;
