import { useEffect, useState } from "react";

import { fetchAcademicYears } from "../api/academicYear.api";
import { fetchGradesByYear } from "../api/grade.api";
import { fetchSectionsByGrade } from "../api/section.api";
import { fetchStudentsByEnrollment } from "../api/enrollment.api";

import { recordPayment } from "../api/fee.api";

function FeePaymentPage() {
  const [academicYears, setAcademicYears] = useState([]);
  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedEnrollment, setSelectedEnrollment] = useState("");

  const [month, setMonth] = useState("");
  const [amount, setAmount] = useState("");

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

  const loadStudents = async (sectionId) => {
    try {
      const data = await fetchStudentsByEnrollment({
        academicYearId: selectedYear,
        sectionId: sectionId,
      });

      setStudents(data);
    } catch (error) {
      console.error("Failed to load students", error);
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
    setSelectedEnrollment("");

    if (yearId) {
      loadGrades(yearId);
    }
  };

  const handleGradeChange = (e) => {
    const gradeId = e.target.value;
    setSelectedGrade(gradeId);
    setSelectedSection("");
    setSelectedEnrollment("");

    if (gradeId) {
      loadSections(gradeId);
    }
  };

  const handleSectionChange = (e) => {
    const sectionId = e.target.value;
    setSelectedSection(sectionId);
    setSelectedEnrollment("");

    if (sectionId) {
      loadStudents(sectionId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await recordPayment({
        enrollmentId: selectedEnrollment,
        month,
        amount: Number(amount),
      });

      setMessage("Payment recorded successfully");

      setMonth("");
      setAmount("");
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message);
      } else {
        setMessage("Error recording payment");
      }
    }
  };

  return (
    <div>
      <h2>Fee Management</h2>

      <h3>Record Student Payment</h3>

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
            onChange={handleSectionChange}
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
          <label>Student:</label>
          <br />
          <select
            value={selectedEnrollment}
            onChange={(e) => setSelectedEnrollment(e.target.value)}
            required
          >
            <option value="">-- Select Student --</option>

            {students.map((student) => (
              <option key={student.enrollmentId} value={student.enrollmentId}>
                {student.fullName}
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
            placeholder="2025-06"
            required
          />
        </div>

        <br />

        <div>
          <label>Amount:</label>
          <br />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <br />

        <button type="submit">Record Payment</button>
      </form>

      {message && <p style={{ color: "blue" }}>{message}</p>}
    </div>
  );
}

export default FeePaymentPage;
