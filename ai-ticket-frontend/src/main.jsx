import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthProvider from "./auth/auth.provider.jsx";
import CheckAuth from "./components/check-auth.jsx";
import Layout from "./components/layout.jsx";
import "./index.css";
import Admin from "./pages/admin.jsx";
import Login from "./pages/login.jsx";
import Signup from "./pages/signup.jsx";
import TicketDetailsPage from "./pages/ticket.jsx";
import Tickets from "./pages/tickets.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route
              path="/"
              element={
                <CheckAuth isProtected>
                  <Tickets />
                </CheckAuth>
              }
            />
            <Route
              path="/tickets/:id"
              element={
                <CheckAuth isProtected>
                  <TicketDetailsPage />
                </CheckAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <CheckAuth isProtected allowedRoles={["admin"]}>
                  <Admin />
                </CheckAuth>
              }
            />
          </Route>

          <Route
            path="/login"
            element={
              <CheckAuth isProtected={false}>
                <Login />
              </CheckAuth>
            }
          />
          <Route
            path="/signup"
            element={
              <CheckAuth isProtected={false}>
                <Signup />
              </CheckAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

