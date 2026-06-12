import { useEffect, useState } from "react";

import { fetchAcademicYears } from "../api/academicYear.api";
import { fetchGradesByYear } from "../api/grade.api";
import { fetchSectionsByGrade } from "../api/section.api";
import { fetchStudentsByEnrollment } from "../api/enrollment.api";
import { fetchStudentFeeStatus } from "../api/fee.api";

function AdminStudentFeeStatusPage() {
  const [academicYears, setAcademicYears] = useState([]);
  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  const [feeStatus, setFeeStatus] = useState({});
  const [months, setMonths] = useState([]);

  /*
  ===============================
  GENERATE MONTH LIST
  ===============================
  */

  const generateMonths = (startDate, endDate) => {
    const result = [];

    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");

      result.push(`${year}-${month}`);

      current.setMonth(current.getMonth() + 1);
    }

    return result;
  };

  const monthNames = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  /*
  ===============================
  LOAD ACADEMIC YEARS
  ===============================
  */

  const loadAcademicYears = async () => {
    const data = await fetchAcademicYears();

    setAcademicYears(data);

    const activeYear = data.find((y) => y.status === "ACTIVE");

    if (activeYear) {
      setSelectedYear(activeYear._id);

      const generatedMonths = generateMonths(
        activeYear.startDate,
        activeYear.endDate,
      );

      setMonths(generatedMonths);

      loadGrades(activeYear._id);
    }
  };

  /*
  ===============================
  LOAD GRADES
  ===============================
  */

  const loadGrades = async (academicYearId) => {
    const data = await fetchGradesByYear(academicYearId);

    setGrades(data);
  };

  /*
  ===============================
  LOAD SECTIONS
  ===============================
  */

  const loadSections = async (gradeId) => {
    const data = await fetchSectionsByGrade(gradeId);

    setSections(data);
  };

  /*
  ===============================
  LOAD STUDENTS
  ===============================
  */

  const loadStudents = async (sectionId) => {
    const data = await fetchStudentsByEnrollment({
      sectionId,
      academicYearId: selectedYear,
    });

    setStudents(data);

    loadFeesForStudents(data);
  };

  /*
  ===============================
  LOAD FEES
  ===============================
  */

  const loadFeesForStudents = async (studentList) => {
    const results = {};

    await Promise.all(
      studentList.map(async (student) => {
        try {
          const data = await fetchStudentFeeStatus(student.enrollmentId);
          console.log("Fee API response:", data);

          results[student.enrollmentId] = data;
        } catch {
          results[student.enrollmentId] = [];
        }
      }),
    );

    setFeeStatus(results);
  };

  /*
  ===============================
  INITIAL LOAD
  ===============================
  */

  useEffect(() => {
    loadAcademicYears();
  }, []);

  /*
  ===============================
  HANDLERS
  ===============================
  */

  const handleYearChange = (e) => {
    const yearId = e.target.value;

    setSelectedYear(yearId);
    setSelectedGrade("");
    setSelectedSection("");

    const year = academicYears.find((y) => y._id === yearId);

    if (year) {
      const generatedMonths = generateMonths(year.startDate, year.endDate);

      setMonths(generatedMonths);

      loadGrades(yearId);
    }
  };

  const handleGradeChange = (e) => {
    const gradeId = e.target.value;

    setSelectedGrade(gradeId);
    setSelectedSection("");

    loadSections(gradeId);
  };

  const handleSectionChange = (e) => {
    const sectionId = e.target.value;

    setSelectedSection(sectionId);

    loadStudents(sectionId);
  };

  /*
  ===============================
  UI
  ===============================
  */

  return (
    <div>
      <h2>Fee Management</h2>
      <h3>Student Fee Status</h3>

      <div>
        <label>Academic Year:</label>
        <br />

        <select value={selectedYear} onChange={handleYearChange}>
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

        <select value={selectedGrade} onChange={handleGradeChange}>
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

        <select value={selectedSection} onChange={handleSectionChange}>
          <option value="">-- Select Section --</option>

          {sections.map((section) => (
            <option key={section._id} value={section._id}>
              {section.name}
            </option>
          ))}
        </select>
      </div>

      <br />

      {students.length > 0 && (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Student</th>

              {months.map((m) => {
                const monthNumber = Number(m.split("-")[1]);

                return <th key={m}>{monthNames[monthNumber]}</th>;
              })}
            </tr>
          </thead>

          <tbody>
            {students.map((student) => {
              const studentFees = feeStatus[student.enrollmentId] || [];

              return (
                <tr key={student.enrollmentId}>
                  <td>{student.fullName}</td>

                  {months.map((month) => {
                    const record = studentFees.find((f) => f.month === month);

                    return (
                      <td key={month}>{record ? record.status : "UNPAID"}</td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminStudentFeeStatusPage;
