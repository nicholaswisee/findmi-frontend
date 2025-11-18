import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./App.css";

const root = createRoot(document.getElementById("root")!);

const app = (
  <BrowserRouter basename="/">
    <App />
  </BrowserRouter>
);

if (import.meta.env.DEV) {
  root.render(<React.StrictMode>{app}</React.StrictMode>);
} else {
  root.render(app);
}
