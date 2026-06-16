# School Management System

A role-based school administration app for Admins, Teachers, and Students. Covers academic setup, attendance, exams, fees, notices, and dashboards.

Built with AI-assisted development (ChatGPT, Codex) — I handled the architecture, data modeling, and all system decisions. The docs in this repo reflect that.

---

## What it does

**Admin** — manages the full system: academic years, grades, sections, subjects, curriculum, users, students, teachers, assignments, fees, notices, and report cards.

**Teacher** — records attendance for their assigned section, submits exam marks, views class summaries and notices.

**Student** — views personal attendance, marks, report card, fee status, teachers, and notices.

---

## Tech Stack

**Frontend** — React 19, React Router DOM 7, Axios, Vite, React Context

**Backend** — Node.js, Express 5, MongoDB, Mongoose 9, JWT, bcrypt, Joi

---

## Project Structure

```
root/
├── backend/
│   └── src/
│       ├── config/
│       ├── utils/
│       └── modules/
│           ├── user/
│           ├── academicStructure/
│           ├── studentManagement/
│           ├── teacherManagement/
│           ├── teacherAssignmentManagement/
│           ├── attendanceManagement/
│           ├── examinationManagement/
│           ├── feeManagement/
│           ├── noticeManagement/
│           └── dashboardAnalytics/
│
└── frontend/
    └── src/
        ├── api/
        ├── components/
        ├── context/
        ├── routes/
        └── pages/
```

Each backend module follows: `routes → controllers → services → models + validations`

---

## Getting Started

**Prerequisites:** Node.js v18+, MongoDB (local or Atlas)

```bash
# Backend
cd backend
npm install
npm run dev
# runs at http://localhost:5000

# Frontend
cd frontend
npm install
npm run dev
# runs at http://localhost:5173
```

Create `backend/.env` (use `.env.example` as reference):

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_EXPIRES_IN=7d

# Generate your secret by running this in terminal:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=paste_generated_secret_here
```

> Never commit `.env` to GitHub. Make sure it's in your `.gitignore`.

---

## API

All protected routes require `Authorization: Bearer <jwt>`.

Key route groups: `/auth`, `/users`, `/academic-years`, `/grades`, `/sections`, `/subjects`, `/grade-subject-mappings`, `/students`, `/enrollments`, `/teachers`, `/class-teachers`, `/subject-teachers`, `/attendance`, `/examination`, `/fees`, `/notices`, `/analytics`

Full reference → [`API_REFERENCE.md`](./API_REFERENCE.md)

---

## Docs

| File | What's in it |
|---|---|
| [`PRD.md`](./PRD.md) | Requirements, roles, user journeys |
| [`SDD.md`](./SDD.md) | Architecture, module design, security |
| [`DATA_MODEL.md`](./DATA_MODEL.md) | Entities, fields, relationships, indexes |
| [`API_REFERENCE.md`](./API_REFERENCE.md) | All endpoints with methods and roles |
| [`TECH_STACK.md`](./TECH_STACK.md) | Tech choices and config notes |
| [`TEST_STRATEGY.md`](./TEST_STRATEGY.md) | Test layers, tools, coverage targets |
| [`DEPLOYMENT_RUNBOOK.md`](./DEPLOYMENT_RUNBOOK.md) | Setup, failure modes, backup notes |

---

## Known Gaps

- No automated tests yet (strategy documented in `TEST_STRATEGY.md`)
- JWT stored in `localStorage` — fine for now, XSS risk in production
- API URL and CORS origin are hardcoded to localhost
- Analytics endpoints need role enforcement review before production