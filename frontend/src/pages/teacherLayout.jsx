import { useContext, useEffect, useState } from "react";
import { useNavigate, Outlet, NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { fetchAcademicYears } from "../api/academicYear.api";
import { fetchTeacherAssignments } from "../api/teacherAssignment.api";
import "./AdminLayout.css";

function TeacherLayout() {
  const { logout, userId } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showAttendanceLinks, setShowAttendanceLinks] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadAssignmentAccess = async () => {
      if (!userId) {
        setShowAttendanceLinks(false);
        return;
      }

      try {
        const years = await fetchAcademicYears({ status: "ACTIVE" });
        const activeYear = years[0];

        if (!activeYear?._id) {
          if (isMounted) setShowAttendanceLinks(false);
          return;
        }

        const assignments = await fetchTeacherAssignments(userId, activeYear._id);
        if (isMounted) {
          setShowAttendanceLinks((assignments.classAssignments || []).length > 0);
        }
      } catch (error) {
        console.error("Failed to resolve teacher attendance access", error);
        if (isMounted) setShowAttendanceLinks(false);
      }
    };

    loadAssignmentAccess();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="admin-shell role-teacher">
      <div className="admin-frame">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <p className="admin-brand-label">Menu</p>
            <h2 className="admin-brand-title">Teacher</h2>
          </div>

          <nav className="admin-nav">
            <NavLink className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`} to="/teacher/dashboard">
              Dashboard
            </NavLink>
            {showAttendanceLinks && (
              <NavLink className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`} to="/teacher/attendance" end>
                Attendance
              </NavLink>
            )}
            <NavLink className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`} to="/teacher/marks" end>
              Marks
            </NavLink>
          </nav>

          <div className="admin-sidebar-footer">
            <button className="admin-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </aside>

        <main className="admin-main">
          <div className="admin-topbar">
            <div>
              <h2>Teacher Dashboard</h2>
              <p>Manage attendance, marks, notices, and class activity.</p>
            </div>
          </div>
          <div className="admin-main-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default TeacherLayout;
