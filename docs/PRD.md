# Product Requirements Document

## Product Name

School Management System

## Purpose

The School Management System centralizes day-to-day school administration for administrators, teachers, and students. It supports academic setup, user and profile management, enrollment, teacher assignment, attendance, examination marks, report cards, fees, notices, and dashboard analytics.

## Goals

- Provide administrators with a single interface to configure academic years, grades, sections, subjects, curriculum, users, students, teachers, fees, notices, and reports.
- Allow teachers to manage class attendance, enter subject marks, view assigned class/subject responsibilities, and consume relevant notices.
- Allow students to view their attendance, marks/report card, teachers, fee status, notices, and dashboard summary.
- Preserve academic-year boundaries across grades, sections, enrollments, assignments, fees, attendance, examinations, and notices.
- Enforce role-based access across the system.

## User Roles

| Role | Description |
| --- | --- |
| Admin | Manages school setup, users, students, teachers, curriculum, fees, notices, attendance views, examinations, and dashboards. |
| Teacher | Records attendance for assigned class sections, submits marks for assigned subjects, views marks/attendance history, notices, and dashboard data. |
| Student | Views personal academic, attendance, fee, notice, teacher, and dashboard information. |

## In Scope

### Authentication and Authorization

- Login using username and password.
- JWT-based authenticated API access.
- Role-based frontend route protection.
- Role-based backend access checks.
- Deactivated accounts cannot authenticate.

### Academic Administration

- Admin creates users with roles `ADMIN`, `TEACHER`, or `STUDENT`.
- Admin creates academic years, grades, sections, subjects, and curriculum mappings.
- First academic year must be active.
- Only one academic year can be active at a time.
- Academic years cannot overlap.
- Grades, sections, subjects, and mappings support active/inactive lifecycle rules.
- Admin can copy curriculum mappings between academic years.

### Student Management

- Admin creates student identities.
- Admin can onboard a student with identity and enrollment together.
- Admission number must be unique.
- Student identity status defaults to active.
- Admin can update selected identity fields and deactivate identities.
- Admin can create student enrollments for academic years and sections.
- Enrollment is unique per student per academic year.
- Enrollment status uses controlled transitions.

### Teacher Management and Assignment

- Admin creates teacher profiles and linked teacher user accounts.
- Admin lists teachers.
- Admin assigns one class teacher per section per academic year.
- Admin assigns one subject teacher per section, subject, and academic year.
- Students can view their class teacher and subject teachers.

### Attendance

- Assigned class teachers can record attendance for their section.
- Attendance must include all active enrollments for the section.
- Attendance status values are `PRESENT` or `ABSENT`.
- Future attendance is not allowed.
- Duplicate attendance for the same enrollment, section, academic year, and date is prevented.
- Admins and teachers can view section attendance and percentages.
- Students can view personal attendance history and percentage.

### Examination and Report Cards

- Admin creates exam instances for an academic year.
- Exam instance types are `HALF_YEARLY` and `END_TERM`.
- Creating exam instances snapshots the active curriculum scope.
- Teachers submit marks for assigned subject, section, and exam.
- Marks must include expected active enrollments and valid mark values.
- Duplicate mark records are prevented.
- Admins, teachers, and students can view role-appropriate marks.
- Students and admins can generate report cards.

### Fee Management

- Admin defines monthly fee amount per grade and academic year.
- Admin records student payments by enrollment and month.
- Payment amount must match the fee structure.
- Duplicate monthly payment records are prevented.
- Admin can view student fee status and section fee summaries.
- Students can view personal fee status.

### Notice Management

- Admin creates notices for an academic year.
- Notices have title, description, optional attachment reference, priority, and status.
- Priorities are `NORMAL` and `URGENT`.
- Status values are `Active` and `Inactive`.
- Admin can list notices with filters and change status.
- Teachers and students can view active notices.

### Dashboards and Analytics

- Admin dashboard summarizes active students, active teachers, attendance, fees, marks, and section drilldowns.
- Teacher dashboard summarizes assigned sections/subjects, attendance, and marks.
- Student dashboard summarizes personal attendance, teachers, marks, and notices.

## Out of Scope in Current Implementation

