# StudyNest

A minimal lavender-themed study planner built with the MERN stack.

## Features
- Register, log in, and log out with JWT authentication and bcrypt password hashing.
- Create, update, delete, and complete tasks.
- Create and manage subjects.
- Record focus sessions.
- Dashboard summaries and weekly study analytics.
- Responsive layout with loading, empty, and error feedback.

## Stack
- React + Vite
- React Router
- Node.js + Express
- MongoDB + Mongoose
- JWT + bcryptjs

## Requirements
Node.js 20+ recommended, npm, and a MongoDB connection (local MongoDB or MongoDB Atlas).

## Setup

### 1. Backend
```bash
cd server
cp .env.example .env
```
On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.
Edit `server/.env` and set `MONGODB_URI` and a long random `JWT_SECRET`.

```bash
npm install
npm run dev
```
API runs at `http://localhost:5000`.

### 2. Frontend
Open a second terminal:
```bash
cd client
cp .env.example .env
npm install
npm run dev
```
On Windows PowerShell, use `Copy-Item .env.example .env`.
Open the local URL printed by Vite, usually `http://localhost:5173`.

## Environment variables
Server (`server/.env`):
- `PORT` — API port, default 5000
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — private random signing secret
- `CLIENT_URL` — allowed frontend origins, comma-separated (for example `http://localhost:5173,https://your-app.vercel.app`)
- `NODE_ENV` — development or production

Client (`client/.env`):
- `VITE_API_URL` — API base URL. Local development uses `/api` through the Vite proxy; production defaults to the configured StudyNest API. Set this to your deployed backend URL when deploying elsewhere.

Never commit `.env` files or put private secrets in frontend variables.

## API overview
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET/POST /api/subjects`
- `PATCH/DELETE /api/subjects/:id`
- `GET/POST /api/tasks`
- `PATCH/DELETE /api/tasks/:id`
- `GET/POST /api/sessions`
- `GET /api/analytics/summary`
- `GET/POST /api/exams`
- `GET/POST /api/daily-goals`

All user-owned resources are scoped to the authenticated user.

## Important notes
- This is a complete starter implementation, but you must configure MongoDB and test the core flows locally before submission.
- Analytics use saved tasks and focus sessions; they will be empty until you create records.
- Password reset, email verification, automated test suites, and production deployment configuration are not included yet.
- Do not claim a plagiarism percentage without using your institution's approved checker. Review and understand the code and customize it for your own project.
