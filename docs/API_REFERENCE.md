# API Reference

## General

Base URL in local development:

```text
http://localhost:5000
```

Authenticated requests use:

```text
Authorization: Bearer <jwt>
```

Common error response pattern:

```json
{
  "message": "Error or status message"
}
```

## Authentication

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/login` | Public | Login with username and password. |

Login returns token, user id, and role.

## Users

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/users` | Admin | Create user. |
| GET | `/users` | Admin | List users. |
| GET | `/users/:id` | Admin | Get user by id. |
| PATCH | `/users/:id` | Admin | Update user password or status. |
| PATCH | `/users/:id/deactivate` | Admin | Deactivate user. |

## Academic Structure

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/academic-years` | Admin | Create academic year. |
| GET | `/academic-years` | Admin, Teacher, Student | List academic years. |
| PATCH | `/academic-years/:id/activate` | Admin | Activate academic year. |
| PATCH | `/academic-years/:id/deactivate` | Admin | Deactivate academic year. |
| POST | `/grades` | Admin | Create grade. |
| GET | `/grades` | Admin | List grades by academic year. |
| PATCH | `/grades/:id/deactivate` | Admin | Deactivate grade. |
| POST | `/sections` | Admin | Create section. |
| GET | `/sections` | Admin | List sections. |
| PATCH | `/sections/:id/deactivate` | Admin | Deactivate section. |
| POST | `/subjects` | Admin | Create subject. |
| GET | `/subjects` | Admin | List subjects. |
| PATCH | `/subjects/:id/deactivate` | Admin | Deactivate subject. |
| PATCH | `/subjects/:id/activate` | Admin | Reactivate subject. |
| POST | `/grade-subject-mappings` | Admin | Map subject to grade. |
| GET | `/grade-subject-mappings` | Admin | List mappings by grade. |
| PATCH | `/grade-subject-mappings/:id/unmap` | Admin | Mark mapping inactive. |
| POST | `/grade-subject-mappings/copy` | Admin | Copy curriculum mappings between academic years. |

## Students and Enrollments

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/students` | Admin | Create student identity. |
| POST | `/students/onboard` | Admin | Create student identity and enrollment together. |
| GET | `/students` | Admin | List students. |
| GET | `/students/:id` | Authenticated | Get student profile, subject to profile access rules. |
| PATCH | `/students/:id` | Admin | Update student identity. |
| PATCH | `/students/:id/deactivate` | Admin | Deactivate student identity. |
| POST | `/enrollments` | Admin | Create enrollment. |
| GET | `/enrollments` | Authenticated | List enrollments/students by filters. |
| PATCH | `/enrollments/:id/class` | Admin | Update enrollment section. |
| PATCH | `/enrollments/:id/status` | Admin | Update enrollment status. |

## Teachers and Assignments

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/teachers` | Admin | Create teacher profile and linked user. |
| GET | `/teachers` | Admin | List teachers. |
| POST | `/class-teachers` | Admin | Assign class teacher. |
| PATCH | `/class-teachers` | Admin | Replace class teacher. |
| GET | `/class-teachers` | Authenticated | Get class teacher for section/year. |
| POST | `/subject-teachers` | Admin | Assign subject teacher. |
| PATCH | `/subject-teachers` | Admin | Replace subject teacher. |
| GET | `/subject-teachers` | Authenticated | Get subject teachers for section/year. |
| GET | `/teacher-assignments` | Authenticated | Get assignments for teacher/year. |
| GET | `/assignments` | Admin | Get assignments by academic year. |
| GET | `/student-my-teachers` | Student | Get student's teachers. |

## Attendance

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/attendance` | Teacher | Record section attendance. |
| GET | `/attendance` | Admin, Teacher | Get section attendance. |
| GET | `/attendance/student` | Student | Get student's attendance history. |
| GET | `/attendance/student/percentage` | Student | Get student's attendance percentage. |
| GET | `/attendance/section/percentage` | Admin, Teacher | Get section attendance percentage. |

## Examination

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/examination/instances` | Admin | Create half-yearly and end-term exam instances. |
| GET | `/examination/instances` | Admin, Teacher, Student | List exam instances. |
| POST | `/examination/marks` | Teacher | Submit subject marks. |
| GET | `/examination/marks/subject` | Teacher | View subject marks. |
| GET | `/examination/marks/class` | Teacher | View class marks. |
| GET | `/examination/marks/admin` | Admin | View marks as admin. |
| GET | `/examination/marks/student` | Student | View student marks. |
| GET | `/examination/report-card` | Student, Admin | Generate report card. |

## Fees

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/fees/structure` | Admin | Create monthly fee structure. |
| GET | `/fees/structure` | Admin | Get monthly fee structure. |
| POST | `/fees/payment` | Admin | Record payment. |
| GET | `/fees/student-status` | Admin, Student | Get monthly payment status. |
| GET | `/fees/section-summary` | Admin | Get section monthly fee summary. |

## Notices

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/notices` | Admin | Create notice. |
| GET | `/notices/admin` | Admin | List notices with filters. |
| GET | `/notices` | Teacher, Student | List active notices. |
| PATCH | `/notices/:id/status` | Admin | Change notice status. |

## Analytics

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/analytics/admin-overview` | Admin dashboard summary. |
| GET | `/analytics/section-drilldown` | Admin section drilldown. |
| GET | `/analytics/teacher-dashboard` | Teacher dashboard summary. |
| GET | `/analytics/student-dashboard` | Student dashboard summary. |

Security note: verify role enforcement on analytics endpoints before production release.

