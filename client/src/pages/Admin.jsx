import { useEffect, useState } from "react";
import { Trash2, Users, ListTodo, CheckCircle2 } from "lucide-react";
import { api } from "../api.js";

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [statsData, usersData] = await Promise.all([api.adminStats(), api.adminUsers()]);
      setStats(statsData);
      setUsers(usersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function removeUser(id, email) {
    if (!window.confirm(`Delete ${email} and all their tasks?`)) return;
    try {
      await api.adminDeleteUser(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero left">
        <div className="eyebrow"><span className="eyebrow-dot" /> ADMIN CONSOLE</div>
        <h1>Platform <span>overview</span></h1>
        <p>Users and tasks across the whole app.</p>
      </section>

      {error && <div className="error-message" role="alert">{error}</div>}

      {loading ? (
        <div className="empty-state"><div className="spinner" /><h3>Loading…</h3></div>
      ) : (
        <>
          <section className="dashboard four">
            <div className="stat-card">
              <div className="stat-icon purple"><Users size={19} /></div>
              <div><span className="stat-label">Users</span><strong>{stats?.users ?? 0}</strong></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange"><ListTodo size={19} /></div>
              <div><span className="stat-label">Tasks</span><strong>{stats?.tasks ?? 0}</strong></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><CheckCircle2 size={19} /></div>
              <div><span className="stat-label">Completed</span><strong>{stats?.completed ?? 0}</strong></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red"><ListTodo size={19} /></div>
              <div><span className="stat-label">Pending</span><strong>{stats?.pending ?? 0}</strong></div>
            </div>
          </section>

          <section className="todo-panel">
            <div className="panel-heading">
              <div>
                <h2>Users <span className="task-count">{users.length}</span></h2>
                <p>Newest accounts first.</p>
              </div>
            </div>
            <div className="task-list">
              {users.map((user) => (
                <article className="task-row" key={user._id}>
                  <div className="task-copy">
                    <span className="task-title">{user.name}</span>
                    <span className="task-notes">{user.email}</span>
                    <div className="task-meta">
                      <span className="pill category">{user.role}</span>
                      <span className="pill due">{user.tasks} tasks</span>
                      <span className="task-date">
                        Joined {new Date(user.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                  </div>
                  <div className="row-actions">
                    <button
                      className="icon-button danger"
                      onClick={() => removeUser(user._id, user.email)}
                      aria-label={`Delete ${user.email}`}
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
