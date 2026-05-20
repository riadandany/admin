import React from "react";
import { useAuth } from "../lib/auth";

export default function Banned() {
  const { user, logout } = useAuth();
  if (!user?.is_banned) return null;
  return (
    <div className="min-h-screen bg-black grid place-items-center p-4 relative overflow-hidden" data-testid="banned-screen">
      <div className="absolute inset-0" style={{ background: "radial-gradient(800px 500px at center, rgba(255,0,60,0.18), transparent 70%)" }} />
      <div className="relative z-10 glass-strong p-8 max-w-lg text-center" style={{ borderColor: "rgba(255,0,60,0.5)" }}>
        <div className="text-mono text-xs text-[var(--negative)] mb-2">// ACCESS DENIED — ACCOUNT SUSPENDED</div>
        <div className="text-display text-3xl font-black mb-3" style={{ color: "#FF003C" }}>تم حظر حسابك</div>
        <div className="text-sm text-[var(--text-secondary)] mb-2"><b>السبب:</b> {user.ban_reason || "غير محدد"}</div>
        <div className="text-sm text-[var(--text-secondary)] mb-6"><b>تاريخ فك الحظر:</b> {user.ban_until ? new Date(user.ban_until).toLocaleString() : "حظر دائم"}</div>
        <button onClick={logout} className="btn-ghost">تسجيل خروج</button>
      </div>
    </div>
  );
}
