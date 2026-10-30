import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/** Blocks a page until the user is logged in (and optionally an admin). */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, ready, isAdmin } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="splash">
        <div className="spinner" />
        <p>Loading your workspace…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return children;
}
