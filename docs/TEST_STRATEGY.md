# Test Strategy

## Current State

The current codebase exposes these quality commands:

- Frontend: `npm run lint`
- Frontend: `npm run build`
- Backend: no automated test script is currently defined

No automated unit, integration, or end-to-end test suite was found during inspection.

## Test Objectives

- Verify that role-based access is enforced by backend APIs.
- Verify that academic-year, enrollment, assignment, attendance, exam, fee, and notice rules prevent invalid states.
- Verify that the React route structure protects admin, teacher, and student areas.
- Verify that core user journeys work end to end.

## Recommended Test Layers

### Backend Unit Tests

Focus on service-level business rules:

- Academic year overlap and single active year.
- Grade and section deactivation dependency checks.
- Student enrollment uniqueness and status transitions.
- Teacher assignment uniqueness.
- Attendance completeness, date rules, and duplicate prevention.
- Exam snapshot creation and marks submission validation.
- Fee structure and payment validation.
- Notice payload and status validation.

Recommended tools:

- Jest or Vitest
- mongodb-memory-server for isolated MongoDB tests

### Backend API Integration Tests

Exercise routes through HTTP and verify status codes, authorization, and response shapes.

Recommended coverage:

- `POST /auth/login`
- Admin-only user and setup routes
- Teacher-only attendance and marks routes
- Student-only personal views
- Conflict cases returning `409`
- Validation failures returning `400`
- Missing token and wrong role returning `401` or `403`

Recommended tools:

- Jest or Vitest
- Supertest

### Frontend Tests

Recommended coverage:

- Login success stores token, role, and user id.
- 401 API response clears auth and redirects to login.
- Protected route redirects when unauthenticated.
- Protected route redirects for wrong role.
- Role dashboard renders expected navigation.

Recommended tools:

- Vitest
- React Testing Library
- MSW for API mocking

### End-to-End Smoke Tests

Recommended smoke flows:

1. Admin logs in and opens dashboard.
2. Admin creates academic structure.
3. Admin onboards a student.
4. Admin creates a teacher and assignments.
5. Teacher logs in and records attendance.
6. Teacher submits marks.
7. Student logs in and views attendance, report card, fees, notices, and teachers.

Recommended tool:

- Playwright

## Test Data Strategy

Use deterministic seed data for:

- One active academic year.
- One grade and one section.
- One admin, one teacher, and one student user.
- One student identity and active enrollment.
- One class teacher assignment.
- One subject and one subject teacher assignment.
- One fee structure.
- One exam instance set.

## Release Gates

Minimum recommended gates before release:

- Frontend lint passes.
- Frontend production build passes.
- Backend service tests pass.
- Backend API authorization tests pass.
- End-to-end smoke flow passes.

## High-Risk Areas

- Analytics authorization consistency.
- Transaction behavior for multi-record writes.
- JWT storage in `localStorage`.
- Hardcoded local API URL and CORS origin.
- Duplicate API wrapper patterns in frontend.

