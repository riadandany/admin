import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useSite } from "../lib/site";
import { Avatar, UserName, RoleBadge } from "./UserBits";
import { MessageSquare, UserPlus } from "lucide-react";

export default function ProfilePopup({ username, onClose }) {
  const [u, setU] = useState(null);
  const { user: me } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!username) return;
    api.get(`/users/${username}`).then((r) => setU(r.data));
  }, [username]);
  if (!username) return null;
  const addFriend = async () => {
    if (!u) return;
    try { await api.post(`/friends/request/${u.id}`); alert("تم إرسال الطلب"); } catch (e) { alert(e?.response?.data?.detail || "خطأ"); }
  };
  const message = () => { onClose(); nav(`/chat?dm=${u?.id}`); };
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={onClose} data-testid="profile-popup">
      <div className="glass-strong w-full max-w-md p-6 eff-glow" onClick={(e) => e.stopPropagation()}>
        {!u ? <div className="text-mono text-sm opacity-70">...</div> : (
          <>
            <div className="flex items-center gap-4">
              <Avatar user={u} size={84} />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap"><UserName user={u} className="text-xl" /> <RoleBadge role={u.role} /></div>
                <div className="text-mono text-xs text-[var(--text-muted)]">@{u.username} · Lv.{u.level}</div>
                <div className="text-mono text-[11px] text-[var(--text-muted)] mt-1">⏱ {Number(u.hours_played||0).toFixed(1)}h · ⭐ {u.xp} XP</div>
              </div>
            </div>
            {u.description && <p className="mt-4 text-sm text-[var(--text-secondary)] leading-relaxed">{u.description}</p>}
            {me && me.id !== u.id && (
              <div className="mt-5 flex gap-2">
                <button className="btn-accent flex-1 inline-flex items-center justify-center gap-1" onClick={addFriend} data-testid="popup-add-friend">
                  <UserPlus size={14} /> إضافة صديق
                </button>
                <button className="btn-ghost flex-1 inline-flex items-center justify-center gap-1" onClick={message} data-testid="popup-message">
                  <MessageSquare size={14} /> تواصل
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
