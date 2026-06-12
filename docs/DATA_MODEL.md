# Data Model

## Entity Summary

| Entity | Collection Purpose |
| --- | --- |
| User | Login account and role identity. |
| AcademicYear | School academic session and active year state. |
| Grade | Grade/class level within an academic year. |
| Section | Section under a grade. |
| Subject | Subject catalog. |
| GradeSubjectMapping | Curriculum mapping between grades and subjects. |
| Student | Student identity and admission data. |
| Enrollment | Student placement in academic year and section. |
| Teacher | Teacher profile linked to a user account. |
| ClassTeacherAssignment | Class teacher assignment for section/year. |
| SubjectTeacherAssignment | Subject teacher assignment for section/subject/year. |
| AttendanceEntry | Per-student attendance entry by date. |
| ExamInstance | Exam event for academic year and type. |
| ExamSubjectScope | Snapshot of subjects included in an exam. |
| ExamMark | Student marks per exam and subject. |
| MonthlyFees | Monthly fee structure per grade/year. |
| PaymentRecords | Student monthly payment records. |
| Notice | Published school notice. |

## Relationship Overview

```text
AcademicYear
  -> Grade
      -> Section
      -> GradeSubjectMapping -> Subject

User
  -> Student
      -> Enrollment -> AcademicYear, Section

User
  -> Teacher
      -> ClassTeacherAssignment -> AcademicYear, Section
      -> SubjectTeacherAssignment -> AcademicYear, Section, Subject

Enrollment
  -> AttendanceEntry
  -> ExamMark
  -> PaymentRecords

AcademicYear
  -> ExamInstance
      -> ExamSubjectScope
      -> ExamMark

AcademicYear
  -> MonthlyFees
  -> Notice
```

## Core Fields

### User

| Field | Type | Notes |
| --- | --- | --- |
| username | String | Required, unique. |
| passwordHash | String | Required, selected explicitly when needed. |
| role | String | `ADMIN`, `TEACHER`, or `STUDENT`. |
| status | String | `ACTIVE` or `INACTIVE`. |
| createdBy | ObjectId | References User. |
| updatedBy | ObjectId | References User. |

### AcademicYear

| Field | Type | Notes |
| --- | --- | --- |
| name | String | Required, unique. |
| startDate | Date | Required. |
| endDate | Date | Required. |
| status | String | `ACTIVE` or `INACTIVE`. |
| createdBy | ObjectId | Required. |
| updatedBy | ObjectId | Required. |

### Grade

| Field | Type | Notes |
| --- | --- | --- |
| academicYearId | ObjectId | References AcademicYear. |
| name | String | Required. |
| status | String | `ACTIVE` or `INACTIVE`. |
| createdBy | ObjectId | Required. |
| updatedBy | ObjectId | Required. |

Unique index: `academicYearId + name`

### Section

| Field | Type | Notes |
| --- | --- | --- |
| gradeId | ObjectId | References Grade. |
| name | String | Required. |
| status | String | `ACTIVE` or `INACTIVE`. |
| createdBy | ObjectId | Required. |
| updatedBy | ObjectId | Required. |

Unique index: `gradeId + name`

### Subject

| Field | Type | Notes |
| --- | --- | --- |
| name | String | Required, unique. |
| code | String | Unique. |
| status | String | `ACTIVE` or `INACTIVE`. |
| createdBy | ObjectId | Required. |
| updatedBy | ObjectId | Required. |

### GradeSubjectMapping

| Field | Type | Notes |
| --- | --- | --- |
| gradeId | ObjectId | References Grade. |
| subjectId | ObjectId | References Subject. |
| status | String | `ACTIVE` or `INACTIVE`. |
| createdBy | ObjectId | Required. |
| updatedBy | ObjectId | Required. |

Unique index: `gradeId + subjectId`

### Student

| Field | Type | Notes |
| --- | --- | --- |
| userId | ObjectId | References User. |
| fullName | String | Required. |
| dateOfBirth | Date | Required. |
| gender | String | `MALE`, `FEMALE`, or `OTHER`. |
| admissionNumber | String | Required, unique. |
| identityStatus | String | `ACTIVE` or `INACTIVE`. |

### Enrollment

| Field | Type | Notes |
| --- | --- | --- |
| studentId | ObjectId | References Student. |
| academicYearId | ObjectId | References AcademicYear. |
| sectionId | ObjectId | References Section. |
| enrollmentStatus | String | `ACTIVE`, `PROMOTED`, `REPEATING`, `WITHDRAWN`, or `COMPLETED`. |

