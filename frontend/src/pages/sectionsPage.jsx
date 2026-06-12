import { useEffect, useState } from "react";
import { fetchAcademicYears } from "../api/academicYear.api";
import { fetchGradesByYear } from "../api/grade.api";
import {
  fetchSectionsByGrade,
  createSection,
  deactivateSection,
} from "../api/section.api";

function SectionsPage() {
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [grades, setGrades] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [sections, setSections] = useState([]);
  const [sectionName, setSectionName] = useState("");
  const [message, setMessage] = useState("");

  /*
  =====================================
  Load Academic Years
  =====================================
  */

  const loadYears = async () => {
    try {
      const data = await fetchAcademicYears();
      setYears(data);

      const activeYear = data.find((y) => y.status === "ACTIVE");
      if (activeYear) {
        setSelectedYear(activeYear._id);
      }
    } catch (error) {
      console.error("Failed to load academic years");
    }
  };

  /*
  =====================================
  Load Grades
  =====================================
  */

  const loadGrades = async (yearId) => {
    try {
      const data = await fetchGradesByYear(yearId);
      setGrades(data);

      if (data.length > 0) {
        setSelectedGrade(data[0]._id);
      } else {
        setSelectedGrade("");
        setSections([]);
      }
    } catch (error) {
      console.error("Failed to load grades");
    }
  };

  /*
  =====================================
  Load Sections
  =====================================
  */

  const loadSections = async (gradeId) => {
    try {
      const data = await fetchSectionsByGrade(gradeId);
      setSections(data);
    } catch (error) {
      console.error("Failed to load sections");
    }
  };

  /*
  =====================================
  Effects
  =====================================
  */

  useEffect(() => {
    loadYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadGrades(selectedYear);
    }
  }, [selectedYear]);

  useEffect(() => {
    if (selectedGrade) {
      loadSections(selectedGrade);
    }
  }, [selectedGrade]);

  /*
  =====================================
  Create Section
  =====================================
  */

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!selectedGrade) {
      setMessage("Please select a grade first");
      return;
    }

    try {
      await createSection({
        gradeId: selectedGrade,
        name: sectionName,
      });

      setSectionName("");
      setMessage("Section created successfully");

      loadSections(selectedGrade);
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message);
      } else {
        setMessage("Error creating section");
      }
    }
  };

  /*
  =====================================
  Deactivate Section
  =====================================
  */

  const handleDeactivate = async (id) => {
    try {
      await deactivateSection(id);
      loadSections(selectedGrade);
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      }
    }
  };

  return (
    <div>
      <h2>Sections</h2>

      {/* Academic Year Selector */}
      <div>
        <label>Academic Year:</label>
        <br />
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {years.map((year) => (
            <option key={year._id} value={year._id}>
              {year.name}
            </option>
          ))}
        </select>
      </div>

      <br />

      {/* Grade Selector */}
      <div>
        <label>Grade:</label>
        <br />
        <select
          value={selectedGrade}
          onChange={(e) => setSelectedGrade(e.target.value)}
        >
          {grades.map((grade) => (
            <option key={grade._id} value={grade._id}>
              {grade.name}
            </option>
          ))}
        </select>
      </div>

      <hr />

      {/* Create Section */}
      <h3>Create Section</h3>

      <form onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Section name"
          value={sectionName}
          onChange={(e) => setSectionName(e.target.value)}
          required
        />
        <button type="submit">Create</button>
      </form>

      {message && <p style={{ color: "blue" }}>{message}</p>}

      <hr />

      {/* Section List */}
      <h3>Sections</h3>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((section) => (
            <tr key={section._id}>
              <td>{section.name}</td>
              <td>{section.status}</td>
              <td>
                {section.status === "ACTIVE" && (
                  <button onClick={() => handleDeactivate(section._id)}>
                    Deactivate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SectionsPage;
