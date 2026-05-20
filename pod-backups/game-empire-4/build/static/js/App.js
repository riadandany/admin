import React, { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { SiteProvider, useSite } from "./lib/site";
import TopBar from "./components/TopBar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import GamesHome from "./pages/GamesHome";
import GamePlayer from "./pages/GamePlayer";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Store from "./pages/Store";
import Leaderboard from "./pages/Leaderboard";
import Friends from "./pages/Friends";
import AdminDev from "./pages/AdminDev";
import OwnerPanel from "./pages/OwnerPanel";
import ModPanel from "./pages/ModPanel";
import Banned from "./pages/Banned";
import Maintenance from "./pages/Maintenance";
import { Toaster } from "sonner";

function Protected({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="min-h-screen bg-cyber grid place-items-center text-mono">// LOADING...</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;
  if (user.is_banned) return <Banned />;
  return children;
}

function Shell({ children }) {
  const { settings } = useSite();
  // Optional bg override via settings.background_value
  const bgStyle = (() => {
    if (settings?.background_type === "image" && settings.background_value) {
      return { background: `url(${settings.background_value}) center/cover no-repeat fixed, #050505` };
    }
    if (settings?.background_type === "code" && settings.background_value) {
      try { return { background: settings.background_value }; } catch { return {}; }
    }
    return {};
  })();
  return (
    <div className="min-h-screen bg-cyber relative" style={bgStyle} data-testid="app-shell">
      {settings?.background_type === "video" && settings.background_value && (
        <video autoPlay loop muted playsInline className="fixed inset-0 w-full h-full object-cover -z-10 opacity-60">
          <source src={settings.background_value} />
        </video>
      )}
      <TopBar />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function AppInner() {
  const { settings } = useSite();
  const loc = useLocation();
  const isAdminRoute = loc.pathname.startsWith("/admin-dev");
  if (settings?.maintenance_mode && !isAdminRoute) return <Maintenance />;
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/admin-dev" element={<AdminDev />} />
      <Route path="/games/:slug" element={<Protected><GamePlayer /></Protected>} />
      <Route path="/" element={<Protected><Shell><GamesHome /></Shell></Protected>} />
      <Route path="/chat" element={<Protected><Shell><Chat /></Shell></Protected>} />
      <Route path="/store" element={<Protected><Shell><Store /></Shell></Protected>} />
      <Route path="/settings" element={<Protected><Shell><Settings /></Shell></Protected>} />
      <Route path="/leaderboard" element={<Protected><Shell><Leaderboard /></Shell></Protected>} />
      <Route path="/friends" element={<Protected><Shell><Friends /></Shell></Protected>} />
      <Route path="/owner" element={<Protected><Shell><OwnerPanel /></Shell></Protected>} />
      <Route path="/mod" element={<Protected><Shell><ModPanel /></Shell></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  useEffect(() => { document.documentElement.dir = (localStorage.getItem("lang") || "ar") === "ar" ? "rtl" : "ltr"; }, []);
  return (
    <SiteProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppInner />
          <Toaster richColors theme="dark" position="bottom-right" />
        </BrowserRouter>
      </AuthProvider>
    </SiteProvider>
  );
}
