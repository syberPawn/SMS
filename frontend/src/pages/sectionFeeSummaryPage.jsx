import { useEffect, useState } from "react";

import { fetchAcademicYears } from "../api/academicYear.api";
import { fetchGradesByYear } from "../api/grade.api";
import { fetchSectionsByGrade } from "../api/section.api";

import { fetchSectionFeeSummary } from "../api/fee.api";

function SectionFeeSummaryPage() {
  const [academicYears, setAcademicYears] = useState([]);
  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  const [month, setMonth] = useState("");

  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState("");

  const loadAcademicYears = async () => {
    try {
      const data = await fetchAcademicYears();
      setAcademicYears(data);
    } catch (error) {
      console.error("Failed to load academic years");
    }
  };

  const loadGrades = async (academicYearId) => {
    try {
      const data = await fetchGradesByYear(academicYearId);
      setGrades(data);
    } catch (error) {
      console.error("Failed to load grades");
    }
  };

  const loadSections = async (gradeId) => {
    try {
      const data = await fetchSectionsByGrade(gradeId);
      setSections(data);
    } catch (error) {
      console.error("Failed to load sections");
    }
  };

  useEffect(() => {
    loadAcademicYears();
  }, []);

  const handleYearChange = (e) => {
    const yearId = e.target.value;
    setSelectedYear(yearId);
    setSelectedGrade("");
    setSelectedSection("");

    if (yearId) {
      loadGrades(yearId);
    }
  };

  const handleGradeChange = (e) => {
    const gradeId = e.target.value;
    setSelectedGrade(gradeId);
    setSelectedSection("");

    if (gradeId) {
      loadSections(gradeId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSummary(null);

    try {
      const data = await fetchSectionFeeSummary({
        sectionId: selectedSection,
        month,
      });

      setSummary(data);
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message);
      } else {
        setMessage("Error loading summary");
      }
    }
  };

  return (
    <div>
      <h2>Fee Management</h2>

      <h3>Section Fee Summary</h3>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Academic Year:</label>
          <br />
          <select value={selectedYear} onChange={handleYearChange} required>
            <option value="">-- Select Academic Year --</option>

            {academicYears.map((year) => (
              <option key={year._id} value={year._id}>
                {year.name}
              </option>
            ))}
          </select>
        </div>

        <br />

        <div>
          <label>Grade:</label>
          <br />
          <select value={selectedGrade} onChange={handleGradeChange} required>
            <option value="">-- Select Grade --</option>

            {grades.map((grade) => (
              <option key={grade._id} value={grade._id}>
                {grade.name}
              </option>
            ))}
          </select>
        </div>

        <br />

        <div>
          <label>Section:</label>
          <br />
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            required
          >
            <option value="">-- Select Section --</option>

            {sections.map((section) => (
              <option key={section._id} value={section._id}>
                {section.name}
              </option>
            ))}
          </select>
        </div>

        <br />

        <div>
          <label>Month (YYYY-MM):</label>
          <br />
          <input
            type="text"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            placeholder="2025-12"
            required
          />
        </div>

        <br />

        <button type="submit">Get Summary</button>
      </form>

      <br />

      {summary && (
        <div>
          <p>
            <strong>Paid Students:</strong> {summary.paidCount}
          </p>

          <p>
            <strong>Unpaid Students:</strong> {summary.unpaidCount}
          </p>
        </div>
      )}

      {message && <p style={{ color: "red" }}>{message}</p>}
    </div>
  );
}

export default SectionFeeSummaryPage;
