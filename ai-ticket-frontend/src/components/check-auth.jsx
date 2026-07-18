import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/use-auth.js";

export default function CheckAuth({ children, isProtected, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="text-center mt-10">Checking session...</div>;
  }

  if (isProtected && !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isProtected && user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

