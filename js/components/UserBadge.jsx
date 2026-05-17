import React from 'react';
import { Crown, ShieldCheck, BadgeCheck } from 'lucide-react';

// Returns inline style based on user role / customization
export function getNameStyle(profile) {
  if (!profile) return {};
  if (profile.role === 'owner') {
    return {
      background: 'linear-gradient(90deg, #059669 0%, #ffffff 50%, #059669 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontWeight: 700,
    };
  }
  if (profile.role === 'developer') {
    return {
      background: 'linear-gradient(90deg, #E11D48 0%, #ffffff 50%, #E11D48 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontWeight: 700,
    };
  }
  if (profile.premium_until && new Date(profile.premium_until) > new Date()) {
    return {
      background: 'linear-gradient(90deg, #D4AF37 0%, #ffffff 50%, #D4AF37 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontWeight: 700,
    };
  }
  if (profile.name_color) {
    return { color: profile.name_color, fontWeight: 600 };
  }
  return {};
}

export default function UserBadge({ profile, size = 14, showName = true, className = '' }) {
  if (!profile) return null;
  const isPremium = profile.premium_until && new Date(profile.premium_until) > new Date();
  const isOwner = profile.role === 'owner';
  const isDev = profile.role === 'developer';
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} data-testid={`user-badge-${profile.username}`}>
      {showName && (
        <span style={getNameStyle(profile)} className="truncate">
          {profile.display_name || profile.username}
        </span>
      )}
      {isOwner && (
        <span className="inline-flex items-center justify-center rounded-full bg-emerald-600 text-white p-[2px]" title="Owner">
          <Crown size={size} />
        </span>
      )}
      {isDev && (
        <span className="inline-flex items-center justify-center rounded-full bg-rose-600 text-white p-[2px]" title="Developer">
          <ShieldCheck size={size} />
        </span>
      )}
      {!isOwner && !isDev && isPremium && (
        <span className="inline-flex items-center justify-center rounded-full bg-amber-500 text-white p-[2px]" title="Premium">
          <Crown size={size - 2} />
        </span>
      )}
      {profile.verified && !isOwner && !isDev && (
        <BadgeCheck size={size} className="text-sky-500" />
      )}
    </span>
  );
}

export function FramedAvatar({ profile, size = 44 }) {
  if (!profile) return null;
  const frameColor = profile.frame_id ? profile.frame_id : null;
  const initials = (profile.display_name || profile.username || '?').slice(0, 1).toUpperCase();
  const wrapperStyle = frameColor
    ? { padding: 3, background: `linear-gradient(135deg, ${frameColor} 0%, rgba(255,255,255,0.2) 100%)`, borderRadius: '9999px' }
    : { padding: 0 };
  return (
    <div style={wrapperStyle} className="shrink-0">
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
      >
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
        ) : (
          <span className="text-zinc-700 dark:text-zinc-200 font-semibold">{initials}</span>
        )}
      </div>
    </div>
  );
}
