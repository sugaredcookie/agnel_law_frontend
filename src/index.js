import React from "react";
import "./index.css";
import ReactDOM from "react-dom/client";
import App from "./App";

export const DepartmentContext = React.createContext();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <DepartmentContext.Provider value={{}}>
      <App />
    </DepartmentContext.Provider>
  </React.StrictMode>,
);
