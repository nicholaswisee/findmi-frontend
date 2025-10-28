import { useNavigate, useRoutes } from "react-router-dom";
import { routes } from "./routes";
import { useEffect } from "react";

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "success") {
      window.history.replaceState({}, "", "/");
    }
  }, [navigate]);

  const element = useRoutes(routes);
  return element;
}
