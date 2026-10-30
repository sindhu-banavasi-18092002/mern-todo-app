# MERN To-Do Application

A simple full-stack To-Do application built with MongoDB, Express, React, and Node.js.

## Features
- Create tasks
- View all tasks
- Mark tasks as completed / not completed
- Delete tasks
- Responsive, clean UI
- REST API with Express
- MongoDB persistence

## Requirements
- Node.js 18+
- MongoDB local instance or MongoDB Atlas connection string

## Setup

### 1. Configure the backend
Open a terminal in `server/`:

```bash
npm install
```

Copy `.env.example` to `.env` and set your MongoDB connection string:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/mern_todo
```

Start the backend:

```bash
npm run dev
```

### 2. Configure the frontend
Open another terminal in `client/`:

```bash
npm install
npm run dev
```

Vite will print the local URL (usually `http://localhost:5173`).

## API endpoints
- `GET /api/tasks` — list tasks
- `POST /api/tasks` — create a task (`{ "title": "Example" }`)
- `PATCH /api/tasks/:id` — update task completion (`{ "completed": true }`)
- `DELETE /api/tasks/:id` — delete a task

## Project structure
```text
mern-todo-app/
├── client/       # React + Vite frontend
└── server/       # Express + MongoDB backend
```

## Notes
- Never commit your real `.env` file or database credentials.
- `.env` is ignored by Git; `.env.example` contains safe placeholder configuration.
