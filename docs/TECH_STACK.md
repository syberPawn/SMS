# Technology Stack

## Overview

The system is a JavaScript full-stack web application with a React frontend and an Express/MongoDB backend.

## Frontend

| Area | Technology | Current Use |
| --- | --- | --- |
| Runtime/build | Vite | Development server, production build, preview |
| UI library | React 19 | Component-based single-page application |
| Routing | React Router DOM 7 | Role-based route trees for admin, teacher, and student users |
| HTTP client | Axios | API calls through module-specific API wrappers |
| State | React Context | Authentication context backed by `localStorage` |
| Styling | CSS files | Page-level and global CSS |
| Linting | ESLint 9 | Frontend lint command |

## Backend

| Area | Technology | Current Use |
| --- | --- | --- |
| Runtime | Node.js | Server runtime |
| Web framework | Express 5 | REST API routing and middleware |
| Database | MongoDB | Primary document database |
| ODM | Mongoose 9 | Schema definitions, indexes, queries, transactions |
| Authentication | JSON Web Token | Login session token with role claims |
| Password hashing | bcrypt | Hashing and comparing user passwords |
| Validation | Joi | Request payload and query validation |
| Configuration | dotenv | Loads environment variables |
| CORS | cors | Allows frontend origin `http://localhost:5173` |
| Development | nodemon | Backend dev server restart |

## Core Runtime Configuration

Backend environment variables:

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | MongoDB connection string |
| `PORT` | Backend port, defaults to `5000` |
| `JWT_SECRET` | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | JWT expiration duration |

Frontend API base URL is currently hardcoded in `frontend/src/api/axiosInstance.js` as:

```text
http://localhost:5000
```

## Scripts

Backend:

```bash
npm run dev
npm start
```

Frontend:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Current Technical Notes

- The repository root is not currently a Git repository.
- `node_modules` exists in both `backend` and `frontend`.
- Backend uses CommonJS modules.
- Frontend uses ES modules.
- Backend routes are mounted mostly at the root path, with module route groups such as `/attendance`, `/fees`, `/examination`, and `/analytics`.
- API authorization is implemented manually inside controllers through `verifyAuthenticated` and `verifyRole` rather than shared Express middleware.
- Some analytics routes do not consistently show authentication enforcement in the controller inspection and should be reviewed before production use.

