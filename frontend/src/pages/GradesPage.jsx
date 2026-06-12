import { useEffect, useState } from "react";
import { fetchAcademicYears } from "../api/academicYear.api";
import {
  fetchGradesByYear,
  createGrade,
  deactivateGrade,
} from "../api/grade.api";
import { createSection, fetchSectionsByGrade } from "../api/section.api";

function GradesPage() {
  const [years, setYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [grades, setGrades] = useState([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [section, setSection] = useState("");
  const [sectionsMap, setSectionsMap] = useState({});

  /*
  =====================================
  Load Academic Years on Page Mount
  =====================================
  */
  const loadAcademicYears = async () => {
    try {
      const data = await fetchAcademicYears();
      setYears(data);

      // Find ACTIVE year (guaranteed by backend)
      const activeYear = data.find((year) => year.status === "ACTIVE");

      if (activeYear) {
        setSelectedYearId(activeYear._id);
        loadGrades(activeYear._id);
      }
    } catch (error) {
      console.error("Failed to load academic years");
    }
  };

  /*
  =====================================
  Load Grades for Selected Year
  =====================================
  */
  const loadGrades = async (academicYearId) => {
    try {
      const data = await fetchGradesByYear(academicYearId);
      setGrades(data);

      // Load sections for each grade
      const map = {};

      for (const grade of data) {
        const sections = await fetchSectionsByGrade(grade._id);
        map[grade._id] = sections;
      }

      setSectionsMap(map);
    } catch (error) {
      console.error("Failed to load grades");
    }
  };

  /*
  =====================================
  On Page Load
  =====================================
  */
  useEffect(() => {
    loadAcademicYears();
  }, []);

  /*
  =====================================
  When Year Changes
  =====================================
  */
  const handleYearChange = async (e) => {
    const yearId = e.target.value;
    setSelectedYearId(yearId);
    loadGrades(yearId);
  };

  /*
  =====================================
  Create Grade
  =====================================
  */
  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      // 1️⃣ Create grade
      const grade = await createGrade({
        name,
        academicYearId: selectedYearId,
      });

      // 2️⃣ Create section for that grade
      await createSection({
        name: section,
        gradeId: grade._id,
      });

      setMessage("Grade and Section created successfully");

      setName("");
      setSection("");

      loadGrades(selectedYearId);
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message);
      } else {
        setMessage("Error creating grade");
      }
    }
  };

  /*
  =====================================
  Deactivate Grade
  =====================================
  */
  const handleDeactivate = async (id) => {
    try {
      await deactivateGrade(id);
      loadGrades(selectedYearId);
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      }
    }
  };

  return (
    <div>
      <h2>Grades</h2>

      {/* Academic Year Selector */}
      <div>
        <label>Select Academic Year:</label>
        <br />
        <select value={selectedYearId} onChange={handleYearChange}>
          {years.map((year) => (
            <option key={year._id} value={year._id}>
              {year.name} ({year.status})
            </option>
          ))}
        </select>
      </div>

      <hr />

      <h3>Create Grade</h3>

      <form onSubmit={handleCreate}>
        <div>
          <label>Grade Name:</label>
          <br />
          <select
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          >
            <option value="">Select Grade</option>

            {[...Array(12)].map((_, index) => {
              const grade = index + 1;
              return (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label>Section:</label>
          <br />

          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            required
          >
            <option value="">Select Section</option>

            {["A", "B", "C", "D", "E", "F", "G", "H"].map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        <br />

        <br />

        <button type="submit">Create</button>
      </form>

      {message && <p style={{ color: "blue" }}>{message}</p>}

      <hr />

      <h3>All Grades</h3>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {grades.map((grade) => {
            const sections = sectionsMap[grade._id] || [];

            if (sections.length === 0) {
              return (
                <tr key={grade._id}>
                  <td>{grade.name}</td>
                  <td>{grade.status}</td>
                </tr>
              );
            }

            return sections.map((section) => (
              <tr key={section._id}>
                <td>
                  {grade.name} ({section.name})
                </td>
                <td>{section.status}</td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}

export default GradesPage;
