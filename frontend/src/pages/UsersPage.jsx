import { useEffect, useMemo, useState } from "react";
import { fetchAcademicYears } from "../api/academicYear.api";
import { fetchAdminOverview } from "../api/analytics.api";
import { fetchStudentsByEnrollment } from "../api/enrollment.api";
import { fetchGradesByYear } from "../api/grade.api";
import { fetchSectionsByGrade } from "../api/section.api";
import { fetchStudents } from "../api/student.api";
import { fetchTeachers } from "../api/teacher.api";
import {
  deactivateUser,
  fetchAllUsers,
  updateUser,
} from "../api/user.api";
import "./usersManagementPage.css";

const formatDate = (value) =>
  value ? new Date(value).toISOString().slice(0, 10).replace(/-/g, "") : "N/A";

const buildUserAvatar = (label = "U") =>
  label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

function UsersPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [users, setUsers] = useState([]);
  const [overview, setOverview] = useState(null);
  const [teacherProfiles, setTeacherProfiles] = useState([]);
  const [studentProfiles, setStudentProfiles] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [sectionsMeta, setSectionsMeta] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [filters, setFilters] = useState({
    role: "ALL",
    status: "ALL",
  });

  const statCards = useMemo(() => {
    const totalStudents = overview?.totalActiveStudents || 0;
    const totalTeachers = overview?.totalActiveTeachers || 0;
    const presentToday = overview?.totalPresentStudents ?? 0;
    const absentToday = Math.max(totalStudents - presentToday, 0);

    return [
      { label: "Students", value: String(totalStudents).padStart(4, "0"), toneClass: "purple" },
      { label: "Teachers", value: String(totalTeachers).padStart(3, "0"), toneClass: "gold" },
      { label: "Present Today", value: String(presentToday).padStart(4, "0"), toneClass: "purple" },
      { label: "Absent", value: String(absentToday).padStart(4, "0"), toneClass: "gold" },
    ];
  }, [overview]);

  const studentProfileMap = useMemo(() => {
    const enrollmentMap = new Map(enrollments.map((entry) => [String(entry.studentId), entry]));
    const sectionMap = new Map(sectionsMeta.map((section) => [String(section._id), section]));
    const result = new Map();

    studentProfiles.forEach((student) => {
      const enrollment = enrollmentMap.get(String(student._id)) || null;
      const sectionMeta = enrollment ? sectionMap.get(String(enrollment.sectionId)) || null : null;

      result.set(String(student.userId), {
        ...student,
        enrollment,
        sectionMeta,
      });
    });

    return result;
  }, [enrollments, sectionsMeta, studentProfiles]);

  const teacherProfileMap = useMemo(
    () => new Map(teacherProfiles.map((teacher) => [String(teacher.userId), teacher])),
    [teacherProfiles],
  );

  const enrichedUsers = useMemo(
    () =>
      users.map((user) => ({
        ...user,
        teacherProfile: teacherProfileMap.get(String(user._id)) || null,
        studentProfile: studentProfileMap.get(String(user._id)) || null,
      })),
    [studentProfileMap, teacherProfileMap, users],
  );

  const filteredUsers = useMemo(() => {
    return enrichedUsers.filter((user) => {
      if (filters.role !== "ALL" && user.role !== filters.role) {
        return false;
      }

      if (filters.status !== "ALL" && user.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [enrichedUsers, filters]);

  const selectedUserProfile = useMemo(() => {
    if (!selectedUser) {
      return null;
    }

    return enrichedUsers.find((user) => user._id === selectedUser._id) || selectedUser;
  }, [enrichedUsers, selectedUser]);

  useEffect(() => {
    const bootstrapPage = async () => {
      setLoading(true);

      try {
        const years = await fetchAcademicYears({ status: "ACTIVE" });
        const activeYear = years[0] || null;

        const [usersData, overviewData, teachersData, studentsData, enrollmentData] =
          await Promise.all([
            fetchAllUsers(),
            fetchAdminOverview(today, activeYear?._id),
            fetchTeachers(activeYear?._id ? { academicYearId: activeYear._id } : {}),
            fetchStudents(),
            activeYear?._id
              ? fetchStudentsByEnrollment({ academicYearId: activeYear._id })
              : Promise.resolve([]),
          ]);

        let sectionsData = [];

        if (activeYear?._id) {
          const gradesData = await fetchGradesByYear(activeYear._id);
          const sectionGroups = await Promise.all(
            gradesData.map(async (grade) => {
              const sections = await fetchSectionsByGrade(grade._id);
              return sections.map((section) => ({
                ...section,
                gradeName: grade.name,
              }));
            }),
          );
          sectionsData = sectionGroups.flat();
        }

        setUsers(usersData);
        setOverview(overviewData);
        setTeacherProfiles(teachersData);
        setStudentProfiles(studentsData);
        setEnrollments(enrollmentData);
        setSectionsMeta(sectionsData);
      } catch (error) {
        console.error("Failed to load users workspace", error);
        setFeedback({
          type: "error",
          message: "Failed to load the user workspace.",
        });
      } finally {
        setLoading(false);
      }
    };

    bootstrapPage();
  }, [today]);

  const handleDeactivate = async (userId) => {
    setSaving(`deactivate-${userId}`);
    setFeedback({ type: "", message: "" });

    try {
      await deactivateUser(userId);
      setUsers((current) =>
        current.map((user) =>
          user._id === userId ? { ...user, status: "INACTIVE" } : user,
        ),
      );
      setFeedback({
        type: "success",
        message: "User deactivated successfully.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "Failed to deactivate user.",
      });
    } finally {
      setSaving("");
    }
  };

  const handleReactivate = async (userId) => {
    setSaving(`activate-${userId}`);
    setFeedback({ type: "", message: "" });

    try {
      await updateUser(userId, { status: "ACTIVE" });
      setUsers((current) =>
        current.map((user) =>
          user._id === userId ? { ...user, status: "ACTIVE" } : user,
        ),
      );
      setFeedback({
        type: "success",
        message: "User activated successfully.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "Failed to activate user.",
      });
    } finally {
      setSaving("");
    }
  };

  const handlePasswordUpdate = async (userId) => {
    const newPassword = prompt("Enter new password:");

    if (!newPassword) {
      return;
    }

    setSaving(`password-${userId}`);
    setFeedback({ type: "", message: "" });

    try {
      await updateUser(userId, { password: newPassword });
      setFeedback({
        type: "success",
        message: "Password updated successfully.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "Failed to update password.",
      });
    } finally {
      setSaving("");
    }
  };

  const renderProfileCard = (user) => {
    if (!user) {
      return null;
    }

    if (user.role === "TEACHER" && user.teacherProfile) {
      const teacher = user.teacherProfile;
      const qualification = teacher.qualificationDetail
        ? `${teacher.highestQualification} - ${teacher.qualificationDetail}`
        : teacher.highestQualification;
      const assignedSubjects = teacher.subjectAssignments?.length
        ? teacher.subjectAssignments.map((item) => item.subjectName).filter(Boolean).join(", ")
        : "None";
      const classTeacherCopy = teacher.classTeacherAssignment?.classDisplayName
        ? `Assigned Class Teacher for ${teacher.classTeacherAssignment.classDisplayName}`
        : 'Assigned as class teacher "otherwise - default : Subject Teacher"';

      return (
        <div className="users-profile-card teacher">
          <div className="users-profile-head">
            <div className="users-profile-avatar">
              {buildUserAvatar(teacher.fullName || user.username)}
            </div>
            <div>
              <strong>{teacher.fullName || user.username}</strong>
              <span>{`Role : ${user.role}`}</span>
            </div>
          </div>

          <div className="users-profile-copy">
            <p>{`Qualification : ${qualification || "N/A"}`}</p>
            <p>{classTeacherCopy}</p>
            <p>{`Assigned Subjects : ${assignedSubjects}`}</p>
          </div>
        </div>
      );
    }

    if (user.role === "STUDENT" && user.studentProfile) {
      const student = user.studentProfile;
      const enrollment = student.enrollment;
      const sectionMeta = student.sectionMeta;

      return (
        <div className="users-profile-card student">
          <div className="users-profile-head">
            <div className="users-profile-avatar">
              {buildUserAvatar(student.fullName || user.username)}
            </div>
            <div>
              <strong>{student.fullName || user.username}</strong>
              <span>{`Role : ${user.role}`}</span>
            </div>
          </div>

          <div className="users-profile-copy">
            <p>{`DOB : ${formatDate(student.dateOfBirth)}`}</p>
            <p>{`Class : ${sectionMeta?.gradeName || "N/A"}`}</p>
            <p>{`Section : ${sectionMeta?.name || enrollment?.sectionName || "N/A"}`}</p>
            <p>{`Admission Number : ${student.admissionNumber || "N/A"}`}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="users-profile-card generic">
        <div className="users-profile-head">
          <div className="users-profile-avatar">{buildUserAvatar(user.username)}</div>
          <div>
            <strong>{user.username}</strong>
            <span>{`Role : ${user.role}`}</span>
          </div>
        </div>
        <div className="users-profile-copy">
          <p>{`Username : ${user.username}`}</p>
          <p>{`Status : ${user.status}`}</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="users-empty">Loading user workspace...</div>;
  }

  return (
    <div className="users-dashboard">
      <div className="users-main">
        <section className="users-stat-grid">
          {statCards.map((card) => (
            <article className={`users-stat-card ${card.toneClass}`} key={card.label}>
              <span className="users-stat-plus">+</span>
              <h3>{card.value}</h3>
              <p>{card.label}</p>
            </article>
          ))}
        </section>

        <section className="users-panel-card">
          <div className="users-panel-head">
            <h3>User Management</h3>
            <div className="users-filters">
              <label>
                <span>Role</span>
                <select
                  value={filters.role}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, role: event.target.value }))
                  }
                >
                  <option value="ALL">All</option>
                  <option value="ADMIN">Admin</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="STUDENT">Student</option>
                </select>
              </label>
              <label>
                <span>Status</span>
                <select
                  value={filters.status}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, status: event.target.value }))
                  }
                >
                  <option value="ALL">All</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>
            </div>
          </div>

          {feedback.message ? (
            <p className={`users-feedback ${feedback.type}`}>{feedback.message}</p>
          ) : null}

          <div className="users-table-shell">
            <div className="users-table-head">
              <span>UserName</span>
              <span>Role</span>
              <span>Status</span>
              <span>Action</span>
            </div>

            <div className="users-table-scroll">
              {filteredUsers.map((user) => (
                <article
                  className="users-table-row"
                  key={user._id}
                  onClick={() => setSelectedUser(user)}
                >
                  <span>{user.username}</span>
                  <span>{user.role}</span>
                  <span>{user.status}</span>
                  <div className="users-row-actions" onClick={(event) => event.stopPropagation()}>
                    {user.status === "ACTIVE" ? (
                      <button
                        type="button"
                        onClick={() => handleDeactivate(user._id)}
                        disabled={saving === `deactivate-${user._id}`}
                      >
                        {saving === `deactivate-${user._id}` ? "..." : "Deactivate"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleReactivate(user._id)}
                        disabled={saving === `activate-${user._id}`}
                      >
                        {saving === `activate-${user._id}` ? "..." : "Activate"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handlePasswordUpdate(user._id)}
                      disabled={saving === `password-${user._id}`}
                    >
                      {saving === `password-${user._id}` ? "..." : "Password"}
                    </button>
                  </div>
                </article>
              ))}

              {filteredUsers.length === 0 ? (
                <div className="users-empty compact">No users match the current filters.</div>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <aside className="users-side">
        <section className="users-panel-card">
          <div className="users-panel-head">
            <h3>User Profile</h3>
          </div>
          {selectedUserProfile ? (
            renderProfileCard(selectedUserProfile)
          ) : (
            <div className="users-empty compact">Select a user to preview their profile.</div>
          )}
        </section>
      </aside>

      {selectedUserProfile ? (
        <div className="users-modal-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="users-modal" onClick={(event) => event.stopPropagation()}>
            <div className="users-modal-head">
              <h3>User Profile</h3>
              <button type="button" onClick={() => setSelectedUser(null)}>
                Close
              </button>
            </div>
            {renderProfileCard(selectedUserProfile)}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default UsersPage;
