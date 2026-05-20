import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Settings, MessageSquare, Trophy, ShoppingBag, Crown, Code2, ShieldCheck, UserPlus } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useSite } from "../lib/site";
import { useT } from "../i18n";
import { Avatar, UserName } from "./UserBits";

export default function TopBar() {
  const { user, logout } = useAuth();
  const { settings, lang } = useSite();
  const t = useT(lang);
  const nav = useNavigate();

  const NavBtn = ({ to, icon: Icon, label, testId }) => (
    <Link to={to} data-testid={testId} className="btn-ghost inline-flex items-center gap-2 text-sm">
      <Icon size={16} /> <span className="hidden md:inline">{label}</span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-white/5" data-testid="top-bar">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 justify-between">
        <Link to="/" className="flex items-center gap-2" data-testid="home-link">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="" className="w-9 h-9 rounded-md object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-md grid place-items-center bg-[var(--accent)] text-black font-black neon-glow text-display">M</div>
          )}
          <span className="text-display font-black text-xl tracking-tight neon-text">{settings?.site_name || "Mr Games"}</span>
        </Link>

        <nav className="flex items-center gap-2 flex-wrap justify-end">
          <NavBtn to="/" icon={Trophy} label={t("games")} testId="nav-games" />
          <NavBtn to="/chat" icon={MessageSquare} label={t("chat")} testId="nav-chat" />
          <NavBtn to="/store" icon={ShoppingBag} label={t("store")} testId="nav-store" />
          <NavBtn to="/leaderboard" icon={Trophy} label={t("leaderboard")} testId="nav-leaderboard" />
          <NavBtn to="/friends" icon={UserPlus} label={t("friends")} testId="nav-friends" />
          <NavBtn to="/settings" icon={Settings} label={t("settings")} testId="nav-settings" />

          {user?.role === "owner" && (
            <Link to="/owner" className="btn-accent inline-flex items-center gap-1 text-sm" data-testid="nav-owner">
              <Crown size={14} /> {t("owner_panel")}
            </Link>
          )}
          {user?.role === "moderator" && (
            <Link to="/mod" className="btn-ghost inline-flex items-center gap-1 text-sm" style={{ borderColor: "rgba(255,0,60,.45)", color: "#FF003C" }} data-testid="nav-mod">
              <ShieldCheck size={14} /> {t("mod_panel")}
            </Link>
          )}
          {user?.role === "developer" && (
            <span className="btn-ghost inline-flex items-center gap-1 text-sm" style={{ borderColor: "rgba(255,92,0,.45)", color: "#FF5C00" }}>
              <Code2 size={14} /> DEV
            </span>
          )}

          {user && (
            <div className="flex items-center gap-2 ms-2 ps-2 border-s border-white/10">
              <Avatar user={user} size={34} />
              <div className="hidden md:flex flex-col leading-tight">
                <UserName user={user} className="text-sm" />
                <span className="text-mono text-[10px] text-[var(--text-muted)]">Lv.{user.level} · {user.points} pts</span>
              </div>
              <button data-testid="logout-btn" onClick={() => { logout(); nav("/login"); }} className="btn-ghost p-2" title={t("logout")}>
                <LogOut size={16} />
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
