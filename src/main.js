import { supabase } from "./utils/supabaseClient";
supabase.auth.getSession().then(console.log);
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";

// React 18 entry point: find <div id="root"> in index.html and render <App /> inside it
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
