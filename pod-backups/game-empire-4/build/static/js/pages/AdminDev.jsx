import React, { useEffect, useState } from "react";
import api, { setAdminToken, getAdminToken, clearAdminToken } from "../lib/api";

export default function AdminDev() {
  const [authed, setAuthed] = useState(!!getAdminToken());
  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;
  return <AdminDashboard onLogout={() => { clearAdminToken(); setAuthed(false); }} />;
}

function AdminLogin({ onLogin }) {
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    try { const r = await api.post("/admin/login", { username: u, password: p }); setAdminToken(r.data.token); onLogin(); }
    catch (e) { setErr("بيانات خاطئة"); }
  };
  return (
    <div className="min-h-screen bg-cyber grid place-items-center p-4 relative">
      <form onSubmit={submit} className="glass-strong p-8 w-full max-w-sm relative z-10 space-y-3" data-testid="admin-login">
        <div className="text-display text-2xl font-black neon-text text-center">لوحة المطور</div>
        <div className="text-mono text-[11px] text-[var(--text-muted)] text-center">// HIDDEN /admin-dev</div>
        <input className="input-cyber" placeholder="Username" value={u} onChange={(e) => setU(e.target.value)} data-testid="admin-username" />
        <input className="input-cyber" type="password" placeholder="Password" value={p} onChange={(e) => setP(e.target.value)} data-testid="admin-password" />
        {err && <div className="text-sm text-[var(--negative)]">{err}</div>}
        <button className="btn-accent w-full" data-testid="admin-login-submit">دخول</button>
      </form>
    </div>
  );
}

