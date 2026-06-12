import { useEffect, useState, useContext } from "react";
import { fetchAcademicYears } from "../api/academicYear.api";
import { fetchTeacherAssignments } from "../api/teacherAssignment.api";
import { fetchSectionAttendance } from "../api/attendance.api";
import { AuthContext } from "../context/AuthContext";

const TeacherAttendanceViewPage = () => {
  const { userId } = useContext(AuthContext);

  const [academicYear, setAcademicYear] = useState(null);
  const [sectionId, setSectionId] = useState(null);
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
  Load Teacher Class Assignment
  =====================================
  */
  useEffect(() => {
    if (!academicYear || !userId) return;

    const loadAssignment = async () => {
      try {
        const data = await fetchTeacherAssignments(userId, academicYear._id);

        if (data.classAssignments.length > 0) {
          setSectionId(data.classAssignments[0].sectionId);
        } else {
          setSectionId(null);
        }
      } catch (error) {
        console.error("Failed to load teacher assignment", error);
        setSectionId(null);
      }
    };

    loadAssignment();
  }, [academicYear, userId]);

  /*
  =====================================
  Load Attendance
  =====================================
  */
  useEffect(() => {
    if (!academicYear || !sectionId) {
      setAttendance([]);
      return;
    }

    const loadAttendance = async () => {
      try {
        const data = await fetchSectionAttendance(academicYear._id, sectionId);
        setAttendance(data);
      } catch (error) {
        console.error("Failed to load attendance", error);
        setAttendance([]);
      }
    };

    loadAttendance();
  }, [academicYear, sectionId]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>My Section Attendance</h2>

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
              <div key={entry._id}>
                Student: {entry.enrollmentId?.studentId?.fullName} | Status:{" "}
                {entry.status}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default TeacherAttendanceViewPage;
