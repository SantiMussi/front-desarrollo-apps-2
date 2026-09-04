import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Spinner from "../ui/Spinner";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="grid min-h-screen place-items-center"><Spinner /></div>;
  if (!isAuthenticated) return <Navigate to="/ingresar" replace state={{ from: location }} />;
  return <Outlet />;
}