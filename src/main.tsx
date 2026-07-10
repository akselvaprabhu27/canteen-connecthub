import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global fetch interceptor to redirect API calls to the deployed backend URL in production
const apiBase = import.meta.env.VITE_API_URL || "";
if (apiBase) {
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    let url = input;
    if (typeof input === "string" && input.startsWith("/api/")) {
      url = `${apiBase}${input}`;
    } else if (input instanceof URL && input.pathname.startsWith("/api/")) {
      url = `${apiBase}${input.pathname}${input.search}`;
    } else if (input instanceof Request && input.url.startsWith("/api/")) {
      url = new Request(`${apiBase}${input.url}`, input);
    }
    return originalFetch(url, init);
  };
}

createRoot(document.getElementById("root")!).render(<App />);

