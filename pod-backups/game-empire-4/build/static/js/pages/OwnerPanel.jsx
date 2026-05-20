import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { Avatar, UserName } from "../components/UserBits";

export default function OwnerPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [codes, setCodes] = useState([]);
  const [tab, setTab] = useState("users");

  const loadUsers = () => api.get(`/staff/users${q ? `?q=${encodeURIComponent(q)}` : ""}`).then((r) => setUsers(r.data));
  const loadCodes = () => api.get("/owner/codes").then((r) => setCodes(r.data));
  useEffect(() => { loadUsers(); loadCodes(); }, []); // eslint-disable-line

  if (user?.role !== "owner") return <div className="p-10 text-center">Forbidden</div>;

  const ban = async (id) => {
    const reason = prompt("سبب الحظر؟") || "";
    const hours = Number(prompt("مدة الحظر بالساعات (0=دائم)") || 0);
    await api.post(`/staff/ban/${id}`, { reason, hours });
    loadUsers();
  };
  const unban = async (id) => { await api.post(`/staff/unban/${id}`); loadUsers(); };
  const newCode = async () => {
    const code = prompt("الكود؟"); if (!code) return;
    const pts = Number(prompt("نقاط المكافأة?") || 0);
    const max = Number(prompt("أقصى استخدام?") || 1);
    await api.post("/owner/codes", { code, reward_points: pts, max_uses: max }); loadCodes();
  };
  const delCode = async (id) => { await api.delete(`/owner/codes/${id}`); loadCodes(); };
  const newAd = async () => {
    const title = prompt("عنوان الإعلان") || ""; const desc = prompt("الوصف") || "";
    await api.post("/owner/ads", { title, description: desc, placement: "banner", bg_color: "#00FFA3", text_color: "#050505", is_active: true });
    alert("تم");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">
      <h1 className="text-display text-4xl font-black neon-text mb-4">لوحة المالك</h1>
      <div className="glass p-2 inline-flex gap-2 mb-4">
        <button onClick={() => setTab("users")} className={`px-3 py-1.5 rounded ${tab==="users"?"bg-[var(--accent)]/15 text-[var(--accent)]":""}`} data-testid="owner-tab-users">المستخدمين</button>
        <button onClick={() => setTab("codes")} className={`px-3 py-1.5 rounded ${tab==="codes"?"bg-[var(--accent)]/15 text-[var(--accent)]":""}`} data-testid="owner-tab-codes">الأكواد</button>
        <button onClick={() => setTab("ads")} className={`px-3 py-1.5 rounded ${tab==="ads"?"bg-[var(--accent)]/15 text-[var(--accent)]":""}`} data-testid="owner-tab-ads">إعلانات</button>
      </div>
      {tab === "users" && (
        <div className="glass p-4">
          <div className="flex gap-2 mb-3"><input className="input-cyber" placeholder="بحث..." value={q} onChange={(e) => setQ(e.target.value)} /><button onClick={loadUsers} className="btn-accent">بحث</button></div>
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-2 border-b border-white/5">
              <Avatar user={u} size={32} /><UserName user={u} className="text-sm flex-1" />
              {u.is_banned ? <button onClick={() => unban(u.id)} className="btn-ghost text-xs">فك الحظر</button> : <button onClick={() => ban(u.id)} className="btn-danger text-xs">حظر</button>}
            </div>
          ))}
        </div>
      )}
      {tab === "codes" && (
        <div className="glass p-4">
          <button onClick={newCode} className="btn-accent mb-3">إضافة كود</button>
          {codes.map((c) => (
            <div key={c.id} className="flex items-center gap-3 py-2 border-b border-white/5">
              <div className="text-mono flex-1">{c.code}</div>
              <div className="text-xs text-[var(--text-muted)]">+{c.reward_points} pts · {c.used_count}/{c.max_uses}</div>
              <button onClick={() => delCode(c.id)} className="btn-danger text-xs">حذف</button>
            </div>
          ))}
        </div>
      )}
      {tab === "ads" && (
        <div className="glass p-4">
          <button onClick={newAd} className="btn-accent">إضافة إعلان سريع</button>
          <div className="text-xs mt-2 text-[var(--text-muted)]">للتفاصيل، استخدم لوحة المطور /admin-dev</div>
        </div>
      )}
    </div>
  );
}
