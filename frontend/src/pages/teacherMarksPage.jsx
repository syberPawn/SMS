import { useContext, useEffect, useMemo, useState } from "react";
import { fetchAcademicYears } from "../api/academicYear.api";
import { fetchStudentsByEnrollment } from "../api/enrollment.api";
import {
  fetchExamInstances,
  fetchMarksForSubjectTeacher,
  submitSubjectMarks,
} from "../api/examination.api";
import { fetchTeacherAssignments } from "../api/teacherAssignment.api";
import { AuthContext } from "../context/AuthContext";
import "./roleDashboard.css";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "N/A";

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

const getSectionLabel = (section) => {
  const gradeName = section?.gradeId?.name?.trim();
  const sectionName = section?.name?.trim();

  return [gradeName, sectionName].filter(Boolean).join(" ") || "Unknown";
};

const TeacherMarksPage = () => {
  const { userId } = useContext(AuthContext);
  const [academicYear, setAcademicYear] = useState(null);
  const [subjectAssignments, setSubjectAssignments] = useState([]);
  const [examInstances, setExamInstances] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedExamInstanceId, setSelectedExamInstanceId] = useState("");
  const [students, setStudents] = useState([]);
  const [marksMap, setMarksMap] = useState({});
  const [submittedMarks, setSubmittedMarks] = useState([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadActiveYear = async () => {
      try {
        const years = await fetchAcademicYears({ status: "ACTIVE" });
        setAcademicYear(years[0] || null);
      } catch (error) {
        console.error("Failed to load academic year", error);
      }
    };

    loadActiveYear();
  }, []);

  useEffect(() => {
    if (!academicYear?._id || !userId) return;

    const loadAssignments = async () => {
      try {
        const data = await fetchTeacherAssignments(userId, academicYear._id);
        const assignments = data.subjectAssignments || [];

        setSubjectAssignments(assignments);

        if (assignments.length > 0) {
          setSelectedSectionId(assignments[0].sectionId?._id || "");
          setSelectedSubjectId(assignments[0].subjectId?._id || "");
        }
      } catch (error) {
        console.error("Failed to load teacher assignments", error);
      }
    };

    loadAssignments();
  }, [academicYear, userId]);

  useEffect(() => {
    if (!academicYear?._id) return;

    const loadExamInstances = async () => {
      try {
        const data = await fetchExamInstances(academicYear._id);

        setExamInstances(data);

        if (data.length > 0) {
          setSelectedExamInstanceId(data[0]._id);
        }
      } catch (error) {
        console.error("Failed to load exam instances", error);
      }
    };

    loadExamInstances();
  }, [academicYear]);

  useEffect(() => {
    if (!academicYear?._id || !selectedSectionId) {
      setStudents([]);
      setMarksMap({});
      return;
    }

    const loadStudents = async () => {
      try {
        const data = await fetchStudentsByEnrollment({
          academicYearId: academicYear._id,
          sectionId: selectedSectionId,
          enrollmentStatus: "ACTIVE",
        });
        const initialMarks = {};

        data.forEach((enrollment) => {
          initialMarks[enrollment.enrollmentId] = "";
        });

        setStudents(data);
        setMarksMap(initialMarks);
      } catch (error) {
        console.error("Failed to load students", error);
        setStudents([]);
        setMarksMap({});
      }
    };

    loadStudents();
  }, [academicYear, selectedSectionId]);

  useEffect(() => {
    if (!selectedSectionId || !selectedSubjectId || !selectedExamInstanceId) {
      setSubmittedMarks([]);
      return;
    }

    const loadSubmittedMarks = async () => {
      try {
        const data = await fetchMarksForSubjectTeacher({
          examInstanceId: selectedExamInstanceId,
          sectionId: selectedSectionId,
          subjectId: selectedSubjectId,
        });

        setSubmittedMarks(data || []);
      } catch (error) {
        console.error("Failed to load submitted marks", error);
        setSubmittedMarks([]);
      }
    };

    loadSubmittedMarks();
  }, [selectedExamInstanceId, selectedSectionId, selectedSubjectId]);

  const uniqueSections = useMemo(
    () => [
      ...new Map(
        subjectAssignments.map((assignment) => [
          assignment.sectionId?._id,
          assignment.sectionId,
        ]),
      ).values(),
    ],
    [subjectAssignments],
  );

  const filteredSubjects = useMemo(
    () =>
      subjectAssignments.filter(
        (assignment) => assignment.sectionId?._id === selectedSectionId,
      ),
    [selectedSectionId, subjectAssignments],
  );

  const uniqueSubjects = useMemo(
    () => [
      ...new Map(
        filteredSubjects.map((assignment) => [
          assignment.subjectId?._id,
          assignment,
        ]),
      ).values(),
    ],
    [filteredSubjects],
  );

  const uniqueSubjectCount = useMemo(
    () =>
      new Set(
        subjectAssignments
          .map((assignment) => assignment.subjectId?._id)
          .filter(Boolean),
      ).size,
    [subjectAssignments],
  );
  const selectedSection = uniqueSections.find(
    (section) => section?._id === selectedSectionId,
  );
  const selectedSubject = uniqueSubjects.find(
    (assignment) => assignment.subjectId?._id === selectedSubjectId,
  )?.subjectId;
  const selectedExam = examInstances.find(
    (exam) => exam._id === selectedExamInstanceId,
  );
  const submittedByEnrollmentId = useMemo(
    () =>
      new Map(
        submittedMarks.map((mark) => [
          String(mark.enrollmentId),
          mark.marks,
        ]),
      ),
    [submittedMarks],
  );
  const submittedCount = students.filter((student) =>
    submittedByEnrollmentId.has(String(student.enrollmentId)),
  ).length;

  const handleSubmitMarks = async () => {
    setMessage("");

    if (!selectedSectionId || !selectedSubjectId || !selectedExamInstanceId) {
      setMessage("Please select class, subject, and exam.");
      return;
    }

    let marksArray = [];

    try {
      marksArray = students.map((enrollment) => {
        const value = marksMap[enrollment.enrollmentId];

        if (value === "" || value === null || value === undefined) {
          throw new Error("All students must have marks entered.");
        }

        return {
          enrollmentId: enrollment.enrollmentId,
          marksObtained: Number(value),
        };
      });
    } catch (error) {
      setMessage(error.message);
      return;
    }

    setSubmitting(true);

    try {
      await submitSubjectMarks({
        examInstanceId: selectedExamInstanceId,
        marks: marksArray,
        sectionId: selectedSectionId,
        subjectId: selectedSubjectId,
        teacherId: userId,
      });

      const updatedMarks = await fetchMarksForSubjectTeacher({
        examInstanceId: selectedExamInstanceId,
        sectionId: selectedSectionId,
        subjectId: selectedSubjectId,
      });
      const resetMarks = {};

      students.forEach((enrollment) => {
        resetMarks[enrollment.enrollmentId] = "";
      });

      setMarksMap(resetMarks);
      setSubmittedMarks(updatedMarks || []);
      setMessage("Marks submitted successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Marks submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="teacher-marks-screen">
      <section className="teacher-dashboard-v2-top">
        <article className="teacher-v2-stat purple">
          <h3>{String(uniqueSections.length).padStart(2, "0")}</h3>
          <p>Classes</p>
        </article>
        <article className="teacher-v2-stat gold">
          <h3>{String(uniqueSubjectCount).padStart(2, "0")}</h3>
          <p>Subjects</p>
        </article>
        <article className="teacher-v2-stat purple">
          <h3>{String(examInstances.length).padStart(2, "0")}</h3>
          <p>Exams</p>
        </article>
        <article className="teacher-v2-stat gold">
          <h3>{String(submittedCount).padStart(2, "0")}</h3>
          <p>Submitted</p>
        </article>
      </section>

      {subjectAssignments.length === 0 ? (
        <div className="role-dashboard-empty">No subject assignments found.</div>
      ) : (
        <>
          <section className="teacher-v2-card teacher-marks-filters">
            <label>
              <span>Class</span>
              <select
                value={selectedSectionId}
                onChange={(event) => {
                  setSelectedSectionId(event.target.value);
                  setSelectedSubjectId("");
                }}
              >
                <option value="">Select Class</option>
                {uniqueSections.map((section) => (
                  <option key={section?._id} value={section?._id}>
                    {getSectionLabel(section)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Subject</span>
              <select
                value={selectedSubjectId}
                onChange={(event) => setSelectedSubjectId(event.target.value)}
                disabled={!selectedSectionId}
              >
                <option value="">Select Subject</option>
                {uniqueSubjects.map((assignment) => (
                  <option
                    key={assignment.subjectId?._id}
                    value={assignment.subjectId?._id}
                  >
                    {assignment.subjectId?.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Exam</span>
              <select
                value={selectedExamInstanceId}
                onChange={(event) =>
                  setSelectedExamInstanceId(event.target.value)
                }
              >
                <option value="">Select Exam</option>
                {examInstances.map((exam) => (
                  <option key={exam._id} value={exam._id}>
                    {formatExamType(exam.type)} - {formatDate(exam.examDate)}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="teacher-marks-grid">
            <article className="teacher-v2-card teacher-marks-card">
              <div className="teacher-attendance-head">
                <div>
                  <h3>Submit Marks</h3>
                  <p>
                    {selectedSection ? getSectionLabel(selectedSection) : "Class"} |{" "}
                    {selectedSubject?.name || "Subject"} |{" "}
                    {selectedExam
                      ? `${formatExamType(selectedExam.type)} ${formatDate(selectedExam.examDate)}`
                      : "Exam"}
                  </p>
                </div>
              </div>

              {students.length > 0 && selectedSubjectId && selectedExamInstanceId ? (
                <div className="teacher-marks-list">
                  {students.map((enrollment) => (
                    <div className="teacher-marks-row" key={enrollment.enrollmentId}>
                      <strong>{enrollment.fullName}</strong>
                      <input
                        max="100"
                        min="0"
                        placeholder="0-100"
                        type="number"
                        value={marksMap[enrollment.enrollmentId] || ""}
                        onChange={(event) =>
                          setMarksMap((current) => ({
                            ...current,
                            [enrollment.enrollmentId]: event.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="teacher-v2-empty compact">
                  Select class, subject, and exam to enter marks.
                </div>
              )}

              {message ? <p className="teacher-attendance-message">{message}</p> : null}

              <button
                className="teacher-attendance-submit"
                disabled={
                  submitting ||
                  students.length === 0 ||
                  !selectedSubjectId ||
                  !selectedExamInstanceId
                }
                type="button"
                onClick={handleSubmitMarks}
              >
                {submitting ? "Submitting..." : "Submit Marks"}
              </button>
            </article>

            <article className="teacher-v2-card teacher-marks-card">
              <div className="teacher-attendance-head">
                <div>
                  <h3>View Marks</h3>
                  <p>Submitted marks for the selected class and subject.</p>
                </div>
              </div>

              {students.length === 0 || !selectedSubjectId || !selectedExamInstanceId ? (
                <div className="teacher-v2-empty compact">
                  Select details to view submitted marks.
                </div>
              ) : (
                <div className="teacher-marks-list">
                  {students.map((student) => {
                    const mark = submittedByEnrollmentId.get(
                      String(student.enrollmentId),
                    );

                    return (
                      <div className="teacher-marks-view-row" key={student.enrollmentId}>
                        <strong>{student.fullName}</strong>
                        <span>{mark ?? "Not Submitted"}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          </section>
        </>
      )}
    </div>
  );
};

export default TeacherMarksPage;
