import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import React from "react";
import { RouterProvider } from "react-router-dom";
import { AuthContextProvider } from "./context/AuthContext";
import { AvatarProvider } from "./context/AvatarContext.jsx";
import { router } from "./routes/routes";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthContextProvider>
      <AvatarProvider>
        <RouterProvider router={router} />
      </AvatarProvider>
    </AuthContextProvider>
  </StrictMode>,
);
