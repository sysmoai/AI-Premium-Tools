import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Hook the generated API client up to the admin token stored in localStorage
// after admin login. The server validates this bearer token via HMAC, so
// localStorage just stores it; it carries no privilege on its own.
setAuthTokenGetter(() => {
  try {
    return localStorage.getItem("aipt_admin_token");
  } catch {
    return null;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
