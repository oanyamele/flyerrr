import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { migrateLegacyKeys } from "./lib/storage";

// Must run before any component reads storage, or users would briefly look logged out.
migrateLegacyKeys();

createRoot(document.getElementById("root")!).render(<App />);
