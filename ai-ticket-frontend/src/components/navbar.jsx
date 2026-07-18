import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/use-auth.js";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="navbar bg-base-200">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-xl">
          Ticket AI
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <p>Hi, {user?.email}</p>
        {user?.role === "admin" && (
          <Link to="/admin" className="btn btn-sm">
            Admin
          </Link>
        )}
        <button onClick={handleLogout} className="btn btn-sm">
          Logout
        </button>
      </div>
    </div>
  );
}

