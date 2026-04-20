import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initCloudSync } from "./lib/cloudSync";

initCloudSync();

createRoot(document.getElementById("root")!).render(<App />);
