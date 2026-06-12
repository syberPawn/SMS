# Deployment and Runbook Notes

## Local Development

### Backend

From `backend`:

```bash
npm install
npm run dev
```

Expected backend URL:

```text
http://localhost:5000
```

Required environment variables:

```text
MONGO_URI=<mongodb connection string>
PORT=5000
JWT_SECRET=<secret>
JWT_EXPIRES_IN=<duration>
```

### Frontend

From `frontend`:

```bash
npm install
npm run dev
```

Expected frontend URL:

```text
http://localhost:5173
```

## Production Readiness Checklist

Before production deployment:

- Move frontend API base URL to environment configuration.
- Move backend CORS origin to environment configuration.
- Confirm `JWT_SECRET` is strong and environment-specific.
- Ensure MongoDB is backed up and access-controlled.
- Add login rate limiting.
- Add centralized error handling.
- Add request logging and operational logs.
- Add tests for all role-protected routes.
- Verify analytics endpoints enforce authentication and authorization.
- Configure HTTPS at the ingress or hosting layer.
- Define backup and restore procedures.

## Suggested Runtime Topology

```text
User Browser
  -> Static frontend hosting or CDN
  -> API server running Node.js/Express
  -> MongoDB database
```

## Operational Checks

### Backend Health

The root endpoint returns a basic status message:

```text
GET /
School Management System Backend Running
```

### Database Connectivity

Backend startup logs MongoDB connection host after successful connection.

### Common Failure Modes

| Symptom | Likely Cause | Check |
| --- | --- | --- |
| Backend exits on startup | MongoDB connection failure | Verify `MONGO_URI` and network access. |
| Login always fails | Wrong credentials, inactive user, missing JWT secret | Check user status and `JWT_SECRET`. |
| Frontend cannot call API | API URL or CORS mismatch | Check frontend base URL and backend CORS origin. |
| Protected page redirects to login | Missing token, wrong role, or expired token | Check `localStorage` and JWT expiration. |
| Duplicate record errors | Unique index or business rule violation | Check academic year, enrollment, assignment, attendance, marks, or payment keys. |

## Backup Notes

MongoDB collections should be backed up together because most records are linked by ObjectId references. At minimum, include:

- users
- academicyears
- grades
- sections
- subjects
- gradesubjectmappings
- students
- enrollments
- teachers
- classteacherassignments
- subjectteacherassignments
- attendanceentries
- examinstances
- examsubjectscopes
- exammarks
- monthlyfees
- paymentrecords
- notices

Collection names may vary based on Mongoose pluralization and should be confirmed in the deployed database.

## Rollback Notes

Recommended rollback approach:

- Keep versioned frontend builds.
- Keep previous backend release package or container.
- Run database migrations only through reversible scripts once migrations are introduced.
- Take a database backup before schema or data migrations.

