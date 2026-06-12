import { useEffect, useState } from "react";
import { fetchAcademicYears } from "../api/academicYear.api";
import { fetchGradesByYear } from "../api/grade.api";
import { fetchSubjects } from "../api/subject.api";
import {
  fetchMappingsByGrade,
  mapSubjectToGrade,
  unmapSubjectFromGrade,
} from "../api/gradeSubjectMapping.api";

function CurriculumPage() {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [grades, setGrades] = useState([]);
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [mappings, setMappings] = useState([]);

  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadYears = async () => {
      try {
        const data = await fetchAcademicYears();
        setAcademicYears(data);

        const activeYear = data.find((year) => year.status === "ACTIVE");

        if (activeYear) {
          setSelectedYearId(activeYear._id);
        }
      } catch (error) {
        console.error("Failed to load academic years");
      }
    };

    loadYears();
  }, []);

  useEffect(() => {
    const loadGrades = async () => {
      if (!selectedYearId) {
        setGrades([]);
        setSelectedGradeId("");
        return;
      }

      try {
        const data = await fetchGradesByYear(selectedYearId);
        setGrades(data);
        setSelectedGradeId("");
      } catch (error) {
        console.error("Failed to load grades");
      }
    };

    loadGrades();
  }, [selectedYearId]);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const data = await fetchSubjects();
        setSubjects(data);
      } catch (error) {
        console.error("Failed to load subjects");
      }
    };

    loadSubjects();
  }, []);

  useEffect(() => {
    const loadMappings = async () => {
      if (!selectedGradeId) {
        setMappings([]);
        return;
      }

      try {
        const data = await fetchMappingsByGrade(selectedGradeId);
        setMappings(data);
      } catch (error) {
        console.error("Failed to load mappings");
      }
    };

    loadMappings();
  }, [selectedGradeId]);

  const handleMap = async (subjectId) => {
    if (!selectedGradeId) {
      setMessage("Please select a grade first");
      return;
    }

    try {
      await mapSubjectToGrade({
        gradeId: selectedGradeId,
        subjectId,
      });

      setMessage("Subject mapped successfully");

      const updated = await fetchMappingsByGrade(selectedGradeId);
      setMappings(updated);
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message);
      } else {
        setMessage("Mapping failed");
      }
    }
  };

  const handleUnmap = async (mappingId) => {
    try {
      await unmapSubjectFromGrade(mappingId);

      setMessage("Subject unmapped successfully");

      const updated = await fetchMappingsByGrade(selectedGradeId);
      setMappings(updated);
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message);
      } else {
        setMessage("Unmapping failed");
      }
    }
  };

  return (
    <div>
      <h2>Curriculum Management</h2>

      <hr />

      {/* Academic Year Selection */}
      <div>
        <label>Select Academic Year:</label>
        <br />
        <select
          value={selectedYearId}
          onChange={(e) => setSelectedYearId(e.target.value)}
        >
          <option value="">-- Select Year --</option>
          {academicYears.map((year) => (
            <option key={year._id} value={year._id}>
              {year.name} ({year.status})
            </option>
          ))}
        </select>
      </div>

      <br />

      {/* Grade Selection */}
      <div>
        <label>Select Grade:</label>
        <br />
        <select
          value={selectedGradeId}
          onChange={(e) => setSelectedGradeId(e.target.value)}
          disabled={!selectedYearId}
        >
          <option value="">-- Select Grade --</option>
          {grades.map((grade) => (
            <option key={grade._id} value={grade._id}>
              {grade.name} ({grade.status})
            </option>
          ))}
        </select>
      </div>
      <hr />

      {selectedGradeId && (
        <>
          <h3>Available Subjects</h3>

          <table border="1" cellPadding="8">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => {
                const isMapped = mappings.some(
                  (m) => m.subjectId === subject._id && m.status === "ACTIVE",
                );

                return (
                  <tr key={subject._id}>
                    <td>{subject.name}</td>
                    <td>{subject.status}</td>
                    <td>
                      {subject.status === "ACTIVE" && !isMapped ? (
                        <button onClick={() => handleMap(subject._id)}>
                          Map
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <hr />

          <h3>Mapped Subjects</h3>

          <table border="1" cellPadding="8">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {mappings
                .filter((m) => m.status === "ACTIVE")
                .map((mapping) => {
                  const subject = subjects.find(
                    (s) => s._id === mapping.subjectId,
                  );

                  return (
                    <tr key={mapping._id}>
                      <td>{subject?.name}</td>
                      <td>{mapping.status}</td>
                      <td>
                        <button onClick={() => handleUnmap(mapping._id)}>
                          Unmap
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {message && <p style={{ color: "blue" }}>{message}</p>}
        </>
      )}
    </div>
  );
}

export default CurriculumPage;
