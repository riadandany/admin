import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { Avatar, UserName } from "../components/UserBits";

export default function Friends() {
  const [tab, setTab] = useState("friends");
  const [friends, setFriends] = useState([]);
  const [reqs, setReqs] = useState([]);
  const [q, setQ] = useState("");
  const [searchRes, setSearchRes] = useState([]);
  const load = () => {
    api.get("/friends").then((r) => setFriends(r.data));
    api.get("/friends/requests").then((r) => setReqs(r.data));
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (q.length < 2) { setSearchRes([]); return; }
    const t = setTimeout(() => api.get(`/users/search?q=${encodeURIComponent(q)}`).then((r) => setSearchRes(r.data)), 300);
    return () => clearTimeout(t);
  }, [q]);
  const addFriend = async (id) => {
    try { await api.post(`/friends/request/${id}`); alert("تم إرسال الطلب"); }
    catch (e) { alert(e?.response?.data?.detail); }
  };
  const respond = async (rid, accept) => {
    await api.post(`/friends/respond/${rid}?accept=${accept}`); load();
  };
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 relative z-10">
      <h1 className="text-display text-4xl font-black neon-text mb-4">الأصدقاء</h1>
      <div className="glass p-2 inline-flex gap-2 mb-4">
        <button onClick={() => setTab("friends")} className={`px-3 py-1.5 rounded ${tab==="friends"?"bg-[var(--accent)]/15 text-[var(--accent)]":""}`} data-testid="friends-tab-list">قائمتي ({friends.length})</button>
        <button onClick={() => setTab("reqs")} className={`px-3 py-1.5 rounded ${tab==="reqs"?"bg-[var(--accent)]/15 text-[var(--accent)]":""}`} data-testid="friends-tab-reqs">الطلبات ({reqs.length})</button>
        <button onClick={() => setTab("search")} className={`px-3 py-1.5 rounded ${tab==="search"?"bg-[var(--accent)]/15 text-[var(--accent)]":""}`} data-testid="friends-tab-search">إضافة</button>
      </div>
      {tab === "friends" && (
        <div className="glass divide-y divide-white/5" data-testid="friends-list">
          {friends.map((f) => (
            <div key={f.id} className="p-3 flex items-center gap-3"><Avatar user={f} size={36}/><UserName user={f} className="text-sm flex-1"/></div>
          ))}
          {friends.length === 0 && <div className="p-6 text-center text-mono text-sm text-[var(--text-muted)]">لا يوجد أصدقاء</div>}
        </div>
      )}
      {tab === "reqs" && (
        <div className="glass divide-y divide-white/5">
          {reqs.map((r) => (
            <div key={r.request_id} className="p-3 flex items-center gap-3" data-testid={`fr-req-${r.request_id}`}>
              <Avatar user={r.from} size={36}/><UserName user={r.from} className="text-sm flex-1"/>
              <button onClick={() => respond(r.request_id, true)} className="btn-accent text-xs">قبول</button>
              <button onClick={() => respond(r.request_id, false)} className="btn-danger text-xs">رفض</button>
            </div>
          ))}
          {reqs.length === 0 && <div className="p-6 text-center text-mono text-sm text-[var(--text-muted)]">لا توجد طلبات</div>}
        </div>
      )}
      {tab === "search" && (
        <div>
          <input className="input-cyber mb-3" placeholder="ابحث عن اسم مستخدم..." value={q} onChange={(e) => setQ(e.target.value)} data-testid="friends-search" />
          <div className="glass divide-y divide-white/5">{searchRes.map((u) => (
            <div key={u.id} className="p-3 flex items-center gap-3" data-testid={`search-result-${u.username}`}>
              <Avatar user={u} size={36}/><UserName user={u} className="text-sm flex-1"/>
              <button onClick={() => addFriend(u.id)} className="btn-accent text-xs">إضافة</button>
            </div>
          ))}</div>
        </div>
      )}
    </div>
  );
}
