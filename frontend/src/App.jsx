import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminLayout from "./pages/AdminLayout";
import UsersPage from "./pages/UsersPage";
import AcademicYearsPage from "./pages/AcademicYearsPage";
import GradesPage from "./pages/GradesPage";
import SectionsPage from "./pages/SectionsPage";
import SubjectsPage from "./pages/SubjectsPage";
import CurriculumPage from "./pages/CurriculumPage";
import StudentIdentitiesPage from "./pages/StudentIdentitiesPage";
import StudentProfilePage from "./pages/StudentProfilePage";
import TeacherManagementPage from "./pages/TeacherManagementPage";
import TeacherLayout from "./pages/TeacherLayout";
import TeacherAttendancePage from "./pages/TeacherAttendancePage";
import AdminAttendancePage from "./pages/adminAttendancePage";
import TeacherAttendanceViewPage from "./pages/TeacherAttendanceViewPage";
import StudentLayout from "./pages/StudentLayout";
import StudentAttendancePage from "./pages/StudentAttendancePage";
import StudentAttendancePercentagePage from "./pages/studentAttendancePercentagePage";
import TeacherSectionPercentagePage from "./pages/TeacherSectionPercentagePage";
import ExaminationPage from "./pages/examinationPage";
import TeacherMarksPage from "./pages/TeacherMarksPage";
import TeacherMarksViewPage from "./pages/TeacherMarksViewPage";
import StudentReportCardPage from "./pages/StudentReportCardPage";
import FeeStructurePage from "./pages/feeStructurePage";
import FeePaymentPage from "./pages/feePaymentPage";
import StudentFeesPage from "./pages/studentFeesPage";
import SectionFeeSummaryPage from "./pages/sectionFeeSummaryPage";
import AdminStudentFeeStatusPage from "./pages/adminStudentFeeStatusPage";
import AdminNoticesPage from "./pages/adminNoticesPage";
import TeacherNoticesPage from "./pages/teacherNoticesPage";
import StudentNoticesPage from "./pages/studentNoticesPage";
import AdminDashboardPage from "./pages/adminDashboardPage";
import TeacherDashboardPage from "./pages/teacherDashboardPage";
import StudentDashboardPage from "./pages/studentDashboardPage";
import StudentTeachersPage from "./pages/studentTeachersPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Admin Layout Route */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="academic-years" element={<AcademicYearsPage />} />
        <Route path="grades" element={<GradesPage />} />
        <Route path="sections" element={<SectionsPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="curriculum" element={<CurriculumPage />} />
        <Route path="students" element={<StudentIdentitiesPage />} />
        <Route
          path="enrollments"
          element={<Navigate to="/admin/students" replace />}
        />
        <Route path="teacher-assignments" element={<TeacherManagementPage />} />
        <Route path="students/:id" element={<StudentProfilePage />} />
        <Route path="attendance" element={<AdminAttendancePage />} />
        <Route path="examination" element={<ExaminationPage />} />
        <Route path="fees" element={<FeeStructurePage />} />
        <Route path="fee-payments" element={<FeePaymentPage />} />
        <Route path="fee-summary" element={<SectionFeeSummaryPage />} />
        <Route path="student-fees" element={<AdminStudentFeeStatusPage />} />
        <Route path="notices" element={<AdminNoticesPage />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
      </Route>

      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={["TEACHER"]}>
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/teacher/dashboard" replace />} />
        <Route path="attendance" element={<TeacherAttendancePage />} />{" "}
        <Route path="attendance/view" element={<TeacherAttendanceViewPage />} />{" "}
        <Route
          path="attendance/percentage"
          element={<TeacherSectionPercentagePage />}
        />
        <Route path="marks" element={<TeacherMarksPage />} />
        <Route path="marks/view" element={<TeacherMarksViewPage />} />
        <Route path="notices" element={<TeacherNoticesPage />} />
        <Route path="dashboard" element={<TeacherDashboardPage />} />
      </Route>

      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="attendance" element={<StudentAttendancePage />} />
        <Route
          path="attendance/percentage"
          element={<StudentAttendancePercentagePage />}
        />
        <Route path="report-card" element={<StudentReportCardPage />} />
        <Route path="teachers" element={<StudentTeachersPage />} />
        <Route path="fees" element={<StudentFeesPage />} />
        <Route path="notices" element={<StudentNoticesPage />} />
        <Route path="dashboard" element={<StudentDashboardPage />} />
      </Route>

      <Route path="/" element={<Login />} />
      <Route
        path="/admin/grades"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="users" element={<UsersPage />} />
        <Route path="academic-years" element={<AcademicYearsPage />} />
        <Route path="grades" element={<GradesPage />} />
      </Route>
    </Routes>
  );
}

export default App;
