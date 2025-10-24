import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || "/profile";
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}
