import { useEffect, useState, useContext } from "react";
import { fetchAcademicYears } from "../api/academicYear.api";
import { fetchTeacherAssignments } from "../api/teacherAssignment.api";
import { fetchExamInstances } from "../api/examination.api";
import { AuthContext } from "../context/AuthContext";
import { fetchMarksForSubjectTeacher } from "../api/examination.api";
import { fetchStudentsByEnrollment } from "../api/enrollment.api";

const TeacherMarksViewPage = () => {
  const { userId } = useContext(AuthContext);

  const [academicYear, setAcademicYear] = useState(null);
  const [subjectAssignments, setSubjectAssignments] = useState([]);
  const [examInstances, setExamInstances] = useState([]);

  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedExamInstanceId, setSelectedExamInstanceId] = useState("");

  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  /*
  =====================================
  Load ACTIVE Academic Year
  =====================================
  */
  useEffect(() => {
    const loadActiveYear = async () => {
      try {
        const years = await fetchAcademicYears({ status: "ACTIVE" });
        if (years.length > 0) {
          setAcademicYear(years[0]);
        }
      } catch (error) {
        console.error("Failed to load academic year", error);
      }
    };

    loadActiveYear();
  }, []);

  /*
  =====================================
  Load Teacher Assignments
  =====================================
  */
  useEffect(() => {
    if (!academicYear || !userId) return;

    const loadAssignments = async () => {
      try {
        const data = await fetchTeacherAssignments(userId, academicYear._id);
        setSubjectAssignments(data.subjectAssignments || []);
      } catch (error) {
        console.error("Failed to load teacher assignments", error);
      }
    };

    loadAssignments();
  }, [academicYear, userId]);

  /*
  =====================================
  Load Exam Instances
  =====================================
  */
  useEffect(() => {
    if (!academicYear) return;

    const loadExamInstances = async () => {
      try {
        const data = await fetchExamInstances(academicYear._id);
        setExamInstances(data);
      } catch (error) {
        console.error("Failed to load exam instances", error);
      }
    };

    loadExamInstances();
  }, [academicYear]);

  /*
=====================================
Load Marks
=====================================
*/
  useEffect(() => {
    if (!selectedSectionId || !selectedSubjectId || !selectedExamInstanceId) {
      setMarks([]);
      return;
    }

    const loadMarks = async () => {
      try {
        const data = await fetchMarksForSubjectTeacher({
          sectionId: selectedSectionId,
          subjectId: selectedSubjectId,
          examInstanceId: selectedExamInstanceId,
        });

        setMarks(data);
      } catch (error) {
        console.error("Failed to load marks", error);
        setMarks([]);
      }
    };

    loadMarks();
  }, [selectedSectionId, selectedSubjectId, selectedExamInstanceId]);

  /*
=====================================
Load Students
=====================================
*/
  useEffect(() => {
    if (!academicYear || !selectedSectionId) {
      setStudents([]);
      return;
    }

    const loadStudents = async () => {
      try {
        const data = await fetchStudentsByEnrollment({
          academicYearId: academicYear._id,
          sectionId: selectedSectionId,
          enrollmentStatus: "ACTIVE",
        });

        setStudents(data);
      } catch (error) {
        console.error("Failed to load students", error);
        setStudents([]);
      }
    };

    loadStudents();
  }, [academicYear, selectedSectionId]);

  const uniqueSectionIds = [
    ...new Map(
      subjectAssignments.map((a) => [a.sectionId._id, a.sectionId]),
    ).values(),
  ];

  const filteredSubjects = subjectAssignments.filter(
    (a) => a.sectionId._id === selectedSectionId,
  );

  const getSectionLabel = (section) => {
    const gradeName = section?.gradeId?.name?.trim();
    const sectionName = section?.name?.trim();

    return [gradeName, sectionName].filter(Boolean).join(" ") || "Unknown";
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>View Submitted Marks</h2>

      <hr />

      {academicYear && (
        <div>
          <strong>Active Academic Year:</strong> {academicYear.name}
        </div>
      )}

      <hr />

      {subjectAssignments.length === 0 ? (
        <div>No subject assignments found.</div>
      ) : (
        <div>
          <h3>Select Details</h3>

          {/* Section */}
          <div>
            <label>Section:</label>
            <br />
            <select
              value={selectedSectionId}
              onChange={(e) => {
                setSelectedSectionId(e.target.value);
                setSelectedSubjectId("");
              }}
            >
              <option value="">-- Select Section --</option>
              {uniqueSectionIds.map((section) => (
                <option key={section._id} value={section._id}>
                  {getSectionLabel(section)}
                </option>
              ))}
            </select>
          </div>

          <br />

          {/* Subject */}
          <div>
            <label>Subject:</label>
            <br />
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={!selectedSectionId}
            >
              <option value="">-- Select Subject --</option>
              {filteredSubjects.map((assignment) => (
                <option key={assignment._id} value={assignment.subjectId._id}>
                  {assignment.subjectId.name}
                </option>
              ))}
            </select>
          </div>

          <br />

          {/* Exam */}
          <div>
            <label>Exam Instance:</label>
            <br />
            <select
              value={selectedExamInstanceId}
              onChange={(e) => setSelectedExamInstanceId(e.target.value)}
            >
              <option value="">-- Select Exam --</option>
              {examInstances.map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.type} - {new Date(exam.examDate).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
          <hr />

          {selectedSectionId && selectedSubjectId && selectedExamInstanceId && (
            <div>
              <h3>Submitted Marks</h3>

              {marks.length === 0 ? (
                <div>No marks submitted for this selection.</div>
              ) : (
                <table border="1" cellPadding="8">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const markRecord = marks.find(
                        (m) => m.enrollmentId === student.enrollmentId,
                      );

                      return (
                        <tr key={student.enrollmentId}>
                          <td>{student.fullName}</td>
                          <td>
                            {markRecord ? markRecord.marks : "Not Submitted"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherMarksViewPage;
