# Software Design Document

## System Overview

The School Management System is a role-based web application. The frontend is a React single-page application. The backend is an Express REST API backed by MongoDB through Mongoose.

The backend is organized by domain modules:

- User and authentication
- Academic structure
- Student management
- Teacher management
- Teacher assignment
- Attendance management
- Examination management
- Fee management
- Notice management
- Dashboard analytics

## High-Level Architecture

```text
Browser
  |
  | React SPA, Axios
  v
Frontend at localhost:5173
  |
  | HTTP JSON, Bearer JWT
  v
Express API at localhost:5000
  |
  | Mongoose
  v
MongoDB
```

## Frontend Design

### Application Entry

- `frontend/src/main.jsx` mounts the React application.
- `frontend/src/App.jsx` defines route trees.
- `frontend/src/context/AuthContext.jsx` stores token, role, and user id.
- `frontend/src/routes/ProtectedRoute.jsx` protects routes based on role.

### Route Design

Admin routes are nested under `/admin`:

- Dashboard
- Users
- Academic years
- Grades
- Sections
- Subjects
- Curriculum
- Students
- Student profiles
- Teacher assignments
- Attendance
- Examination
- Fees
- Fee payments
- Fee summary
- Student fees
- Notices

Teacher routes are nested under `/teacher`:

- Dashboard
- Attendance entry
- Attendance view
- Attendance percentage
- Marks entry
- Marks view
- Notices

Student routes are nested under `/student`:

- Dashboard
- Attendance
- Attendance percentage
- Report card
- Teachers
- Fees
- Notices

### API Client Design

The frontend uses module-specific wrappers in `frontend/src/api`.

The central Axios instance:

- Uses base URL `http://localhost:5000`.
- Adds `Authorization: Bearer <token>` when a token exists in `localStorage`.
- Clears local auth state and redirects to `/login` on HTTP 401.

## Backend Design

### Application Entry

`backend/src/app.js`:

- Loads environment variables.
- Connects to MongoDB.
- Configures JSON parsing and CORS.
- Mounts all route modules.
- Starts the Express server.

### Layering Pattern

Most backend modules follow this pattern:

```text
routes -> controllers -> services -> models
                         |
                         -> validations
```

Responsibilities:

| Layer | Responsibility |
| --- | --- |
| Routes | HTTP method and path mapping |
| Controllers | Authentication, role checks, request extraction, response/error mapping |
| Services | Business rules and database operations |
| Models | Mongoose schema and indexes |
| Validations | Joi request validation |

### Authentication and Authorization

Authentication:

- `POST /auth/login` validates username and password.
- Passwords are compared with bcrypt.
- JWT contains `userId` and `role`.
- Token expiration comes from `JWT_EXPIRES_IN`.

Authorization:

- `verifyAuthenticated(req)` extracts and validates the Bearer token.
- `verifyRole(req, allowedRoles)` enforces role access.
- Controllers call these functions directly.

Current role values:

- `ADMIN`
- `TEACHER`
- `STUDENT`

## Domain Modules

### User Module

Purpose:

- Authenticate users.
- Manage user accounts.

Main entity:

- User

Key rules:

- Usernames are unique.
- Password hashes are hidden by default.
- Only admins can create, update, deactivate, view, and list users.
- Deactivated users cannot log in.

### Academic Structure Module

Purpose:

- Configure academic years, grades, sections, subjects, and curriculum mappings.

Main entities:

- AcademicYear
- Grade
- Section
- Subject
- GradeSubjectMapping

Key rules:

- First academic year must be active.
- Only one academic year can be active.
- Academic years cannot overlap.
- Grade name is unique within academic year.
- Section name is unique within grade.
- Subject name and code are unique.
- Subject mapping is unique by grade and subject.
- Grades and sections cannot be deactivated when active dependents exist.

### Student Management Module

Purpose:

- Manage student identity and enrollment.

Main entities:

- Student
- Enrollment

Key rules:

- Admission number is unique.
- Student identity defaults to active.
- Enrollment is unique by student and academic year.
- Active enrollments cannot overlap across overlapping academic years.
- Enrollment status transitions are controlled.
- Enrollment class can be updated only while enrollment is active.

### Teacher Management Module

Purpose:

- Create teacher profiles and related teacher user accounts.

Main entities:

- Teacher
- User

Key rules:

- Teacher has a linked user.
- Teacher user must have role `TEACHER`.
- Teacher profile status is active or inactive.
- Username generation is based on teacher name and uniqueness checks.

### Teacher Assignment Module

Purpose:

- Assign teachers to sections and subjects.

Main entities:

- ClassTeacherAssignment
- SubjectTeacherAssignment

Key rules:

- Class teacher assignment is unique per section and academic year.
- A teacher can be class teacher for only one section per academic year.
- Subject teacher assignment is unique per section, subject, and academic year.
- Assignment requires active academic year, active section, active teacher, and active subject.
- Subject assignment requires active grade-subject mapping.

### Attendance Module

Purpose:

- Record and query attendance.

Main entity:

- AttendanceEntry

Key rules:

