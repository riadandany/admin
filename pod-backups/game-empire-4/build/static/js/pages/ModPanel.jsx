import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { Avatar, UserName } from "../components/UserBits";

export default function ModPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const load = () => api.get(`/staff/users${q ? `?q=${encodeURIComponent(q)}` : ""}`).then((r) => setUsers(r.data));
  useEffect(() => { load(); }, []); // eslint-disable-line
  if (user?.role !== "moderator") return <div className="p-10 text-center">Forbidden</div>;
  const ban = async (id) => {
    const reason = prompt("سبب الحظر؟") || "";
    const hours = Number(prompt("مدة الحظر بالساعات (0=دائم)") || 0);
    await api.post(`/staff/ban/${id}`, { reason, hours }); load();
  };
  const unban = async (id) => { await api.post(`/staff/unban/${id}`); load(); };
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 relative z-10">
      <h1 className="text-display text-4xl font-black mb-4" style={{ color: "#FF003C" }}>لوحة المشرف</h1>
      <div className="glass p-4">
        <div className="flex gap-2 mb-3"><input className="input-cyber" placeholder="بحث..." value={q} onChange={(e) => setQ(e.target.value)} /><button onClick={load} className="btn-accent">بحث</button></div>
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 py-2 border-b border-white/5">
            <Avatar user={u} size={32} /><UserName user={u} className="text-sm flex-1" />
            {u.is_banned ? <button onClick={() => unban(u.id)} className="btn-ghost text-xs">فك الحظر</button> : <button onClick={() => ban(u.id)} className="btn-danger text-xs">حظر</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
