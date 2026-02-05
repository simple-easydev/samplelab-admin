import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SWRProvider from "@/components/SWRProvider";
import AdminGuard from "@/components/AdminGuard";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import SetupAdmin from "@/pages/SetupAdmin";
import Dashboard from "@/pages/Dashboard";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import Users from "@/pages/admin/Users";
import Customers from "@/pages/admin/Customers";
import Samples from "@/pages/admin/Samples";
import Analytics from "@/pages/admin/Analytics";
import Invite from "@/pages/admin/Invite";

export default function App() {
  return (
    <SWRProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/auth/setup" element={<SetupAdmin />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route
            path="/admin"
            element={
              <AdminGuard>
                <AdminLayout />
              </AdminGuard>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="users/invite" element={<Invite />} />
            <Route path="customers" element={<Customers />} />
            <Route path="samples" element={<Samples />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SWRProvider>
  );
}
