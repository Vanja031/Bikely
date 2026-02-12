import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import "./App.css";
import App from "./App.jsx";
import { AdminLogin } from "./pages/AdminLogin.jsx";
import { AdminLayout } from "./components/AdminLayout.jsx";
import { AdminDashboard } from "./pages/AdminDashboard.jsx";
import { AdminBikes } from "./pages/AdminBikes.jsx";
import { AdminParking } from "./pages/AdminParking.jsx";
import { AdminRentals } from "./pages/AdminRentals.jsx";
import { AdminIssues } from "./pages/AdminIssues.jsx";
import { ModalProvider } from "./contexts/ModalContext.jsx";
import { ToastProvider } from "./contexts/ToastContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <ModalProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="bikes" element={<AdminBikes />} />
              <Route path="parking" element={<AdminParking />} />
              <Route path="rentals" element={<AdminRentals />} />
              <Route path="issues" element={<AdminIssues />} />
            </Route>
            <Route path="*" element={<App />} />
          </Routes>
        </BrowserRouter>
      </ModalProvider>
    </ToastProvider>
  </StrictMode>
);
