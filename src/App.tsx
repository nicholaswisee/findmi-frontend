import { useNavigate, useRoutes } from "react-router-dom";
import { routes } from "./routes";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";

export default function App() {
  const navigate = useNavigate();
  const refreshUser = useAuthStore((s) => s.refreshUser);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "success") {
      window.history.replaceState({}, "", "/");
    }
  }, [navigate]);

  useEffect(() => {
    refreshUser();
    const interval = setInterval(refreshUser, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshUser]);

  const element = useRoutes(routes);
  return element;
}
