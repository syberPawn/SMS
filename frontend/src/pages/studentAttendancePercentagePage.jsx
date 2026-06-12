import { useEffect, useState, useContext } from "react";
import { fetchAcademicYears } from "../api/academicYear.api";
import { fetchStudentAttendancePercentage } from "../api/attendance.api";
import { AuthContext } from "../context/AuthContext";

const StudentAttendancePercentagePage = () => {
  const { userId } = useContext(AuthContext);

  const [academicYear, setAcademicYear] = useState(null);
  const [percentage, setPercentage] = useState(null);

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
  Resolve Enrollment + Load Percentage
  =====================================
  */
  useEffect(() => {
    if (!academicYear || !userId) return;

    const loadPercentage = async () => {
      try {
        // Fetch enrollment for this student
        const result = await fetchStudentAttendancePercentage(academicYear._id);

        setPercentage(result);
      } catch (error) {
        console.error("Failed to load percentage", error);
        setPercentage(null);
      }
    };

    loadPercentage();
  }, [academicYear, userId]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Attendance Percentage</h2>

      <hr />

      {percentage === null ? (
        <div>No attendance data available.</div>
      ) : (
        <div>
          <strong>Attendance Percentage:</strong> {percentage.toFixed(2)}%
        </div>
      )}
    </div>
  );
};

export default StudentAttendancePercentagePage;
