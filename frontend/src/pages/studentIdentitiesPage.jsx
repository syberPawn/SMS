import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAcademicYears } from "../api/academicYear.api";
import { fetchAdminOverview } from "../api/analytics.api";
import {
  fetchStudentsByEnrollment,
  updateEnrollmentStatus,
} from "../api/enrollment.api";
import { fetchGradesByYear } from "../api/grade.api";
import { fetchSectionsByGrade } from "../api/section.api";
import { createStudentWithEnrollment } from "../api/student.api";
import "./studentManagementPage.css";

const genderOptions = ["MALE", "FEMALE", "OTHER"];

function StudentIdentitiesPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [academicYearId, setAcademicYearId] = useState("");
  const [grades, setGrades] = useState([]);
  const [gradeId, setGradeId] = useState("");
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState("");
  const [formGradeId, setFormGradeId] = useState("");
  const [formSectionId, setFormSectionId] = useState("");
  const [formSections, setFormSections] = useState([]);
  const [gradeSectionsMap, setGradeSectionsMap] = useState({});
  const [overview, setOverview] = useState(null);
  const [students, setStudents] = useState([]);
  const [classCountStudents, setClassCountStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [studentForm, setStudentForm] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "MALE",
    admissionNumber: "",
  });

  const selectedGrade = useMemo(
    () => grades.find((grade) => grade._id === gradeId) || null,
    [gradeId, grades],
  );

  const selectedSection = useMemo(
    () => sections.find((section) => section._id === sectionId) || null,
    [sectionId, sections],
  );

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter(
      (student) =>
        student.fullName?.toLowerCase().includes(query) ||
        student.admissionNumber?.toLowerCase().includes(query),
    );
  }, [searchQuery, students]);

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

  const classCountRows = useMemo(
    () =>
      grades.map((grade) => {
        const gradeSectionIds = new Set(
          (gradeSectionsMap[grade._id] || []).map((section) =>
            String(section._id),
          ),
        );

        const count = classCountStudents.filter(
          (student) =>
            student.enrollmentStatus === "ACTIVE" &&
            gradeSectionIds.has(String(student.sectionId)),
        ).length;

        return {
          gradeId: grade._id,
          gradeName: grade.name,
          count,
        };
      }),
    [classCountStudents, gradeSectionsMap, grades],
  );

  const loadOverview = async (yearId) => {
    try {
      const data = await fetchAdminOverview(today, yearId || undefined);
      setOverview(data);
    } catch (error) {
      console.error("Failed to load student overview", error);
      setOverview(null);
    }
  };

  const loadStudents = async (options = {}) => {
    const yearId = options.academicYearId ?? academicYearId;
    const nextSectionId = options.sectionId ?? sectionId;

    if (!yearId) {
      setStudents([]);
      return;
    }

    try {
      const params = { academicYearId: yearId };

      if (nextSectionId) {
        params.sectionId = nextSectionId;
      }

      const data = await fetchStudentsByEnrollment(params);
      setStudents(data);
    } catch (error) {
      console.error("Failed to load enrollments", error);
      setStudents([]);
    }
  };

  const loadClassCountStudents = async (yearId) => {
    if (!yearId) {
      setClassCountStudents([]);
      return;
    }

    try {
      const data = await fetchStudentsByEnrollment({ academicYearId: yearId });
      setClassCountStudents(data || []);
    } catch (error) {
      console.error("Failed to load class-wise student counts", error);
      setClassCountStudents([]);
    }
  };

  useEffect(() => {
    const bootstrapPage = async () => {
      setLoading(true);

      try {
        const years = await fetchAcademicYears({ status: "ACTIVE" });
        const activeYear = years[0] || null;

        if (!activeYear?._id) {
          setFeedback({
            type: "error",
            message: "No active academic year found. Activate one to manage students.",
          });
          return;
        }

        setAcademicYearId(activeYear._id);

        await Promise.all([
          loadOverview(activeYear._id),
          loadStudents({
            academicYearId: activeYear._id,
            sectionId: "",
          }),
          loadClassCountStudents(activeYear._id),
        ]);
      } catch (error) {
        console.error("Failed to bootstrap student workspace", error);
        setFeedback({
          type: "error",
          message: "Failed to load the student workspace.",
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
      setFormGradeId("");
      setFormSectionId("");
      setFormSections([]);
      setGradeSectionsMap({});
      return;
    }

    const loadYearData = async () => {
      try {
        const gradeData = await fetchGradesByYear(academicYearId);
        const activeGrades = gradeData.filter((grade) => grade.status === "ACTIVE");
        const sectionEntries = await Promise.all(
          activeGrades.map(async (grade) => {
            const sectionData = await fetchSectionsByGrade(grade._id);
            return [
              grade._id,
              sectionData.filter((section) => section.status === "ACTIVE"),
            ];
          }),
        );

        setGrades(activeGrades);
        setGradeSectionsMap(Object.fromEntries(sectionEntries));

        if (!activeGrades.some((grade) => grade._id === gradeId)) {
          setGradeId("");
          setSectionId("");
        }

        if (!activeGrades.some((grade) => grade._id === formGradeId)) {
          setFormGradeId("");
          setFormSectionId("");
          setFormSections([]);
        }
      } catch (error) {
        console.error("Failed to load student year data", error);
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

    const loadGradeData = async () => {
      try {
        const sectionData = await fetchSectionsByGrade(gradeId);
        const activeSections = sectionData.filter(
          (section) => section.status === "ACTIVE",
        );

        setSections(activeSections);

        if (!activeSections.some((section) => section._id === sectionId)) {
          setSectionId("");
        }
      } catch (error) {
        console.error("Failed to load student sections", error);
      }
    };

    loadGradeData();
  }, [gradeId]);

  useEffect(() => {
    if (!formGradeId) {
      setFormSections([]);
      setFormSectionId("");
      return;
    }

    const loadFormSections = async () => {
      try {
        const sectionData = await fetchSectionsByGrade(formGradeId);
        const activeSections = sectionData.filter(
          (section) => section.status === "ACTIVE",
        );

        setFormSections(activeSections);

        if (!activeSections.some((section) => section._id === formSectionId)) {
          setFormSectionId("");
        }
      } catch (error) {
        console.error("Failed to load enrollment form sections", error);
      }
    };

    loadFormSections();
  }, [formGradeId]);

  useEffect(() => {
    loadStudents();
  }, [academicYearId, sectionId]);

  useEffect(() => {
    loadClassCountStudents(academicYearId);
  }, [academicYearId]);

  const handleStudentFormChange = (field, value) => {
    setStudentForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateStudent = async (event) => {
    event.preventDefault();

    if (!academicYearId || !formSectionId) {
      setFeedback({
        type: "error",
        message: "Choose a class and section before enrolling a student.",
      });
      return;
    }

    setSaving("create-student");
    setFeedback({ type: "", message: "" });

    try {
      await createStudentWithEnrollment({
        ...studentForm,
        academicYearId,
        sectionId: formSectionId,
      });

      setStudentForm({
        fullName: "",
        dateOfBirth: "",
        gender: "MALE",
        admissionNumber: "",
      });
      setFormGradeId("");
      setFormSectionId("");
      setFormSections([]);

      setFeedback({
        type: "success",
        message: "Student created and enrolled successfully.",
      });

      await Promise.all([
        loadStudents(),
        loadOverview(academicYearId),
        loadClassCountStudents(academicYearId),
      ]);
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error.response?.data?.message || "Failed to create student enrollment.",
      });
    } finally {
      setSaving("");
    }
  };

  const handleStatusChange = async (enrollmentId, enrollmentStatus) => {
    setSaving(`status-${enrollmentId}`);
    setFeedback({ type: "", message: "" });

    try {
      await updateEnrollmentStatus(enrollmentId, enrollmentStatus);
      setFeedback({
        type: "success",
        message: "Enrollment status updated.",
      });
      await Promise.all([loadStudents(), loadClassCountStudents(academicYearId)]);
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error.response?.data?.message || "Failed to update enrollment status.",
      });
    } finally {
      setSaving("");
    }
  };

  if (loading) {
    return <div className="student-workspace-empty">Loading student workspace...</div>;
  }

  return (
    <div className="student-workspace">
      <div className="student-workspace-main">
        <div className="student-left-column">
          <section className="student-stat-grid">
            {statCards.map((card) => (
              <article className={`student-stat-card ${card.toneClass}`} key={card.label}>
                <span className="student-stat-plus">+</span>
                <h3>{card.value}</h3>
                <p>{card.label}</p>
              </article>
            ))}
          </section>

          <section className="student-panel-card">
            <div className="student-panel-head">
              <div>
                <h3>Students</h3>
                <p>Manage enrollments and class-wise student strength.</p>
              </div>
            </div>

            <div className="student-toolbar">
              <div className="student-filter-group">
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

              <div className="student-toolbar-summary">
                <strong>
                  {selectedGrade?.name || "Class"} {selectedSection?.name || "Section"}
                </strong>
                <span>
                  {selectedSection
                    ? "Enrollments below are scoped to the selected section."
                    : "Choose a class and section to narrow the enrollment list."}
                </span>
              </div>
            </div>

            {feedback.message ? (
              <p className={`student-feedback ${feedback.type}`}>{feedback.message}</p>
            ) : null}

            <section className="student-enrollments-card">
              <div className="student-card-head">
                <div>
                  <h4>Enrollments</h4>
                  <p>{filteredStudents.length} student records</p>
                </div>

                <label className="student-search-field">
                  <span>Search</span>
                  <input
                    type="text"
                    value={searchQuery}
                    placeholder="Search by name or admission number"
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </label>
              </div>

              <div className="student-enrollment-table">
                <div className="student-enrollment-head">
                  <span>Name</span>
                  <span>Class</span>
                  <span>Section</span>
                  <span>Admission No.</span>
                  <span>Status</span>
                  <span>Profile</span>
                </div>

                <div className="student-enrollment-scroll">
                  {filteredStudents.map((student) => (
                    <article className="student-enrollment-row" key={student.enrollmentId}>
                      <div className="student-cell student-student-cell">
                        <strong>{student.fullName}</strong>
                        <small>{student.identityStatus || "IDENTITY PENDING"}</small>
                      </div>
                      <div className="student-cell">{student.gradeName || selectedGrade?.name || "N/A"}</div>
                      <div className="student-cell">{student.sectionName || "N/A"}</div>
                      <div className="student-cell">{student.admissionNumber}</div>
                      <div className="student-cell">
                        <select
                          value={student.enrollmentStatus}
                          onChange={(event) =>
                            handleStatusChange(student.enrollmentId, event.target.value)
                          }
                          disabled={saving === `status-${student.enrollmentId}`}
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="PROMOTED">PROMOTED</option>
                          <option value="REPEATING">REPEATING</option>
                          <option value="WITHDRAWN">WITHDRAWN</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>
                      </div>
                      <div className="student-cell">
                        <Link to={`/admin/students/${student.studentId}`}>View</Link>
                      </div>
                    </article>
                  ))}

                  {filteredStudents.length === 0 ? (
                    <div className="student-workspace-empty compact">
                      No students found for the current filters.
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </section>
        </div>

        <aside className="student-side-stack">
          <section className="student-onboard-card">
                <div className="student-card-head stacked">
                  <div>
                    <h4>Enroll New Student</h4>
                    <p>
                      Choose the class and section for this new enrollment.
                    </p>
                  </div>
                </div>

                <form className="student-form" onSubmit={handleCreateStudent}>
                  <label className="student-pill-field">
                    <span>Full Name</span>
                    <input
                      type="text"
                      value={studentForm.fullName}
                      placeholder="Enter full name"
                      onChange={(event) =>
                        handleStudentFormChange("fullName", event.target.value)
                      }
                      required
                    />
                  </label>

                  <label className="student-pill-field">
                    <span>Date Of Birth</span>
                    <input
                      type="date"
                      value={studentForm.dateOfBirth}
                      onChange={(event) =>
                        handleStudentFormChange("dateOfBirth", event.target.value)
                      }
                      required
                    />
                  </label>

                  <label className="student-pill-field">
                    <span>Gender</span>
                    <select
                      value={studentForm.gender}
                      onChange={(event) =>
                        handleStudentFormChange("gender", event.target.value)
                      }
                    >
                      {genderOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="student-pill-field">
                    <span>Admission Number</span>
                    <input
                      type="text"
                      value={studentForm.admissionNumber}
                      placeholder="Enter admission number"
                      onChange={(event) =>
                        handleStudentFormChange("admissionNumber", event.target.value)
                      }
                      required
                    />
                  </label>

                  <label className="student-pill-field">
                    <span>Class</span>
                    <select
                      value={formGradeId}
                      onChange={(event) => {
                        setFormGradeId(event.target.value);
                        setFormSectionId("");
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

                  <label className="student-pill-field">
                    <span>Section</span>
                    <select
                      value={formSectionId}
                      onChange={(event) => setFormSectionId(event.target.value)}
                      disabled={!formGradeId}
                    >
                      <option value="">Choose section</option>
                      {formSections.map((section) => (
                        <option key={section._id} value={section._id}>
                          {section.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="student-enrollment-context">
                    <span>Enrollment Context</span>
                    <strong>
                      {formSectionId
                        ? `${grades.find((grade) => grade._id === formGradeId)?.name || "Class"} ${
                            formSections.find((section) => section._id === formSectionId)?.name || ""
                          }`
                        : "Choose class and section above"}
                    </strong>
                  </div>

                  <div className="student-form-actions">
                    <button
                      className="student-action-button"
                      type="submit"
                      disabled={!formSectionId || saving === "create-student"}
                    >
                      {saving === "create-student" ? "Enrolling..." : "Enroll"}
                      <span>+</span>
                    </button>
                  </div>
                </form>
              </section>

          <section className="student-class-count-card">
                <div className="student-card-head stacked">
                  <div>
                    <h4>Class Wise Student Count</h4>
                    <p>Active enrollments in the current academic year.</p>
                  </div>
                </div>

              <div className="student-class-count-grid">
                  {classCountRows.map((row) => {
                    const maxCount = Math.max(
                      ...classCountRows.map((item) => item.count),
                      1,
                    );
                    const width = Math.max((row.count / maxCount) * 100, row.count ? 8 : 0);

                    return (
                    <article className="student-class-count-pill" key={row.gradeId}>
                      <span>Class {row.gradeName}</span>
                      <div className="student-class-count-bar">
                        <div
                          className="student-class-count-fill"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <strong>{String(row.count).padStart(2, "0")}</strong>
                    </article>
                    );
                  })}

                  {classCountRows.length === 0 ? (
                    <div className="student-workspace-empty compact">
                      No classes available for student counts.
                    </div>
                  ) : null}
                </div>
              </section>
        </aside>
      </div>
    </div>
  );
}

export default StudentIdentitiesPage;
