import { createRoot } from "react-dom/client";

// Force dark theme app-wide
document.documentElement.classList.add('dark');
try { localStorage.setItem('theme', 'dark'); } catch {}

import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
