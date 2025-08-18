import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { RobotsProvider } from "./robots/RobotsContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RobotsProvider>
      <App />
    </RobotsProvider>
  </StrictMode>
);
