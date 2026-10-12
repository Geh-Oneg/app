import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DriverDashboard from "@/pages/DriverDashboard";
import NewOrderPage from "@/pages/NewOrderPage";
import AdminDashboard from "@/pages/AdminDashboard";
import VehiclesPage from "@/pages/VehiclesPage";
import UsersPage from "@/pages/UsersPage";
import OSPrintPage from "@/pages/OSPrintPage";

function Protected({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === "supervisor" ? "/admin" : "/driver"} replace />;
  return children;
}

function Root() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "supervisor" ? "/admin" : "/driver"} replace />;
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          <Routes>
            <Route path="/" element={<Root />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/driver" element={<Protected role="motorista"><DriverDashboard /></Protected>} />
            <Route path="/driver/new" element={<Protected role="motorista"><NewOrderPage /></Protected>} />

            <Route path="/admin" element={<Protected role="supervisor"><AdminDashboard /></Protected>} />
            <Route path="/admin/vehicles" element={<Protected role="supervisor"><VehiclesPage /></Protected>} />
            <Route path="/admin/users" element={<Protected role="supervisor"><UsersPage /></Protected>} />

            <Route path="/os/:id/print" element={<Protected><OSPrintPage /></Protected>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
