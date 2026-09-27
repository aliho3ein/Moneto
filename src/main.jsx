import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { captureJoinParams } from "./joinParams";

// Vor allem anderen: die Parameter aus dem Einladungslink sichern,
// sie überleben damit den Google-Login.
captureJoinParams();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);