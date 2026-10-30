import { Link, useNavigate } from "react-router-dom";
import { ListTodo, LogOut, ShieldCheck, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="topbar">
      <Link className="brand" to="/" aria-label="Donezo home">
        <span className="brand-icon">
          <ListTodo size={20} />
        </span>
        <span>
          donezo<span className="brand-dot">.</span>
        </span>
      </Link>

      {user ? (
        <nav className="topbar-actions">
          {isAdmin && (
            <Link className="ghost-button" to="/admin">
              <ShieldCheck size={16} /> Admin
            </Link>
          )}
          <span className="user-chip" title={user.email}>
            <UserIcon size={14} /> {user.name}
          </span>
          <button className="ghost-button" onClick={handleLogout} type="button">
            <LogOut size={16} /> Log out
          </button>
        </nav>
      ) : (
        <nav className="topbar-actions">
          <Link className="ghost-button" to="/login">
            Log in
          </Link>
          <Link className="solid-button small" to="/register">
            Create account
          </Link>
        </nav>
      )}
    </header>
  );
}
