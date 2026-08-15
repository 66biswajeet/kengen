import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import InstallPrompt from "./components/InstallPrompt";

import Splash from "./pages/Splash";
import Branding from "./pages/Branding";
import RoleSelect from "./pages/RoleSelect";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LocationPermission from "./pages/LocationPermission";

// Client
import Home from "./pages/client/Home";
import ServiceDetail from "./pages/client/ServiceDetail";
import CategoryList from "./pages/client/CategoryList";
import Cart from "./pages/client/Cart";
import Checkout from "./pages/client/Checkout";
import BookingConfirmation from "./pages/client/BookingConfirmation";
import Bookings from "./pages/client/Bookings";
import BookingDetail from "./pages/client/BookingDetail";
import Rating from "./pages/client/Rating";
import Account from "./pages/client/Account";
import HelpSupport from "./pages/HelpSupport";
import Addresses from "./pages/client/Addresses";
import Notifications from "./pages/Notifications";

// Provider
import ProviderJobs from "./pages/provider/Jobs";
import ProviderSchedule from "./pages/provider/Schedule";
import ProviderEarnings from "./pages/provider/Earnings";
import ProviderAccount from "./pages/provider/Account";
import ProviderJobDetail from "./pages/provider/JobDetail";

// Admin
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProviders from "./pages/admin/Providers";
import AdminBookings from "./pages/admin/Bookings";
import AdminServices from "./pages/admin/Services";
import AdminSettings from "./pages/admin/Settings";

function ProtectedRoute({ children, allowRoles }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="app-shell flex items-center justify-center"><img src="/kengen_loading1.gif" alt="Loading..." className="w-16 h-16 object-contain" /></div>;
  const isAdminRoute = loc.pathname.startsWith("/admin");
  if (!user) return <Navigate to={isAdminRoute ? "/admin/login" : "/login"} state={{ from: loc }} replace />;
  if (allowRoles && !allowRoles.includes(user.role)) {
    if (isAdminRoute) return <Navigate to="/admin/login" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
}

function RoleRoot() {
  const { user, role } = useAuth();
  if (!user && !role) return <Navigate to="/role" replace />;
  if (user?.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === "provider") return <Navigate to="/provider/jobs" replace />;
  return <Navigate to="/home" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="grain">
        <Toaster position="top-center" richColors closeButton />
        <InstallPrompt />
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/branding" element={<Branding />} />
          <Route path="/role" element={<RoleSelect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/location" element={<LocationPermission />} />

          {/* Client */}
          <Route path="/home" element={<ProtectedRoute allowRoles={["service_needer"]}><Home /></ProtectedRoute>} />
          <Route path="/category/:id" element={<ProtectedRoute allowRoles={["service_needer"]}><CategoryList /></ProtectedRoute>} />
          <Route path="/service/:id" element={<ProtectedRoute allowRoles={["service_needer"]}><ServiceDetail /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute allowRoles={["service_needer"]}><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute allowRoles={["service_needer"]}><Checkout /></ProtectedRoute>} />
          <Route path="/booking/:id/confirmation" element={<ProtectedRoute allowRoles={["service_needer"]}><BookingConfirmation /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute allowRoles={["service_needer"]}><Bookings /></ProtectedRoute>} />
          <Route path="/booking/:id" element={<ProtectedRoute allowRoles={["service_needer"]}><BookingDetail /></ProtectedRoute>} />
          <Route path="/booking/:id/rate" element={<ProtectedRoute allowRoles={["service_needer"]}><Rating /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute allowRoles={["service_needer", "provider"]}><Account /></ProtectedRoute>} />
          <Route path="/account/addresses" element={<ProtectedRoute allowRoles={["service_needer"]}><Addresses /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/help" element={<HelpSupport />} />

          {/* Provider */}
          <Route path="/provider/jobs" element={<ProtectedRoute allowRoles={["provider"]}><ProviderJobs /></ProtectedRoute>} />
          <Route path="/provider/schedule" element={<ProtectedRoute allowRoles={["provider"]}><ProviderSchedule /></ProtectedRoute>} />
          <Route path="/provider/earnings" element={<ProtectedRoute allowRoles={["provider"]}><ProviderEarnings /></ProtectedRoute>} />
          <Route path="/provider/account" element={<ProtectedRoute allowRoles={["provider"]}><ProviderAccount /></ProtectedRoute>} />
          <Route path="/provider/job/:id" element={<ProtectedRoute allowRoles={["provider"]}><ProviderJobDetail /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute allowRoles={["admin"]}><AdminBookings /></ProtectedRoute>} />
          <Route path="/admin/providers" element={<ProtectedRoute allowRoles={["admin"]}><AdminProviders /></ProtectedRoute>} />
          <Route path="/admin/services" element={<ProtectedRoute allowRoles={["admin"]}><AdminServices /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowRoles={["admin"]}><AdminSettings /></ProtectedRoute>} />

          <Route path="/dashboard" element={<RoleRoot />} />
          <Route path="*" element={<RoleRoot />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}
