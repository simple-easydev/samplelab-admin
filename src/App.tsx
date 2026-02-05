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
import Invite from "@/pages/admin/Invite";
import Library from "@/pages/admin/library/Library";
import CreatePack from "@/pages/admin/library/CreatePack";
import Creators from "@/pages/admin/Creators";
import Plans from "@/pages/admin/Plans";
import Announcements from "@/pages/admin/Announcements";
import Roles from "@/pages/admin/Roles";
import Settings from "@/pages/admin/Settings";
import PlaceholderPage from "@/pages/admin/PlaceholderPage";

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
            
            {/* Library Routes - All go to same page with tabs */}
            <Route path="library" element={<Library />} />
            <Route path="library/packs/new" element={<CreatePack />} />
            <Route path="library/packs" element={<Navigate to="/admin/library?tab=packs" replace />} />
            <Route path="library/samples" element={<Navigate to="/admin/library?tab=samples" replace />} />
            <Route path="library/genres" element={<Navigate to="/admin/library?tab=genres" replace />} />
            <Route path="library/categories" element={<Navigate to="/admin/library?tab=categories" replace />} />
            <Route path="library/moods" element={<Navigate to="/admin/library?tab=moods" replace />} />
            
            {/* Creators */}
            <Route path="creators" element={<Creators />} />
            
            {/* Users */}
            <Route path="users" element={<Users />} />
            <Route path="users/invite" element={<Invite />} />
            
            {/* Plans & Credits Routes */}
            <Route path="plans" element={<Plans />} />
            <Route path="plans/tiers" element={<PlaceholderPage title="Plan Tiers" description="Manage subscription tiers" />} />
            <Route path="plans/credit-rules" element={<PlaceholderPage title="Credit Rules" description="Configure credit rules" />} />
            <Route path="plans/trial-settings" element={<PlaceholderPage title="Trial Settings" description="Manage trial periods" />} />
            <Route path="plans/top-up-packs" element={<PlaceholderPage title="Top-up Packs" description="Manage credit top-up packs" />} />
            
            {/* Announcements Routes */}
            <Route path="announcements" element={<Announcements />} />
            <Route path="announcements/banner" element={<PlaceholderPage title="Banners" description="Manage banner announcements" />} />
            <Route path="announcements/popups" element={<PlaceholderPage title="Pop-ups" description="Manage pop-up announcements" />} />
            
            {/* Admin & Roles */}
            <Route path="roles" element={<Roles />} />
            
            {/* Settings */}
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SWRProvider>
  );
}
