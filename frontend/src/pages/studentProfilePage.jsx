import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchStudentProfile } from "../api/student.api";

function StudentProfilePage() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [message, setMessage] = useState("");

  const loadProfile = async () => {
    try {
      const data = await fetchStudentProfile(id);
      setStudent(data);
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message);
      } else {
        setMessage("Error loading profile");
      }
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (message) return <p>{message}</p>;
  if (!student) return <p>Loading...</p>;

  return (
    <div>
      <h2>Student Profile</h2>

      <p>
        <strong>Full Name:</strong> {student.fullName}
      </p>
      <p>
        <strong>Date of Birth:</strong>{" "}
        {new Date(student.dateOfBirth).toLocaleDateString()}
      </p>
      <p>
        <strong>Gender:</strong> {student.gender}
      </p>
      <p>
        <strong>Admission Number:</strong> {student.admissionNumber}
      </p>
      <p>
        <strong>Identity Status:</strong> {student.identityStatus}
      </p>
    </div>
  );
}

export default StudentProfilePage;
