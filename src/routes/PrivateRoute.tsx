import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useEffect, useRef } from "react";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const SESSION_REFRESH_BUFFER_MS = 2_000;

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const location = useLocation();
  const { isAuthenticated, refreshUser, loading, user, session } =
    useAuthStore();
  const refreshPendingRef = useRef(false);

  useEffect(() => {
    const expiring =
      !session ||
      session.expiresAt * 1000 <= Date.now() + SESSION_REFRESH_BUFFER_MS;
    const needRefresh = !isAuthenticated || expiring;
    if (!needRefresh || refreshPendingRef.current) return;

    refreshPendingRef.current = true;
    refreshUser(true).finally(() => {
      refreshPendingRef.current = false;
    });
  }, [isAuthenticated, refreshUser, session]);

  if (loading || (isAuthenticated && !user)) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
