import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/index.css";

// StrictMode intentionally omitted: the engine is imperative (Three.js render
// loop + global event listeners + Web Audio) and StrictMode's double-mount in
// dev would start it twice. App mounts the engine exactly once via a hook.
createRoot(document.getElementById("root")).render(<App />);
