# Donezo — Advanced MERN To-Do App

A full-stack to-do application: **React (Vite) + Express + MongoDB**, with JWT authentication,
per-user tasks, filters, priorities, due dates and an admin console. Deployed on **Vercel**.

- **Live app:** https://donezo-mocha.vercel.app
- **Repository:** https://github.com/sindhu-banavasi-18092002/mern-todo-app

## Features

| Area | What it does |
| --- | --- |
| Auth | Register, login, JWT sessions (7 days), password hashing with bcrypt, `GET /api/auth/me` |
| Roles | `user` and `admin`; admin routes protected with role middleware |
| Tasks | Create, read, update, toggle complete, delete, bulk clear completed |
| Filtering | All / To do / Completed, full-text search, priority filter, sort by newest, oldest, due date, priority |
| Details | Priority (low/medium/high), category, notes, due date with **overdue** detection |
| Dashboard | Live totals: all, to do, completed, overdue + progress bar |
| Admin | Platform stats, user list with task counts, delete user and their tasks |
| Security | Rate limiting, CORS allow-list, central error handling, input validation, private tasks per user |

## Project structure

```text
mern-todo-app/
├── api/                     # (root) not used at deploy time — see client/api
├── client/                  # React + Vite frontend
│   ├── api/index.js         # Vercel serverless entry → imports ../server/index.js
│   ├── vercel.json          # Vercel config (root directory = client)
│   └── src/
│       ├── api.js           # fetch wrapper + token storage
│       ├── context/AuthContext.jsx
│       ├── components/      # Navbar, ProtectedRoute, TaskRow, TaskToolbar
│       ├── pages/           # Dashboard, AuthForm, Admin
│       └── styles.css
├── server/                  # Express + Mongoose API
│   ├── config/db.js         # MongoDB connection (+ in-memory fallback)
│   ├── config/mongo-binary.js
│   ├── middleware/          # auth (JWT + roles), error handling
│   ├── models/              # User, Task
│   ├── routes/              # auth, tasks, admin
│   ├── scripts/prepare-mongod.js
│   ├── tests/api.test.js    # end-to-end API tests (node:test)
│   ├── seed.js              # demo user + sample tasks
│   └── seed-admin.js        # promote/create an admin
└── package.json             # convenience scripts
```

## Run locally (VS Code)

```bash
# 1. install everything
npm run install:all

# 2. start the API (terminal 1)
cd server
copy .env.example .env      # Windows  (macOS/Linux: cp .env.example .env)
npm run dev                 # http://localhost:5000

# 3. start the frontend (terminal 2)
cd client
npm run dev                 # http://localhost:5173
```

Without `MONGO_URI`, the API starts an in-memory MongoDB automatically, so the app
works with zero setup (data resets on restart).

## Environment variables

`server/.env` (and Vercel → Project → Settings → Environment Variables):

```env
MONGO_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/mern_todo
JWT_SECRET=long-random-string
JWT_EXPIRES_IN=7d
NODE_ENV=production
CLIENT_ORIGIN=https://donezo-mocha.vercel.app
```

## API endpoints

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | – | Health check |
| POST | `/api/auth/register` | – | Create account → `{ token, user }` |
| POST | `/api/auth/login` | – | Login → `{ token, user }` |
| GET | `/api/auth/me` | user | Current user |
| GET | `/api/tasks` | user | List with `?filter=&search=&priority=&category=&sort=` + stats |
| POST | `/api/tasks` | user | Create task |
| PUT | `/api/tasks/:id` | user | Full update |
| PATCH | `/api/tasks/:id` | user | Partial update / toggle completed |
| DELETE | `/api/tasks/:id` | user | Delete task |
| DELETE | `/api/tasks?filter=completed` | user | Clear completed |
| GET | `/api/admin/stats` | admin | Platform totals |
| GET | `/api/admin/users` | admin | Users + task counts |
| DELETE | `/api/admin/users/:id` | admin | Delete user + tasks |

## Deploy on Vercel

The project is deployed as a **single Vercel project** with `client` as the root directory:
the React build is served statically and `/api/*` is rewritten to `client/api/index.js`,
which loads the Express app from `server/`.

```bash
npm install -g vercel
vercel login
vercel link --project donezo
vercel deploy --prod
```

## Tests

```bash
cd server
npm test
```

Covers health, register/login, duplicate email, task CRUD, stats, clear-completed,
authorization (401) and role checks (403).

## Scripts

| Command | Where | Does |
| --- | --- | --- |
| `npm run dev` | server | API with nodemon |
| `npm start` | server | API production start |
| `npm test` | server | API test suite |
| `npm run seed` | server | Demo user `demo@donezo.app / demo1234` + 7 tasks |
| `npm run seed:admin -- you@example.com password Name` | server | Create/promote an admin |
| `npm run build` | client | Production build |

## Note on the deployed database

If `MONGO_URI` is not configured, the deployed API starts an in-memory MongoDB inside the
serverless function (the binary is bundled during the build). The site is fully functional,
but data is per-instance and can reset. For production use, add a MongoDB Atlas `MONGO_URI`
in Vercel and redeploy.