function AdminDashboard({ onLogout }) {
  const [tab, setTab] = useState("users");
  const tabs = [["users", "المستخدمين"], ["games", "الألعاب"], ["products", "المتجر"], ["codes", "الأكواد"], ["ads", "الإعلانات"], ["settings", "إعدادات الموقع"], ["lb", "جوائز التصدر"]];
  return (
    <div className="min-h-screen bg-cyber relative">
      <header className="glass-strong border-b border-white/5 p-3 flex items-center justify-between relative z-10">
        <div className="text-display text-xl font-black neon-text">CONTROL ROOM</div>
        <button onClick={onLogout} className="btn-danger">خروج</button>
      </header>
      <div className="max-w-7xl mx-auto p-4 relative z-10">
        <div className="glass p-2 inline-flex gap-1 mb-4 overflow-x-auto no-scrollbar">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-3 py-2 rounded-md text-sm whitespace-nowrap ${tab===k?"bg-[var(--accent)]/15 text-[var(--accent)]":"hover:bg-white/5"}`} data-testid={`admin-tab-${k}`}>{l}</button>
          ))}
        </div>
        {tab === "users" && <UsersAdmin />}
        {tab === "games" && <GamesAdmin />}
        {tab === "products" && <ProductsAdmin />}
        {tab === "codes" && <CodesAdmin />}
        {tab === "ads" && <AdsAdmin />}
        {tab === "settings" && <SettingsAdmin />}
        {tab === "lb" && <LBAdmin />}
      </div>
    </div>
  );
}

function UsersAdmin() {
  const [q, setQ] = useState(""); const [list, setList] = useState([]);
  const load = () => api.get(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`).then((r) => setList(r.data));
  useEffect(() => { load(); }, []); // eslint-disable-line
  const setRole = async (id, role) => { await api.put(`/admin/users/${id}`, { role }); load(); };
  const verify = async (u) => { const v = u.is_verified ? null : "blue"; await api.put(`/admin/users/${u.id}`, { is_verified: !u.is_verified, verify_color: v }); load(); };
  const ban = async (id) => { const reason = prompt("سبب الحظر؟") || ""; const hours = Number(prompt("المدة بالساعات (0=دائم)") || 0); await api.post(`/admin/users/${id}/ban`, { reason, hours }); load(); };
  const unban = async (id) => { await api.post(`/admin/users/${id}/unban`); load(); };
  return (
    <div className="glass p-4">
      <div className="flex gap-2 mb-3"><input className="input-cyber" placeholder="بحث باسم المستخدم..." value={q} onChange={(e) => setQ(e.target.value)} data-testid="admin-search-users" /><button onClick={load} className="btn-accent">بحث</button></div>
      <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead><tr className="text-mono text-xs text-[var(--text-muted)] text-start"><th className="p-2 text-start">User</th><th className="p-2">Email</th><th className="p-2">Role</th><th className="p-2">Points</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr></thead>
        <tbody>{list.map((u) => (
          <tr key={u.id} className="border-t border-white/5">
            <td className="p-2">{u.name}<div className="text-mono text-xs text-[var(--text-muted)]">@{u.username}</div></td>
            <td className="p-2 text-xs">{u.email}</td>
            <td className="p-2">
              <select value={u.role} onChange={(e) => setRole(u.id, e.target.value)} className="input-cyber py-1 text-xs" data-testid={`role-${u.username}`}>
                {["user", "moderator", "developer", "owner"].map((r) => <option key={r}>{r}</option>)}
              </select>
            </td>
            <td className="p-2 text-mono">{u.points}</td>
            <td className="p-2 text-xs">{u.is_banned ? <span className="text-[var(--negative)]">BANNED</span> : <span className="text-[var(--positive)]">OK</span>}</td>
            <td className="p-2 flex gap-1">
              <button onClick={() => verify(u)} className="btn-ghost text-xs" data-testid={`verify-${u.username}`}>{u.is_verified ? "إزالة توثيق" : "توثيق"}</button>
              {u.is_banned ? <button onClick={() => unban(u.id)} className="btn-ghost text-xs">فك الحظر</button> : <button onClick={() => ban(u.id)} className="btn-danger text-xs">حظر</button>}
            </td>
          </tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}

function CRUD({ endpoint, fields, title, listKey = "id", initialValues = {} }) {
  const [items, setItems] = useState([]); const [edit, setEdit] = useState(null);
  const load = () => api.get(endpoint).then((r) => setItems(r.data));
  useEffect(() => { load(); }, []); // eslint-disable-line
  const save = async (data) => {
    if (data[listKey]) { await api.put(`${endpoint}/${data[listKey]}`, data); }
    else { await api.post(endpoint, data); }
    setEdit(null); load();
  };
  const del = async (id) => { if (!confirm("حذف؟")) return; await api.delete(`${endpoint}/${id}`); load(); };
  return (
    <div className="glass p-4">
      <div className="flex justify-between items-center mb-3"><h3 className="text-display text-lg">{title}</h3><button onClick={() => setEdit({ ...initialValues })} className="btn-accent">إضافة</button></div>
      <div className="grid md:grid-cols-2 gap-3">{items.map((it) => (
        <div key={it.id} className="glass p-3 flex justify-between items-start gap-2">
          <div className="flex-1"><div className="text-display font-bold">{it.title || it.name || it.code}</div><pre className="text-mono text-[10px] text-[var(--text-muted)] mt-1 whitespace-pre-wrap">{JSON.stringify(it, null, 1).slice(0, 200)}</pre></div>
          <div className="flex flex-col gap-1"><button onClick={() => setEdit(it)} className="btn-ghost text-xs">تعديل</button><button onClick={() => del(it.id)} className="btn-danger text-xs">حذف</button></div>
        </div>
      ))}</div>
      {edit && <FormModal value={edit} fields={fields} onSave={save} onCancel={() => setEdit(null)} />}
    </div>
  );
}

function FormModal({ value, fields, onSave, onCancel }) {
  const [v, setV] = useState(value);
  const uploadFor = async (key, file) => {
    const fd = new FormData(); fd.append("file", file);
    const r = await api.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    setV({ ...v, [key]: r.data.url });
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-4">
      <div className="glass-strong p-6 w-full max-w-lg space-y-2 max-h-[90vh] overflow-y-auto" data-testid="admin-form-modal">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="text-sm text-[var(--text-secondary)]">{f.label}</label>
            {f.type === "select" ? (
              <select className="input-cyber" value={v[f.key] || ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })}>
                <option value="">--</option>{f.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : f.type === "file" ? (
              <input type="file" accept={f.accept || "image/*"} className="input-cyber" onChange={(e) => e.target.files?.[0] && uploadFor(f.key, e.target.files[0])} />
            ) : f.type === "bool" ? (
              <input type="checkbox" checked={!!v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.checked })} />
            ) : f.type === "textarea" ? (
              <textarea className="input-cyber" value={v[f.key] || ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
            ) : (
              <input type={f.type || "text"} className="input-cyber" value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })} />
            )}
            {v[f.key] && (f.type === "file" || f.key.includes("url")) && <img src={v[f.key]} alt="" className="mt-1 max-h-20 rounded" />}
          </div>
        ))}
        <div className="flex gap-2 pt-2"><button onClick={() => onSave(v)} className="btn-accent" data-testid="admin-form-save">حفظ</button><button onClick={onCancel} className="btn-ghost">إلغاء</button></div>
      </div>
    </div>
  );
}

