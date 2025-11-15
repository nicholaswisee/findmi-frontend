import { useRoutes } from "react-router-dom";
import { routes } from "./routes";
import { useEffect, useState } from "react";
import { useAuthStore } from "./store/authStore";
import { areCookiesEnabled } from "./lib/cookies";
import CookieWarning from "./components/CookieWarning";

const FIVE_MINUTES = 5 * 60 * 1000;

export default function App() {
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [cookiesEnabled, setCookiesEnabled] = useState(true);

  useEffect(() => {
    // Check if cookies are enabled
    const enabled = areCookiesEnabled();
    setCookiesEnabled(enabled);

    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "success") {
      window.history.replaceState({}, "", "/");
    }
  }, []);

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

  return (
    <>
      {element}
      {!cookiesEnabled && <CookieWarning />}
    </>
  );
}
