import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AdminRoute() {
  const { session } = useAuth();

  if (session?.role !== "Admin") {
    return <Navigate to="/products" replace />;
  }

  return <Outlet />;
}