function GamesAdmin() {
  return <CRUD endpoint="/admin/games" title="الألعاب" initialValues={{ game_type: "iframe", premium_only: false }} fields={[
    { key: "title", label: "العنوان" },
    { key: "slug", label: "Slug (مسار العبة)" },
    { key: "description", label: "الوصف", type: "textarea" },
    { key: "image_url", label: "صورة اللعبة (رفع)", type: "file" },
    { key: "game_type", label: "النوع", type: "select", options: ["iframe", "builtin"] },
    { key: "game_url", label: "رابط iframe", type: "text" },
    { key: "builtin_key", label: "Builtin key (snake / 2048 / tictactoe)", type: "select", options: ["snake", "2048", "tictactoe"] },
    { key: "premium_only", label: "للحساب الفاخر فقط", type: "bool" },
  ]} />;
}

function ProductsAdmin() {
  return <CRUD endpoint="/admin/products" title="المنتجات" initialValues={{ kind: "name_color", price: 100, is_active: true }} fields={[
    { key: "kind", label: "النوع", type: "select", options: ["name_color", "name_decoration", "profile_frame", "profile_effect", "premium_games", "premium_cosmetic"] },
    { key: "name", label: "الاسم" },
    { key: "description", label: "الوصف", type: "textarea" },
    { key: "value", label: "القيمة (لون hex / كود الزخرفة: bracket,wave,star,fire / الإطار: neon,gold,fire,ice,royal,owner / التأثير: pulse,glow)" },
    { key: "duration_hours", label: "المدة بالساعات (للفاخر)", type: "number" },
    { key: "price", label: "السعر", type: "number" },
    { key: "image_url", label: "صورة (اختياري)", type: "file" },
    { key: "is_active", label: "مفعل", type: "bool" },
  ]} />;
}

function CodesAdmin() {
  return <CRUD endpoint="/admin/codes" title="الأكواد" initialValues={{ max_uses: 1, reward_points: 100 }} fields={[
    { key: "code", label: "الكود" },
    { key: "reward_points", label: "نقاط المكافأة", type: "number" },
    { key: "max_uses", label: "الحد الأقصى للاستخدام", type: "number" },
    { key: "expires_at", label: "تاريخ الانتهاء (ISO)" },
  ]} />;
}