Unique index: `studentId + academicYearId`

### Teacher

| Field | Type | Notes |
| --- | --- | --- |
| userId | ObjectId | References User, unique. |
| fullName | String | Required. |
| highestQualification | String | Required, enum-backed. |
| contactNumber | String | Optional. |
| status | String | `ACTIVE` or `INACTIVE`. |

### ClassTeacherAssignment

| Field | Type | Notes |
| --- | --- | --- |
| academicYearId | ObjectId | References AcademicYear. |
| sectionId | ObjectId | References Section. |
| teacherId | ObjectId | References User. |

Unique constraints:

- `academicYearId + sectionId`
- `academicYearId + teacherId`

### SubjectTeacherAssignment

| Field | Type | Notes |
| --- | --- | --- |
| academicYearId | ObjectId | References AcademicYear. |
| sectionId | ObjectId | References Section. |
| subjectId | ObjectId | References Subject. |
| teacherId | ObjectId | References User. |

Unique index: `academicYearId + sectionId + subjectId`

### AttendanceEntry

| Field | Type | Notes |
| --- | --- | --- |
| academicYearId | ObjectId | References AcademicYear. |
| sectionId | ObjectId | References Section. |
| enrollmentId | ObjectId | References Enrollment. |
| markedBy | ObjectId | References User. |
| attendanceDate | Date | Required. |
| status | String | `PRESENT` or `ABSENT`. |
| recordedAt | Date | System timestamp. |

Unique index: `academicYearId + sectionId + enrollmentId + attendanceDate`

### ExamInstance

| Field | Type | Notes |
| --- | --- | --- |
| academicYearId | ObjectId | References AcademicYear. |
| type | String | `HALF_YEARLY` or `END_TERM`. |
| examDate | Date | Required. |
| createdAt | Date | System timestamp. |

Unique index: `academicYearId + type`

### ExamSubjectScope

| Field | Type | Notes |
| --- | --- | --- |
| examInstanceId | ObjectId | References ExamInstance. |
| gradeId | ObjectId | References Grade. |
| subjectId | ObjectId | References Subject. |
| createdAt | Date | System timestamp. |

Unique index: `examInstanceId + gradeId + subjectId`

### ExamMark

| Field | Type | Notes |
| --- | --- | --- |
| examInstanceId | ObjectId | References ExamInstance. |
| academicYearId | ObjectId | References AcademicYear. |
| sectionId | ObjectId | References Section. |
| enrollmentId | ObjectId | References Enrollment. |
| subjectId | ObjectId | References Subject. |
| enteredBy | ObjectId | References User. |
| marksObtained | Number | Required. |
| submittedAt | Date | System timestamp. |

Unique index: `examInstanceId + enrollmentId + subjectId`

### MonthlyFees

| Field | Type | Notes |
| --- | --- | --- |
| academicYearId | ObjectId | References AcademicYear. |
| gradeId | ObjectId | References Grade. |
| monthlyAmount | Number | Required. |
| createdAt | Date | System timestamp. |

Unique index: `gradeId + academicYearId`

### PaymentRecords

| Field | Type | Notes |
| --- | --- | --- |
| academicYearId | ObjectId | References AcademicYear. |
| enrollmentId | ObjectId | References Enrollment. |
| gradeId | ObjectId | References Grade. |
| sectionId | ObjectId | References Section. |
| month | String | Required. |
| amount | Number | Required. |
| paidAt | Date | Required. |
| recordedBy | ObjectId | References User. |
| createdAt | Date | System timestamp. |

Unique index: `enrollmentId + month`

### Notice

| Field | Type | Notes |
| --- | --- | --- |
| academicYearId | ObjectId | References AcademicYear. |
| title | String | Required. |
| description | String | Required. |
| attachmentReference | String | Optional. |
| priority | String | `NORMAL` or `URGENT`. |
| status | String | `Active` or `Inactive`. |
| publishedAt | Date | System timestamp. |
| createdBy | ObjectId | References User. |

## Important Domain States

| Area | Values |
| --- | --- |
| User status | `ACTIVE`, `INACTIVE` |
| Academic structure status | `ACTIVE`, `INACTIVE` |
| Enrollment status | `ACTIVE`, `PROMOTED`, `REPEATING`, `WITHDRAWN`, `COMPLETED` |
| Attendance status | `PRESENT`, `ABSENT` |
| Exam type | `HALF_YEARLY`, `END_TERM` |
| Notice priority | `NORMAL`, `URGENT` |
| Notice status | `Active`, `Inactive` |