- Only assigned class teachers can record attendance.
- Attendance can be recorded only for active academic years and sections.
- Attendance submission must include all active enrollments.
- Attendance status must be `PRESENT` or `ABSENT`.
- Future attendance is rejected.
- Backdated attendance is restricted by service logic.
- Duplicate attendance per academic year, section, enrollment, and date is blocked.

### Examination Module

Purpose:

- Create exams, snapshot curriculum, submit marks, view marks, and generate report cards.

Main entities:

- ExamInstance
- ExamSubjectScope
- ExamMark

Key rules:

- Exam types are `HALF_YEARLY` and `END_TERM`.
- Exam instances are unique by academic year and type.
- Exam creation snapshots active grade-subject mappings.
- Marks can be submitted only by assigned subject teachers.
- Marks must be between 0 and 100.
- Mark submissions must cover expected active enrollments.
- Duplicate marks per exam, enrollment, and subject are blocked.

### Fee Module

Purpose:

- Define monthly fees and record payments.

Main entities:

- MonthlyFees
- PaymentRecords

Key rules:

- Fee structure is unique by grade and academic year.
- Payments are recorded by enrollment and month.
- Duplicate payments for the same enrollment and month are blocked.
- Payment amount must match the configured monthly fee.

### Notice Module

Purpose:

- Publish and manage notices.

Main entity:

- Notice

Key rules:

- Only admins can create, list admin notices, and change status.
- Teachers and students can view active notices.
- Notice priority is `NORMAL` or `URGENT`.
- Notice status is `Active` or `Inactive`.

### Dashboard Analytics Module

Purpose:

- Provide role-specific summaries and drilldowns.

Main outputs:

- Admin overview
- Admin section drilldown
- Teacher dashboard
- Student dashboard

Design note:

- Some controller paths in this module should be reviewed for consistent authentication and role enforcement.

## Backend Route Map

| Base Path | Module |
| --- | --- |
| `/auth` | Authentication |
| `/users` | User management |
| `/academic-years` | Academic years |
| `/grades` | Grades |
| `/sections` | Sections |
| `/subjects` | Subjects |
| `/grade-subject-mappings` | Curriculum mappings |
| `/students` | Student identities and profiles |
| `/enrollments` | Student enrollments |
| `/teachers` | Teacher management |
| `/class-teachers` | Class teacher assignments |
| `/subject-teachers` | Subject teacher assignments |
| `/attendance` | Attendance |
| `/examination` | Examinations and marks |
| `/fees` | Fees and payments |
| `/notices` | Notices |
| `/analytics` | Dashboards and analytics |

## Data Integrity Design

The system combines service validations with MongoDB indexes.

Important unique constraints:

- Academic year name.
- Grade by academic year and name.
- Section by grade and name.
- Subject name and code.
- Grade-subject mapping by grade and subject.
- Student admission number.
- Enrollment by student and academic year.
- Class teacher assignment by academic year and section.
- Class teacher assignment by academic year and teacher.
- Subject teacher assignment by academic year, section, and subject.
- Attendance by academic year, section, enrollment, and attendance date.
- Exam instance by academic year and exam type.
- Exam subject scope by exam instance, grade, and subject.
- Exam mark by exam instance, enrollment, and subject.
- Fee structure by grade and academic year.
- Payment by enrollment and month.

## Error Handling Design

Controllers generally map domain errors to:

- `400` for validation or invalid business state.
- `401` for authentication failure.
- `403` for forbidden access.
- `404` for missing resources.
- `409` for duplicate or conflict cases.
- `500` for unexpected errors.

There is no centralized Express error middleware in the current design. Error mapping is repeated in controllers.

## Security Design

Implemented:

- Password hashing with bcrypt.
- JWT session token.
- Role checks in most controllers.
- Frontend route guards.
- User status enforcement during authentication.

Recommended improvements:

- Move route protection to reusable Express middleware.
- Ensure every analytics endpoint enforces authentication and role authorization.
- Move frontend API base URL to environment configuration.
- Add secure CORS configuration per environment.
- Avoid exposing raw error messages for unexpected server failures.
- Add rate limiting on login.
- Add refresh/logout/session revocation strategy if required.

## Deployment View

Current local development topology:

```text
Frontend Vite dev server: http://localhost:5173
Backend Express server:   http://localhost:5000
MongoDB:                  configured by MONGO_URI
```

No production deployment files are present in the inspected codebase.

## Testing and Quality

Current observed scripts:

- Frontend has `npm run lint`.
- Backend has no test script.
- No automated test suite was found during inspection.

Recommended testing layers:

- Unit tests for service business rules.
- API integration tests for each route module.
- Authorization tests for every role-protected endpoint.
- Frontend smoke tests for login and role dashboards.
- Data integrity tests for duplicate and invalid-state scenarios.

## Known Technical Risks

- Root workspace is not a Git repository.
- Backend route authorization is manually repeated, increasing inconsistency risk.
- Backend analytics controller should be checked for authentication and role checks.
- Frontend stores JWT in `localStorage`, which is simple but exposed to XSS risk.
- API base URL and CORS origin are hardcoded to local development values.
- No backend automated tests are currently configured.
- No centralized logging or request tracing is present.

