import { useNavigate, useRoutes } from "react-router-dom";
import { routes } from "./routes";
import { useEffect, useState } from "react";
import { useAuthStore } from "./store/authStore";

const FIVE_MINUTES = 5 * 60 * 1000;

export default function App() {
  const navigate = useNavigate();
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "success") {
      window.history.replaceState({}, "", "/");
    }
  }, [navigate]);

  useEffect(() => {
    if (bootstrapped) return;
    let active = true;
    (async () => {
      try {
        await refreshUser(true);
      } finally {
        if (active) setBootstrapped(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [bootstrapped, refreshUser]);

  useEffect(() => {
    if (!bootstrapped) return;
    const interval = setInterval(() => {
      refreshUser();
    }, FIVE_MINUTES);
    return () => clearInterval(interval);
  }, [bootstrapped, refreshUser]);

  const element = useRoutes(routes);

  if (!bootstrapped) {
    return null;
  }

  return element;
}
