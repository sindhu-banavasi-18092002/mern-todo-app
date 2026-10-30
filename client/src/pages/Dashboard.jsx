import { useEffect, useMemo, useState } from "react";
import { Check, Circle, ClipboardList, AlertTriangle } from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import TaskToolbar from "../components/TaskToolbar.jsx";
import TaskRow from "../components/TaskRow.jsx";

const EMPTY_STATS = { total: 0, completed: 0, active: 0, overdue: 0 };

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [filters, setFilters] = useState({
    filter: "all",
    search: "",
    priority: "",
    category: "",
    sort: "newest",
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load(currentFilters = filters) {
    try {
      setError("");
      const data = await api.listTasks(currentFilters);
      setTasks(data.tasks);
      setStats(data.stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Re-fetch whenever the filters change (debounced for typing in search)
  useEffect(() => {
    const timer = setTimeout(() => load(filters), filters.search ? 300 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function changeFilters(patch) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  async function addTask(payload) {
    setBusy(true);
    try {
      await api.createTask(payload);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleTask(task) {
    // Optimistic update for a snappy UI
    setTasks((current) =>
      current.map((item) => (item._id === task._id ? { ...item, completed: !item.completed } : item))
    );
    try {
      await api.patchTask(task._id, { completed: !task.completed });
      await load();
    } catch (err) {
      setError(err.message);
      await load();
    }
  }

  async function saveTask(id, payload) {
    try {
      await api.updateTask(id, payload);
      await load();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function deleteTask(id) {
    setTasks((current) => current.filter((task) => task._id !== id));
    try {
      await api.deleteTask(id);
      await load();
    } catch (err) {
      setError(err.message);
      await load();
    }
  }

  async function clearCompleted() {
    try {
      await api.clearCompleted();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const progress = useMemo(
    () => (stats.total ? Math.round((stats.completed / stats.total) * 100) : 0),
    [stats]
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="eyebrow">
          <span className="eyebrow-dot" /> YOUR PERSONAL WORKSPACE
        </div>
        <h1>
          {greeting}, <span>{user?.name?.split(" ")[0] || "friend"}</span>.
        </h1>
        <p>One task at a time. You’ve got this.</p>
      </section>

      <section className="dashboard" aria-label="Task dashboard">
        <div className="stat-card main-stat">
          <div className="stat-icon purple"><ClipboardList size={20} /></div>
          <div><span className="stat-label">Total tasks</span><strong>{stats.total}</strong></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><Circle size={19} /></div>
          <div><span className="stat-label">To do</span><strong>{stats.active}</strong></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Check size={20} /></div>
          <div><span className="stat-label">Completed</span><strong>{stats.completed}</strong></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><AlertTriangle size={19} /></div>
          <div><span className="stat-label">Overdue</span><strong>{stats.overdue}</strong></div>
        </div>
      </section>

      <section className="todo-panel">
        <div className="panel-heading">
          <div>
            <h2>My tasks <span className="task-count">{tasks.length}</span></h2>
            <p>Keep your priorities in sight.</p>
          </div>
          <div className="progress-wrap">
            <div className="progress-label">
              <span>Progress</span>
              <strong>{progress}%</strong>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <TaskToolbar
          filters={filters}
          onFilterChange={changeFilters}
          onAdd={addTask}
          onClearCompleted={clearCompleted}
          completedCount={stats.completed}
          busy={busy}
        />

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <div className="task-list">
          {loading ? (
            <div className="empty-state">
              <div className="spinner" />
              <h3>Loading your tasks…</h3>
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">{filters.filter === "completed" ? "🎉" : "✦"}</div>
              <h3>
                {filters.search
                  ? "No tasks match your search"
                  : filters.filter === "completed"
                  ? "Nothing completed yet"
                  : filters.filter === "active"
                  ? "You’re all caught up!"
                  : "A fresh start."}
              </h3>
              <p>Add a task above and make it happen.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskRow
                key={task._id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onSave={saveTask}
              />
            ))
          )}
        </div>

        <footer className="panel-footer">
          <span><span className="footer-sparkle">✦</span> Small steps lead to big things.</span>
          <span>{stats.active} {stats.active === 1 ? "task" : "tasks"} left</span>
        </footer>
      </section>

      <p className="page-footer">MADE FOR YOUR NEXT GREAT DAY <span>✦</span></p>
    </main>
  );
}
