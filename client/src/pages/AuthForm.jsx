import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/** Shared login / register form. mode = "login" | "register" */
export default function AuthForm({ mode }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isRegister = mode === "register";

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(form.name.trim(), form.email.trim(), form.password);
      } else {
        await login(form.email.trim(), form.password);
      }
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell auth-shell">
      <section className="auth-card">
        <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-sub">
          {isRegister
            ? "One account, all your tasks, synced everywhere."
            : "Log in to pick up where you left off."}
        </p>

        <form className="auth-form" onSubmit={submit}>
          {isRegister && (
            <label>
              Name
              <input
                required
                maxLength={60}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
          )}

          <label>
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              required
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={isRegister ? "At least 6 characters" : "Your password"}
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
          </label>

          {error && <div className="error-message" role="alert">{error}</div>}

          <button className="solid-button full" type="submit" disabled={loading}>
            {loading ? "Please wait…" : isRegister ? "Create account" : "Log in"}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? "Already have an account? " : "New here? "}
          <Link to={isRegister ? "/login" : "/register"}>
            {isRegister ? "Log in" : "Create one"}
          </Link>
        </p>
      </section>
    </main>
  );
}
