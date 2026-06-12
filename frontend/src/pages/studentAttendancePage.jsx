import { useEffect, useState, useContext } from "react";
import { fetchAcademicYears } from "../api/academicYear.api";
import { fetchStudentAttendance } from "../api/attendance.api";
import { AuthContext } from "../context/AuthContext";

const StudentAttendancePage = () => {
  const { userId } = useContext(AuthContext);

  const [academicYear, setAcademicYear] = useState(null);
  const [attendance, setAttendance] = useState([]);

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
  Load Student Attendance
  =====================================
  */
  useEffect(() => {
    if (!academicYear) {
      setAttendance([]);
      return;
    }

    const loadAttendance = async () => {
      try {
        const data = await fetchStudentAttendance(academicYear._id);

        setAttendance(data);
      } catch (error) {
        console.error("Failed to load attendance", error);
        setAttendance([]);
      }
    };

    loadAttendance();
  }, [academicYear]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>My Attendance</h2>

      <hr />

      {attendance.length === 0 ? (
        <div>No attendance records found.</div>
      ) : (
        Object.entries(
          attendance.reduce((acc, entry) => {
            const dateKey = new Date(entry.date).toLocaleDateString();

            if (!acc[dateKey]) {
              acc[dateKey] = [];
            }

            acc[dateKey].push(entry);
            return acc;
          }, {}),
        ).map(([date, entries]) => (
          <div key={date} style={{ marginBottom: "20px" }}>
            <h4>Date: {date}</h4>

            {entries.map((entry) => (
              <div key={entry._id}>Status: {entry.status}</div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default StudentAttendancePage;
