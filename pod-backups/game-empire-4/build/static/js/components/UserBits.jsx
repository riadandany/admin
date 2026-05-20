import React from "react";
import { Crown, ShieldCheck, Code2 } from "lucide-react";

export function RoleBadge({ role, color }) {
  if (role === "owner") {
    return (
      <span className="inline-flex items-center gap-1 text-mono text-xs px-2 py-0.5 rounded-md" style={{ background: "rgba(0,255,163,.12)", color: "#00FFA3", border: "1px solid rgba(0,255,163,.4)" }} title="Owner">
        <Crown size={12} /> OWNER
      </span>
    );
  }
  if (role === "developer") {
    return (
      <span className="inline-flex items-center gap-1 text-mono text-xs px-2 py-0.5 rounded-md" style={{ background: "rgba(255,92,0,.12)", color: "#FF5C00", border: "1px solid rgba(255,92,0,.45)" }} title="Developer">
        <Code2 size={12} /> DEV
      </span>
    );
  }
  if (role === "moderator") {
    return (
      <span className="inline-flex items-center gap-1 text-mono text-xs px-2 py-0.5 rounded-md" style={{ background: "rgba(255,0,60,.12)", color: "#FF003C", border: "1px solid rgba(255,0,60,.45)" }} title="Moderator">
        <ShieldCheck size={12} /> MOD
      </span>
    );
  }
  return null;
}

export function VerifyMark({ color }) {
  if (!color) return null;
  const c = { blue: "#3b82f6", green: "#00FFA3", orange: "#FF5C00", red: "#FF003C" }[color] || color;
  return (
    <span title="Verified" data-testid="verify-badge" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, marginInlineStart: 4, color: c, filter: `drop-shadow(0 0 6px ${c})` }}>
      <ShieldCheck size={14} />
    </span>
  );
}

export function PremiumCrown({ active }) {
  if (!active) return null;
  return <Crown size={14} className="inline-block ms-1" style={{ color: "#FFD700", filter: "drop-shadow(0 0 6px rgba(255,215,0,.7))" }} />;
}

export function UserName({ user, className = "" }) {
  const color = user?.active_name_color;
  const deco = user?.active_name_decoration;
  const premium = user?.premium_cosmetic_until && new Date(user.premium_cosmetic_until) > new Date();
  const isOwner = user?.role === "owner";
  return (
    <span className={`inline-flex items-center ${className}`}>
      <span
        className={`${color ? "name-premium" : "font-bold"} ${deco ? `deco-${deco}` : ""}`}
        style={color ? { "--name-color": color } : {}}
      >
        {user?.name || user?.username}
      </span>
      <VerifyMark color={user?.verify_color || (user?.is_verified ? "blue" : null)} />
      <PremiumCrown active={premium || isOwner} />
    </span>
  );
}

export function Avatar({ user, size = 48 }) {
  const frame = user?.active_profile_frame;
  const effect = user?.active_profile_effect;
  const cls = `inline-block ${frame ? `frame-${frame}` : ""} ${effect ? `eff-${effect}` : ""}`;
  const initials = (user?.name || user?.username || "?").slice(0, 1).toUpperCase();
  return (
    <div className={cls} style={{ width: size, height: size, borderRadius: "9999px" }}>
      {user?.avatar_url ? (
        <img src={user.avatar_url} alt="" style={{ width: size, height: size, borderRadius: "9999px", objectFit: "cover" }} />
      ) : (
        <div style={{ width: size, height: size, borderRadius: "9999px", background: "linear-gradient(135deg,#00FFA3,#1A1D24)", color: "#06120c", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, fontFamily: "Unbounded" }}>
          {initials}
        </div>
      )}
    </div>
  );
}
