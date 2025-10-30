import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useEffect } from "react";

interface PrivateRouteProps {
  children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const location = useLocation();
  const { isAuthenticated, refreshUser } = useAuthStore();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
