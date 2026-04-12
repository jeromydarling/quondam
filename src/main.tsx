import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./styles/index.css";

// HashRouter (rather than BrowserRouter) so the app works on GitHub Pages
// without a 404.html redirect trick — direct visits to /play/:id work
// because the path lives in the URL fragment.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
