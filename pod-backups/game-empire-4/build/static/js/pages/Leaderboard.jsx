import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { Avatar, UserName } from "../components/UserBits";

export default function Leaderboard() {
  const [scope, setScope] = useState("global");
  const [list, setList] = useState([]);
  useEffect(() => { api.get(`/leaderboard?scope=${scope}`).then((r) => setList(r.data)); }, [scope]);
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 relative z-10">
      <h1 className="text-display text-4xl font-black neon-text mb-4">المتصدرون</h1>
      <div className="glass p-2 inline-flex gap-2 mb-4">
        <button onClick={() => setScope("global")} className={`px-3 py-1.5 rounded ${scope==="global"?"bg-[var(--accent)]/15 text-[var(--accent)]":""}`} data-testid="lb-global">عالمي</button>
        <button onClick={() => setScope("friends")} className={`px-3 py-1.5 rounded ${scope==="friends"?"bg-[var(--accent)]/15 text-[var(--accent)]":""}`} data-testid="lb-friends">الأصدقاء</button>
      </div>
      <div className="glass divide-y divide-white/5">
        {list.map((u, i) => (
          <div key={u.id} className="p-3 flex items-center gap-3" data-testid={`lb-row-${i}`}>
            <div className="text-mono text-display text-2xl w-10" style={{ color: i < 3 ? ["#FFD700", "#bdbdbd", "#cd7f32"][i] : "white" }}>#{i + 1}</div>
            <Avatar user={u} size={36} />
            <div className="flex-1"><UserName user={u} className="text-sm" /></div>
            <div className="text-mono text-sm text-[var(--accent)]">{Number(u.hours_played || 0).toFixed(1)}h</div>
          </div>
        ))}
        {list.length === 0 && <div className="p-10 text-center text-mono text-sm text-[var(--text-muted)]">لا يوجد بيانات</div>}
      </div>
    </div>
  );
}
