import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppProvider, useApp } from './context/AppContext';
import Auth from './pages/Auth';
import Home from './pages/Home';
import AdminDev from './pages/AdminDev';
import Maintenance from './pages/Maintenance';
import './App.css';

function Protected({ children, allowMaintenanceBypass = false }) {
  const { user, loading, siteSettings } = useApp();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/auth" replace />;
  if (user.banned_until && new Date(user.banned_until) > new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0B0C10] p-6">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-rose-500 mb-3">تم حظر حسابك</h1>
          <p className="text-zinc-500">حتى: {new Date(user.banned_until).toLocaleString()}</p>
          {user.ban_reason && <p className="text-sm mt-2 text-zinc-600 dark:text-zinc-300">السبب: {user.ban_reason}</p>}
        </div>
      </div>
    );
  }
  if (siteSettings.maintenance && !allowMaintenanceBypass && user.role !== 'owner' && user.role !== 'developer') return <Maintenance />;
  return children;
}

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0C10]">
      <div className="flex items-end gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '120ms' }} />
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '240ms' }} />
      </div>
    </div>
  );
}

function RouterContent() {
  const { user, loading, siteSettings } = useApp();
  useEffect(() => { document.title = siteSettings?.site_name || 'WaveChat'; }, [siteSettings?.site_name]);
  if (loading) return <Loader />;
  if (siteSettings.maintenance && !user) {
    return (
      <Routes>
        <Route path="/admin-dev" element={<AdminDev />} />
        <Route path="*" element={<Maintenance />} />
      </Routes>
    );
  }
  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
      <Route path="/admin-dev" element={<AdminDev />} />
      <Route path="/" element={<Protected><Home /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster position="top-center" richColors />
        <RouterContent />
      </BrowserRouter>
    </AppProvider>
  );
}
