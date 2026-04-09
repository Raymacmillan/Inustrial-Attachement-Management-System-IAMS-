import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import React from "react";
import { RouterProvider } from "react-router-dom";
import { AuthContextProvider } from "./context/AuthContext";
import { AvatarProvider } from "./context/AvatarContext.jsx";
import { router } from "./routes/routes";
import ErrorBoundary from "./components/ui/ErrorBoundary";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthContextProvider>
        <AvatarProvider>
          <RouterProvider router={router} />
        </AvatarProvider>
      </AuthContextProvider>
    </ErrorBoundary>
  </StrictMode>,
);