/**
 * End-to-end API tests using Node's built-in test runner + in-memory MongoDB.
 * Run: npm test
 */
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { connectDB, disconnectDB } from "../config/db.js";

process.env.JWT_SECRET = "test-secret";
process.env.TESTING = "true";

let server;
let base;

before(async () => {
  await connectDB();
  const { default: app } = await import("../index.js");
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await disconnectDB();
});

const json = (res) => res.json();

test("health endpoint responds", async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  assert.equal((await json(res)).status, "ok");
});

test("register, login and full task lifecycle", async () => {
  // register
  const reg = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test User", email: "test@example.com", password: "secret123" }),
  });
  assert.equal(reg.status, 201);
  const { token } = await json(reg);
  assert.ok(token);

  const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // duplicate register is rejected
  const dup = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test User", email: "test@example.com", password: "secret123" }),
  });
  assert.equal(dup.status, 400);

  // login
  const login = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com", password: "secret123" }),
  });
  assert.equal(login.status, 200);

  // create task
  const created = await fetch(`${base}/api/tasks`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ title: "Write tests", priority: "high", category: "work" }),
  });
  assert.equal(created.status, 201);
  const task = await json(created);
  assert.equal(task.title, "Write tests");
  assert.equal(task.completed, false);

  // list tasks
  const list = await fetch(`${base}/api/tasks`, { headers: auth });
  const body = await json(list);
  assert.equal(body.tasks.length, 1);
  assert.equal(body.stats.total, 1);
  assert.equal(body.stats.active, 1);

  // toggle completed
  const patched = await fetch(`${base}/api/tasks/${task._id}`, {
    method: "PATCH",
    headers: auth,
    body: JSON.stringify({ completed: true }),
  });
  assert.equal((await json(patched)).completed, true);

  // update details
  const updated = await fetch(`${base}/api/tasks/${task._id}`, {
    method: "PUT",
    headers: auth,
    body: JSON.stringify({ title: "Write more tests", priority: "low" }),
  });
  const updatedTask = await json(updated);
  assert.equal(updatedTask.title, "Write more tests");
  assert.equal(updatedTask.priority, "low");

  // clear completed
  const cleared = await fetch(`${base}/api/tasks?filter=completed`, { method: "DELETE", headers: auth });
  assert.equal((await json(cleared)).deleted, 1);

  // unauthorized access
  const noAuth = await fetch(`${base}/api/tasks`);
  assert.equal(noAuth.status, 401);
});

test("tasks are private to their owner", async () => {
  const other = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Other", email: "other@example.com", password: "secret123" }),
  });
  const { token } = await json(other);
  const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  await fetch(`${base}/api/tasks`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ title: "Private task" }),
  });

  const list = await fetch(`${base}/api/tasks`, { headers: auth });
  const body = await json(list);
  assert.equal(body.tasks.length, 1);
  assert.equal(body.tasks[0].title, "Private task");
});

test("admin routes are blocked for normal users", async () => {
  const login = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com", password: "secret123" }),
  });
  const { token } = await json(login);
  const res = await fetch(`${base}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(res.status, 403);
});
