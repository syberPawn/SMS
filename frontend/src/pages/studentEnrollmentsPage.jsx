import { useEffect, useState } from "react";
import { fetchAcademicYears } from "../api/academicYear.api";
import { fetchGradesByYear } from "../api/grade.api";
import { fetchSectionsByGrade } from "../api/section.api";
import {
  fetchStudentsByEnrollment,
  updateEnrollmentStatus,
} from "../api/enrollment.api";

function StudentEnrollmentsPage({ embedded = false }) {
  const [years, setYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState("");

  const [grades, setGrades] = useState([]);
  const [selectedGradeId, setSelectedGradeId] = useState("");

  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const [message, setMessage] = useState("");

  const [searchName, setSearchName] = useState("");
  const [searchAdmissionNumber, setSearchAdmissionNumber] = useState("");
  const [enrollmentList, setEnrollmentList] = useState([]);

  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showNameDropdown, setShowNameDropdown] = useState(false);

  const [admissionSuggestions, setAdmissionSuggestions] = useState([]);
  const [showAdmissionDropdown, setShowAdmissionDropdown] = useState(false);

  const [baseEnrollmentList, setBaseEnrollmentList] = useState([]);

  const [globalSearch, setGlobalSearch] = useState("");
  const [globalSuggestions, setGlobalSuggestions] = useState([]);
  const [showGlobalDropdown, setShowGlobalDropdown] = useState(false);

  //SMART SEARCH ADMISSION AND NAME

  useEffect(() => {
    if (!globalSearch.trim()) {
      setGlobalSuggestions([]);
      return;
    }

    const value = globalSearch.toLowerCase();

    const filtered = baseEnrollmentList.filter(
      (item) =>
        item.fullName.toLowerCase().includes(value) ||
        item.admissionNumber.toLowerCase().includes(value),
    );

    setGlobalSuggestions(filtered);
  }, [globalSearch, baseEnrollmentList]);

  //LIST SEARCHING
  useEffect(() => {
    if (!searchName.trim()) {
      setNameSuggestions([]);
      return;
    }

    const filtered = baseEnrollmentList.filter((item) =>
      item.fullName.toLowerCase().includes(searchName.toLowerCase()),
    );

    setNameSuggestions(filtered);
  }, [searchName, enrollmentList]);

  useEffect(() => {
    if (!searchAdmissionNumber.trim()) {
      setAdmissionSuggestions([]);
      return;
    }

    const filtered = baseEnrollmentList.filter((item) =>
      item.admissionNumber
        .toLowerCase()
        .includes(searchAdmissionNumber.toLowerCase()),
    );

    setAdmissionSuggestions(filtered);
  }, [searchAdmissionNumber, enrollmentList]);

  const loadEnrollmentList = async (overrideParams = {}) => {
    try {
      const params = {
        academicYearId: selectedYearId,
        ...overrideParams, // 👈 override when needed
      };

      if (selectedSectionId) {
        params.sectionId = selectedSectionId;
      }

      // only use state if override not provided
      if (!overrideParams.name && searchName) {
        params.name = searchName;
      }

      if (!overrideParams.admissionNumber && searchAdmissionNumber) {
        params.admissionNumber = searchAdmissionNumber;
      }

      const data = await fetchStudentsByEnrollment(params);
      setEnrollmentList(data);

      // store base list ONLY if it's initial load (no search)
      if (!overrideParams.name && !overrideParams.admissionNumber) {
        setBaseEnrollmentList(data);
      }
    } catch (error) {
      console.error("Failed to load enrollment list");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadEnrollmentList();
  };

  const handleStatusChange = async (enrollmentId, newStatus) => {
    try {
      await updateEnrollmentStatus(enrollmentId, newStatus);
      loadEnrollmentList();
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert("Error updating status");
      }
    }
  };

  /*
  =====================================
  Load Academic Years
  =====================================
  */
  const loadAcademicYears = async () => {
    try {
      const data = await fetchAcademicYears();
      setYears(data);

      const activeYear = data.find((y) => y.status === "ACTIVE");

      if (activeYear) {
        setSelectedYearId(activeYear._id);
        loadGrades(activeYear._id);

        loadEnrollmentList({ academicYearId: activeYear._id });
      }
    } catch (error) {
      console.error("Failed to load academic years");
    }
  };

  /*
  =====================================
  Load Grades by Year
  =====================================
  */
  const loadGrades = async (yearId) => {
    try {
      const data = await fetchGradesByYear(yearId);
      setGrades(data);
      setSections([]);
      setSelectedGradeId("");
      setSelectedSectionId("");
    } catch (error) {
      console.error("Failed to load grades");
    }
  };

  /*
  =====================================
  Load Sections by Grade
  =====================================
  */
  const loadSections = async (gradeId) => {
    try {
      const data = await fetchSectionsByGrade(gradeId);
      setSections(data);
      setSelectedSectionId("");
    } catch (error) {
      console.error("Failed to load sections");
    }
  };

  useEffect(() => {
    loadAcademicYears();
  }, []);

  /*
  =====================================
  Handlers
  =====================================
  */
  const handleYearChange = (e) => {
    const yearId = e.target.value;
    setSelectedYearId(yearId);
    loadGrades(yearId);
  };

  const handleGradeChange = (e) => {
    const gradeId = e.target.value;
    setSelectedGradeId(gradeId);
    loadSections(gradeId);
  };

  return (
    <div>
      {!embedded && <h2>Student Enrollment Management</h2>}

      <h3>Student Enrollment List</h3>

      <form onSubmit={handleSearch}>
        <div>
          <label>Search Student (Name or Admission No):</label>
          <br />
          <div style={{ position: "relative", width: "300px" }}>
            <input
              type="text"
              value={globalSearch}
              placeholder="Type name or admission number..."
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setShowGlobalDropdown(true);
              }}
              onFocus={() => setShowGlobalDropdown(true)}
              onBlur={() => setShowGlobalDropdown(false)}
            />

            {showGlobalDropdown && globalSuggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  border: "1px solid #ccc",
                  background: "#fff",
                  maxHeight: "200px",
                  overflowY: "auto",
                  zIndex: 1000,
                }}
              >
                {globalSuggestions.map((item) => (
                  <div
                    key={item.studentId}
                    onMouseDown={() => {
                      const inputValue = globalSearch.toLowerCase();

                      setGlobalSearch(
                        `${item.fullName} (${item.admissionNumber})`,
                      );
                      setShowGlobalDropdown(false);

                      if (
                        item.admissionNumber.toLowerCase().includes(inputValue)
                      ) {
                        loadEnrollmentList({
                          admissionNumber: item.admissionNumber,
                        });
                      } else {
                        loadEnrollmentList({
                          name: item.fullName,
                        });
                      }
                    }}
                    style={{ padding: "8px", cursor: "pointer" }}
                  >
                    {item.fullName} ({item.admissionNumber})
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <br />

        

        <br />

      </form>

      <br />

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Name</th>
            <th>Admission Number</th>
            <th>Section</th>
            <th>Enrollment Status</th>
            <th>Identity Status</th>
            <th>Profile</th>
          </tr>
        </thead>
        <tbody>
          {enrollmentList.map((item) => (
            <tr key={item.studentId}>
              <td>{item.fullName}</td>
              <td>{item.admissionNumber}</td>
              <td>{item.sectionName || "N/A"}</td>
              <td>
                <select
                  value={item.enrollmentStatus}
                  onChange={(e) =>
                    handleStatusChange(item.enrollmentId, e.target.value)
                  }
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PROMOTED">PROMOTED</option>
                  <option value="REPEATING">REPEATING</option>
                  <option value="WITHDRAWN">WITHDRAWN</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </td>
              <td>{item.identityStatus}</td>
              <td>
                <a href={`/admin/students/${item.studentId}`}>View</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {message && <p style={{ color: "blue" }}>{message}</p>}
    </div>
  );
}

export default StudentEnrollmentsPage;
