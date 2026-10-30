// Thin API layer: every request goes through here so errors stay consistent.
const BASE = import.meta.env.VITE_API_URL || "/api";

// Preview mode: when the static build is served without an API (the file
// preview in the chat), read sample data instead so the UI can be shown.
const PREVIEW = import.meta.env.VITE_PREVIEW === "true";
const PREVIEW_URL = import.meta.env.VITE_PREVIEW_DATA || "./preview-tasks.json";

function getToken() {
  return localStorage.getItem("donezo_token") || "";
}

async function previewRequest(path, method, body) {
  const snapshot = await fetch(PREVIEW_URL).then((r) => r.json());
  const tasks = [...snapshot.tasks];
  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.completed).length,
    active: tasks.filter((t) => !t.completed).length,
    overdue: tasks.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date(new Date().toDateString())).length,
  };

  if (path.startsWith("/auth/")) return { token: "preview", user: snapshot.user };
  if (path.startsWith("/tasks")) {
    if (method === "POST") return { ...body, _id: String(Date.now()), createdAt: new Date().toISOString(), completed: false, user: snapshot.user._id };
    if (method === "PUT" || method === "PATCH") return { ...tasks[0], ...body };
    if (method === "DELETE") return { message: "Deleted (preview)", deleted: 1 };
    return { tasks, stats };
  }
  if (path.startsWith("/admin/")) {
    return path === "/admin/users"
      ? [{ ...snapshot.user, tasks: tasks.length }]
      : { users: 1, tasks: tasks.length, completed: stats.completed, pending: stats.active };
  }
  return {};
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  if (PREVIEW) return previewRequest(path, method, body);
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Check your connection and that the API is running.");
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),
  me: () => request("/auth/me"),

  listTasks: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value && value !== "all")
    ).toString();
    return request(`/tasks${query ? `?${query}` : ""}`);
  },
  createTask: (payload) => request("/tasks", { method: "POST", body: payload }),
  updateTask: (id, payload) => request(`/tasks/${id}`, { method: "PUT", body: payload }),
  patchTask: (id, payload) => request(`/tasks/${id}`, { method: "PATCH", body: payload }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
  clearCompleted: () => request("/tasks?filter=completed", { method: "DELETE" }),

  adminStats: () => request("/admin/stats"),
  adminUsers: () => request("/admin/users"),
  adminDeleteUser: (id) => request(`/admin/users/${id}`, { method: "DELETE" }),
};

export const tokenStore = {
  get: getToken,
  set: (token) => localStorage.setItem("donezo_token", token),
  clear: () => localStorage.removeItem("donezo_token"),
};