- Parent or guardian role.
- Online payment gateway integration.
- File upload/storage for notice attachments.
- Timetable scheduling.
- Transport, hostel, library, and inventory management.
- Email, SMS, or push notifications.
- Audit log UI.
- Multi-school or branch tenancy.
- Production deployment automation.

## Key User Journeys

### Admin Academic Setup

1. Admin logs in.
2. Admin creates or activates an academic year.
3. Admin creates grades for the academic year.
4. Admin creates sections under grades.
5. Admin creates subjects.
6. Admin maps subjects to grades.
7. Admin assigns teachers to class and subject responsibilities.

### Student Onboarding

1. Admin creates a student user or uses onboarding flow.
2. Admin creates student identity details.
3. Admin enrolls the student into an active academic year and section.
4. Student logs in and sees dashboard, attendance, report card, fees, notices, and teachers.

### Teacher Attendance

1. Teacher logs in.
2. Teacher opens attendance workspace.
3. System resolves teacher section assignment.
4. Teacher marks all active enrollments as present or absent for a date.
5. System validates date, assignment, section, academic year, and duplicate records.
6. Attendance is stored and becomes visible to admin and students.

### Teacher Marks Entry

1. Admin creates exam instances.
2. Teacher opens marks workspace for assigned subject and section.
3. Teacher submits marks for all expected active enrollments.
4. System validates subject assignment, exam scope, mark range, and duplicates.
5. Marks become visible to admin, class teacher, and student report cards.

## Functional Requirements

| ID | Requirement |
| --- | --- |
| FR-AUTH-01 | The system shall authenticate users by username and password. |
| FR-AUTH-02 | The system shall issue a JWT after successful login. |
| FR-AUTH-03 | The system shall reject inactive users during login and token validation. |
| FR-RBAC-01 | The system shall restrict access by role. |
| FR-ACAD-01 | The system shall allow admins to create non-overlapping academic years. |
| FR-ACAD-02 | The system shall enforce at most one active academic year. |
| FR-ACAD-03 | The system shall allow admins to manage grades, sections, subjects, and mappings. |
| FR-STU-01 | The system shall allow admins to create and manage student identities. |
| FR-STU-02 | The system shall allow admins to create and manage enrollments. |
| FR-TCH-01 | The system shall allow admins to create and list teacher profiles. |
| FR-ASN-01 | The system shall allow admins to assign class teachers and subject teachers. |
| FR-ATT-01 | The system shall allow assigned teachers to record complete section attendance. |
| FR-ATT-02 | The system shall expose attendance history and percentage views. |
| FR-EXAM-01 | The system shall allow admins to create half-yearly and end-term exams. |
| FR-EXAM-02 | The system shall allow assigned teachers to submit marks. |
| FR-EXAM-03 | The system shall generate student report cards. |
| FR-FEE-01 | The system shall allow admins to define monthly fee structures. |
| FR-FEE-02 | The system shall allow admins to record monthly fee payments. |
| FR-NOT-01 | The system shall allow admins to create and manage notices. |
| FR-DASH-01 | The system shall provide role-specific dashboards. |

## Non-Functional Requirements

| Area | Requirement |
| --- | --- |
| Security | Passwords must be hashed. API access must require valid JWT where appropriate. |
| Authorization | Backend must enforce role permissions and not rely only on frontend route guards. |
| Data integrity | MongoDB unique indexes and service-level validations must prevent duplicate and inconsistent records. |
| Reliability | Multi-record attendance, mark, exam, and onboarding writes should use transactions where implemented. |
| Usability | Role-specific navigation should expose only relevant functions. |
| Maintainability | Backend modules should remain organized by domain with route, controller, service, model, and validation layers. |
| Configurability | Environment-specific values should move to environment variables where practical. |

## Success Metrics

- Admin can complete academic setup without direct database edits.
- Teacher can record attendance and marks for assigned sections without admin intervention.
- Student can view accurate personal attendance, marks, fee status, notices, and teacher assignments.
- Duplicate records for attendance, marks, fees, academic years, and mappings are blocked.
- Unauthorized role access attempts are rejected by backend APIs.

## Open Questions

- Should the system support multiple schools or branches?
- Should the active academic year be selected by the user session or always resolved globally?
- Should payment records support partial payments, discounts, penalties, or receipts?
- Should notice attachments become real uploaded files?
- Should dashboard analytics require stricter backend role checks on every endpoint?
- Should attendance date rules be configurable per school?

