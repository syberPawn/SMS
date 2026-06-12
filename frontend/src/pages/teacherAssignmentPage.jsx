import { useEffect, useState } from "react";
import { fetchAcademicYears } from "../api/academicYear.api";
import { fetchGradesByYear } from "../api/grade.api";
import { fetchSectionsByGrade } from "../api/section.api";
import { fetchAllUsers } from "../api/user.api";
import { assignClassTeacher } from "../api/teacherAssignment.api";
import {
  fetchClassTeacher,
  replaceClassTeacher,
} from "../api/teacherAssignment.api";
import { fetchSubjects } from "../api/subject.api";
import {
  assignSubjectTeacher,
  replaceSubjectTeacher,
  fetchSubjectTeachers,
} from "../api/teacherAssignment.api";

const TeacherAssignmentsPage = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [academicYearId, setAcademicYearId] = useState("");

  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState("");

  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [subjectAssignments, setSubjectAssignments] = useState([]);
  const [currentClassTeacher, setCurrentClassTeacher] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [gradeId, setGradeId] = useState("");

  /*
=====================================
Load Subjects
=====================================
*/
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const data = await fetchSubjects();

        const validSubjects = data.filter(
          (subject) =>
            subject.status === "ACTIVE" && subject.isReserved !== true,
        );

        setSubjects(validSubjects);
      } catch (error) {
        console.error("Failed to load subjects", error);
      }
    };

    loadSubjects();
  }, []);

  /*
=====================================
Fetch Subject Assignments
=====================================
*/
  useEffect(() => {
    if (!academicYearId || !sectionId) {
      setSubjectAssignments([]);
      return;
    }

    const loadAssignments = async () => {
      try {
        const data = await fetchSubjectTeachers(sectionId, academicYearId);
        setSubjectAssignments(data);
      } catch (error) {
        setSubjectAssignments([]);
      }
    };

    loadAssignments();
  }, [academicYearId, sectionId]);

  /*
=====================================
Load Teachers (ACTIVE only)
=====================================
*/
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const users = await fetchAllUsers();

        const activeTeachers = users.filter(
          (user) => user.role === "TEACHER" && user.status === "ACTIVE",
        );

        setTeachers(activeTeachers);
      } catch (error) {
        console.error("Failed to load teachers", error);
      }
    };

    loadTeachers();
  }, []);
  /*
  =====================================
  Load Academic Years (once)
  =====================================
  */
  useEffect(() => {
    const loadAcademicYears = async () => {
      try {
        const data = await fetchAcademicYears();
        setAcademicYears(data);
      } catch (error) {
        console.error("Failed to load academic years", error);
      }
    };

    loadAcademicYears();
  }, []);

  /*
  =====================================
  Load Grades when Academic Year changes
  =====================================
  */
  useEffect(() => {
    if (!academicYearId) {
      setGrades([]);
      setSections([]);
      return;
    }

    const loadGrades = async () => {
      try {
        const data = await fetchGradesByYear(academicYearId);
        setGrades(data);
      } catch (error) {
        console.error("Failed to load grades", error);
      }
    };

    loadGrades();
  }, [academicYearId]);

  /*
  =====================================
  Load Sections when Grades change
  =====================================
  */
  useEffect(() => {
    if (grades.length === 0) {
      setSections([]);
      return;
    }

    const loadSections = async () => {
      try {
        let allSections = [];

        for (let grade of grades) {
          const sectionsData = await fetchSectionsByGrade(grade._id);
          allSections = [...allSections, ...sectionsData];
        }

        setSections(allSections);
      } catch (error) {
        console.error("Failed to load sections", error);
      }
    };

    loadSections();
  }, [grades]);

  /*
=====================================
Fetch Current Class Teacher
=====================================
*/
  useEffect(() => {
    if (!academicYearId || !sectionId) {
      setCurrentClassTeacher(null);
      return;
    }

    const loadCurrentClassTeacher = async () => {
      try {
        const data = await fetchClassTeacher(sectionId, academicYearId);
        setCurrentClassTeacher(data);
      } catch (error) {
        setCurrentClassTeacher(null);
      }
    };

    loadCurrentClassTeacher();
  }, [academicYearId, sectionId]);

  const handleAssignClassTeacher = async () => {
    if (!academicYearId || !sectionId || !selectedTeacherId) {
      alert("Please select Academic Year, Section and Teacher");
      return;
    }

    try {
      if (currentClassTeacher) {
        await replaceClassTeacher({
          academicYearId,
          sectionId,
          teacherId: selectedTeacherId,
        });

        alert("Class Teacher replaced successfully");
      } else {
        await assignClassTeacher({
          academicYearId,
          sectionId,
          teacherId: selectedTeacherId,
        });

        alert("Class Teacher assigned successfully");
      }

      const updated = await fetchClassTeacher(sectionId, academicYearId);
      setCurrentClassTeacher(updated);
      setSelectedTeacherId("");
    } catch (error) {
      alert(error.response?.data?.message || "Operation failed");
    }
  };

  const handleAssignSubjectTeacher = async () => {
    if (
      !academicYearId ||
      !sectionId ||
      !selectedSubjectId ||
      !selectedTeacherId
    ) {
      alert("Please select Academic Year, Section, Subject and Teacher");
      return;
    }

    try {
      const existing = subjectAssignments.find(
        (a) => a.subjectId === selectedSubjectId,
      );

      if (existing) {
        await replaceSubjectTeacher({
          academicYearId,
          sectionId,
          subjectId: selectedSubjectId,
          teacherId: selectedTeacherId,
        });

        alert("Subject Teacher replaced successfully");
      } else {
        await assignSubjectTeacher({
          academicYearId,
          sectionId,
          subjectId: selectedSubjectId,
          teacherId: selectedTeacherId,
        });

        alert("Subject Teacher assigned successfully");
      }

      const updated = await fetchSubjectTeachers(sectionId, academicYearId);

      setSubjectAssignments(updated);
      setSelectedSubjectId("");
      setSelectedTeacherId("");
    } catch (error) {
      alert(error.response?.data?.message || "Operation failed");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Teacher Assignment Management</h2>

      {/* Academic Year */}
      <div style={{ marginTop: "20px" }}>
        <label>Academic Year:</label>
        <select
          value={academicYearId}
          onChange={(e) => {
            setAcademicYearId(e.target.value);
            setGradeId(""); // ✅ reset grade
            setSectionId(""); // ✅ reset section
          }}
        >
          <option value="">Select Academic Year</option>
          {academicYears.map((year) => (
            <option key={year._id} value={year._id}>
              {year.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grade */}
      <div style={{ marginTop: "10px" }}>
        <label>Grade:</label>
        <select
          value={gradeId}
          onChange={(e) => {
            setGradeId(e.target.value);
            setSectionId(""); // reset section when grade changes
          }}
          disabled={!academicYearId}
        >
          <option value="">Select Grade</option>
          {grades.map((grade) => (
            <option key={grade._id} value={grade._id}>
              {grade.name}
            </option>
          ))}
        </select>
      </div>

      {/* Section */}
      <div style={{ marginTop: "10px" }}>
        <label>Section:</label>
        <select
          value={sectionId}
          onChange={(e) => setSectionId(e.target.value)}
          disabled={!gradeId}
        >
          <option value="">Select Section</option>
          {sections
            .filter((section) => (gradeId ? section.gradeId === gradeId : true))
            .map((section) => (
              <option key={section._id} value={section._id}>
                {section.name}
              </option>
            ))}
        </select>
      </div>

      <hr style={{ margin: "20px 0" }} />

      <h3>Class Teacher Assignment</h3>
      {currentClassTeacher && (
        <div style={{ marginTop: "10px", color: "green" }}>
          {(() => {
            const teacher = teachers.find(
              (t) => t._id === currentClassTeacher.teacherId,
            );

            return (
              <div style={{ marginTop: "10px", color: "green" }}>
                Current Class Teacher: {teacher?.username || "Unknown"}
              </div>
            );
          })()}
        </div>
      )}

      <div style={{ marginTop: "10px" }}>
        <label>Teacher:</label>
        <select
          value={selectedTeacherId}
          onChange={(e) => setSelectedTeacherId(e.target.value)}
          disabled={!sectionId}
        >
          <option value="">Select Teacher</option>
          {teachers.map((teacher) => (
            <option key={teacher._id} value={teacher._id}>
              {teacher.username}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginTop: "10px" }}>
        <button
          onClick={handleAssignClassTeacher}
          disabled={!selectedTeacherId}
        >
          {currentClassTeacher
            ? "Replace Class Teacher"
            : "Assign Class Teacher"}
        </button>
      </div>

      <hr style={{ margin: "20px 0" }} />

      <h3>Subject Teacher Assignment</h3>

      {/* Subject Dropdown */}
      <div style={{ marginTop: "10px" }}>
        <label>Subject:</label>
        <select
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          disabled={!sectionId}
        >
          <option value="">Select Subject</option>
          {subjects.map((subject) => (
            <option key={subject._id} value={subject._id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      {/* Teacher Dropdown */}
      <div style={{ marginTop: "10px" }}>
        <label>Teacher:</label>
        <select
          value={selectedTeacherId}
          onChange={(e) => setSelectedTeacherId(e.target.value)}
          disabled={!selectedSubjectId}
        >
          <option value="">Select Teacher</option>
          {teachers.map((teacher) => (
            <option key={teacher._id} value={teacher._id}>
              {teacher.username}
            </option>
          ))}
        </select>
      </div>

      {/* Assign Button */}
      <div style={{ marginTop: "10px" }}>
        <button
          onClick={handleAssignSubjectTeacher}
          disabled={!selectedTeacherId}
        >
          Assign / Replace Subject Teacher
        </button>
      </div>

      {/* Current Subject Assignments */}
      <div style={{ marginTop: "20px" }}>
        <h4>Current Subject Assignments:</h4>
        {subjectAssignments.length === 0 && <p>No subject assignments yet.</p>}
        {subjectAssignments.map((assignment) => {
          const subject = subjects.find((s) => s._id === assignment.subjectId);

          const teacher = teachers.find((t) => t._id === assignment.teacherId);

          return (
            <div key={assignment._id}>
              Subject: {subject?.name || "Unknown"} | Teacher:{" "}
              {teacher?.username || "Unknown"}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeacherAssignmentsPage;
