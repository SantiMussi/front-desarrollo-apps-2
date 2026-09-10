import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Spinner from "../ui/Spinner";

export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="grid min-h-screen place-items-center"><Spinner /></div>;
  if (!isAuthenticated) return <Navigate to="/ingresar" replace state={{ from: location }} />;

  if (roles?.length) {
    const role = user?.role ?? user?.identity?.role;
    if (!roles.includes(role)) return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