function AdsAdmin() {
  return <CRUD endpoint="/admin/ads" title="الإعلانات" initialValues={{ placement: "banner", is_active: true, bg_color: "#00FFA3", text_color: "#050505" }} fields={[
    { key: "title", label: "العنوان" },
    { key: "description", label: "الوصف", type: "textarea" },
    { key: "placement", label: "الموقع", type: "select", options: ["banner", "notification", "popup"] },
    { key: "bg_color", label: "لون الخلفية (hex)" },
    { key: "text_color", label: "لون النص (hex)" },
    { key: "is_active", label: "مفعل", type: "bool" },
  ]} />;
}

function SettingsAdmin() {
  const [s, setS] = useState({});
  useEffect(() => { api.get("/admin/settings").then((r) => setS(r.data)); }, []);
  const upload = async (file, key) => {
    const fd = new FormData(); fd.append("file", file);
    const r = await api.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    setS({ ...s, [key]: r.data.url });
  };
  const save = async () => { await api.put("/admin/settings", s); alert("تم"); };
  return (
    <div className="glass p-6 space-y-3" data-testid="admin-site-settings">
      <div><label>اسم الموقع</label><input className="input-cyber" value={s.site_name || ""} onChange={(e) => setS({ ...s, site_name: e.target.value })} data-testid="site-name" /></div>
      <div><label>الشعار</label><input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "logo_url")} />{s.logo_url && <img src={s.logo_url} className="mt-1 max-h-20 rounded" />}</div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={!!s.maintenance_mode} onChange={(e) => setS({ ...s, maintenance_mode: e.target.checked })} data-testid="maintenance-toggle" /><label>إيقاف الموقع للصيانة</label></div>
      <div><label>رسالة الصيانة</label><textarea className="input-cyber" value={s.maintenance_message || ""} onChange={(e) => setS({ ...s, maintenance_message: e.target.value })} /></div>
      <div><label>نوع الخلفية</label>
        <select className="input-cyber" value={s.background_type || "image"} onChange={(e) => setS({ ...s, background_type: e.target.value })}>
          <option value="image">صورة</option><option value="video">فيديو</option><option value="code">كود CSS</option>
        </select>
      </div>
      <div><label>قيمة الخلفية (رابط أو CSS)</label>
        {(s.background_type === "code") ? <textarea className="input-cyber" value={s.background_value || ""} onChange={(e) => setS({ ...s, background_value: e.target.value })} placeholder="CSS code (background: ...)" /> :
          <><input type="file" accept={s.background_type === "video" ? "video/*" : "image/*"} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "background_value")} />{s.background_value && <div className="mt-1 text-mono text-xs break-all">{s.background_value}</div>}</>}
      </div>
      <button onClick={save} className="btn-accent" data-testid="save-settings">حفظ</button>
    </div>
  );
}

function LBAdmin() {
  const [items, setItems] = useState([]);
  const load = () => api.get("/admin/leaderboard-rewards").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);
  const set = async (rank, points_reward, frame_reward) => {
    await api.post("/admin/leaderboard-rewards", { rank, points_reward: Number(points_reward), frame_reward });
    load();
  };
  return (
    <div className="glass p-4">
      <div className="text-display text-lg mb-3">جوائز المتصدرين (المركز 1 إلى 10)</div>
      {[1,2,3,4,5,6,7,8,9,10].map((r) => {
        const ex = items.find((x) => x.rank === r);
        return <RewardRow key={r} rank={r} existing={ex} onSave={set} />;
      })}
    </div>
  );
}
function RewardRow({ rank, existing, onSave }) {
  const [p, setP] = useState(existing?.points_reward || 0);
  const [f, setF] = useState(existing?.frame_reward || "");
  return (
    <div className="flex gap-2 items-center py-2 border-b border-white/5">
      <div className="w-10 text-mono">#{rank}</div>
      <input className="input-cyber" type="number" value={p} onChange={(e) => setP(e.target.value)} placeholder="نقاط" />
      <input className="input-cyber" value={f} onChange={(e) => setF(e.target.value)} placeholder="frame key" />
      <button onClick={() => onSave(rank, p, f || null)} className="btn-accent text-xs">حفظ</button>
    </div>
  );
}
