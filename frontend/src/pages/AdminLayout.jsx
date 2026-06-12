import { useContext } from "react";
import { useNavigate, Outlet, NavLink, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./AdminLayout.css";

const adminPageCopy = {
  "/admin/dashboard": ["Admin Dashboard", "Overview of the current school data."],
  "/admin/teacher-assignments": ["Teachers", "Manage teacher records and assignments."],
  "/admin/students": ["Students", "Manage student identities and enrollment details."],
  "/admin/attendance": ["Attendance", "Track attendance, history, and section performance."],
  "/admin/fees": ["Fees", "Record payments and define fee structures."],
  "/admin/subjects": ["Subjects", "Define subjects and assign them to classes."],
  "/admin/users": ["Users", "Manage user accounts and role access."],
  "/admin/academic-years": ["Academic Year", "Configure academic years, grades, and sections."],
  "/admin/grades": ["Grades", "Review and create grade records."],
  "/admin/sections": ["Sections", "Manage class sections for each grade."],
  "/admin/examination": ["Exams", "Create exam instances and review performance."],
  "/admin/curriculum": ["Curriculum", "Map subjects to grade-level curriculum."],
  "/admin/fee-payments": ["Fee Payments", "Record student fee payments."],
  "/admin/student-fees": ["Student Fees", "Review month-wise student fee status."],
  "/admin/fee-summary": ["Fee Summary", "Review fee payment summaries by section."],
  "/admin/notices": ["Notices", "Create and manage school notices."],
};

const statCardRoutes = {
  Students: "/admin/students",
  Teachers: "/admin/teacher-assignments",
};

function AdminLayout() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [pageTitle, pageDescription] = location.pathname.startsWith("/admin/students/")
    ? ["Student Profile", "Review student profile and enrollment details."]
    : adminPageCopy[location.pathname] || ["Admin Dashboard", "Administrative workspace."];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleAdminContentClick = (event) => {
    const statCard = event.target.closest(
      [
        ".admin-stat-card",
        ".teacher-stat-card",
        ".student-stat-card",
        ".academic-years-stat-card",
        ".attendance-stat-card",
        ".subjects-stat-card",
        ".fees-stat-card",
        ".exams-stat-card",
        ".users-stat-card",
      ].join(", "),
    );

    if (!statCard) {
      return;
    }

    const label = statCard.querySelector("p")?.textContent?.trim();
    const route = statCardRoutes[label];

    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="admin-shell role-admin">
      <div className="admin-frame">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <p className="admin-brand-label">Menu</p>
            <h2 className="admin-brand-title">Admin</h2>
          </div>

          <nav className="admin-nav">
            {[
              ["/admin/dashboard", "Dashboard"],
              ["/admin/teacher-assignments", "Teachers"],
              ["/admin/students", "Students"],
              ["/admin/attendance", "Attendance"],
              ["/admin/fees", "Fees"],
              ["/admin/subjects", "Subjects"],
              ["/admin/users", "Users"],
              ["/admin/academic-years", "Academic Year"],
              ["/admin/examination", "Exams"],
            ].map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `admin-nav-link${isActive ? " active" : ""}`
                }
              >
                {label}
              </NavLink>
            ))}
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
              <h2>{pageTitle}</h2>
              <p>{pageDescription}</p>
            </div>
          </div>

          <div className="admin-main-content" onClick={handleAdminContentClick}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
