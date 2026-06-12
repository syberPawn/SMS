import { useContext } from "react";
import { useNavigate, Outlet, NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./AdminLayout.css";

function StudentLayout() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="admin-shell role-student">
      <div className="admin-frame">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <p className="admin-brand-label">Menu</p>
            <h2 className="admin-brand-title">Student</h2>
          </div>

          <nav className="admin-nav">
            <NavLink className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`} to="/student/dashboard">
              Dashboard
            </NavLink>
            <NavLink className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`} to="/student/teachers">
              My Teachers
            </NavLink>
            <NavLink className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`} to="/student/report-card">
              Report Cards
            </NavLink>
            <NavLink className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`} to="/student/fees">
              My Fees
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
              <h2>Student Dashboard</h2>
              <p>Review attendance, reports, fees, and notices.</p>
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

export default StudentLayout;
