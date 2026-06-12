import { useEffect, useState, useContext } from "react";
import { fetchAcademicYears } from "../api/academicYear.api";
import { fetchTeacherAssignments } from "../api/teacherAssignment.api";
import { fetchSectionAttendancePercentage } from "../api/attendance.api";
import { AuthContext } from "../context/AuthContext";

const TeacherSectionPercentagePage = () => {
  const { userId } = useContext(AuthContext);

  const [academicYear, setAcademicYear] = useState(null);
  const [sectionId, setSectionId] = useState(null);
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
  Load Section Percentage
  =====================================
  */
  useEffect(() => {
    if (!academicYear || !sectionId) {
      setPercentage(null);
      return;
    }

    const loadPercentage = async () => {
      try {
        const result = await fetchSectionAttendancePercentage(
          sectionId,
          academicYear._id,
        );

        setPercentage(result);
      } catch (error) {
        console.error("Failed to load section percentage", error);
        setPercentage(null);
      }
    };

    loadPercentage();
  }, [academicYear, sectionId]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>My Section Attendance Percentage</h2>

      <hr />

      {percentage === null ? (
        <div>No attendance data available.</div>
      ) : (
        <div>
          <strong>Section Attendance Percentage:</strong>{" "}
          {percentage.toFixed(2)}%
        </div>
      )}
    </div>
  );
};

export default TeacherSectionPercentagePage;
