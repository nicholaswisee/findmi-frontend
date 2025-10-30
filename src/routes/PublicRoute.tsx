import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function PublicRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || "/profile";
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}
