import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { useSite } from "../lib/site";
import { useT } from "../i18n";
import { Avatar } from "../components/UserBits";

export default function Settings() {
  const { user, refresh } = useAuth();
  const { lang, setLang } = useSite();
  const t = useT(lang);
  const [form, setForm] = useState({ name: "", username: "", description: "", language: "ar" });
  const [pwd, setPwd] = useState({ old_password: "", new_password: "" });
  const [inv, setInv] = useState([]);
  const [hist, setHist] = useState([]);
  const [tab, setTab] = useState("account");

  useEffect(() => {
    if (user) setForm({ name: user.name || "", username: user.username || "", description: user.description || "", language: user.language || "ar" });
    api.get("/store/inventory").then((r) => setInv(r.data));
    api.get("/points/history").then((r) => setHist(r.data));
  }, [user]);

  const save = async () => {
    try { await api.put("/users/me", form); await refresh(); alert("تم الحفظ"); } catch (e) { alert(e?.response?.data?.detail); }
  };
  const savePw = async () => {
    try { await api.put("/users/me/password", pwd); setPwd({ old_password: "", new_password: "" }); alert("تم تغيير كلمة المرور"); } catch (e) { alert(e?.response?.data?.detail); }
  };
  const uploadAvatar = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const fd = new FormData(); fd.append("file", f);
    const r = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    await api.put("/users/me", { avatar_url: r.data.url });
    refresh();
  };

  const activate = async (kind, value) => {
    const key = { name_color: "active_name_color", name_decoration: "active_name_decoration", profile_frame: "active_profile_frame", profile_effect: "active_profile_effect" }[kind];
    if (!key) return;
    await api.put("/users/me", { [key]: value });
    refresh();
  };
  const remove = async (kind) => {
    const key = { name_color: "active_name_color", name_decoration: "active_name_decoration", profile_frame: "active_profile_frame", profile_effect: "active_profile_effect" }[kind];
    await api.put("/users/me", { [key]: null });
    refresh();
  };

  const Tab = ({ id, label }) => (
    <button onClick={() => setTab(id)} className={`px-4 py-2 rounded-md text-sm ${tab===id?"bg-[var(--accent)]/15 text-[var(--accent)]":"hover:bg-white/5"}`} data-testid={`settings-tab-${id}`}>{label}</button>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 relative z-10">
      <h1 className="text-display text-3xl font-black neon-text mb-4">{t("settings")}</h1>
      <div className="flex gap-2 mb-4 glass p-2 overflow-x-auto no-scrollbar">
        <Tab id="account" label="الحساب" />
        <Tab id="cosmetics" label="المظاهر" />
        <Tab id="inventory" label="ممتلكاتي" />
        <Tab id="points" label="سجل النقاط" />
        <Tab id="redeem" label="استبدال كود" />
      </div>

      {tab === "account" && (
        <div className="glass p-6 space-y-4" data-testid="settings-account">
          <div className="flex items-center gap-4"><Avatar user={user} size={72} /><label className="btn-ghost cursor-pointer">رفع صورة<input type="file" accept="image/*" hidden onChange={uploadAvatar} data-testid="upload-avatar" /></label></div>
          {["name", "username", "description"].map((k) => (
            <div key={k}>
              <label className="text-sm">{t(k)}</label>
              <input className="input-cyber" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} data-testid={`settings-${k}`} />
            </div>
          ))}
          <div>
            <label className="text-sm">{t("language")}</label>
            <select className="input-cyber" value={form.language} onChange={(e) => { setForm({ ...form, language: e.target.value }); setLang(e.target.value); }} data-testid="settings-language">
              <option value="ar">العربية</option><option value="en">English</option>
            </select>
          </div>
          <button onClick={save} className="btn-accent" data-testid="settings-save">{t("save")}</button>
          <hr className="border-white/5"/>
          <div className="text-display text-lg">تغيير كلمة المرور</div>
          <input className="input-cyber" type="password" placeholder="القديمة" value={pwd.old_password} onChange={(e) => setPwd({ ...pwd, old_password: e.target.value })} />
          <input className="input-cyber" type="password" placeholder="الجديدة" value={pwd.new_password} onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })} />
          <button onClick={savePw} className="btn-ghost">تغيير</button>
        </div>
      )}

      {tab === "cosmetics" && (
        <div className="glass p-6 space-y-4" data-testid="settings-cosmetics">
          {["name_color", "name_decoration", "profile_frame", "profile_effect"].map((kind) => {
            const owned = inv.filter((i) => i.kind === kind);
            return (
              <div key={kind}>
                <div className="text-display text-lg mb-2">{t(kind === "name_color" ? "name_color" : kind === "name_decoration" ? "decoration" : kind === "profile_frame" ? "frame" : "open_effect")}</div>
                <div className="flex gap-2 flex-wrap">
                  {owned.length === 0 && <div className="text-xs text-[var(--text-muted)]">لا تملك مظاهر من هذا النوع</div>}
                  {owned.map((it) => (
                    <button key={it.id} onClick={() => activate(kind, it.value)} className="glass px-3 py-2 text-sm card-hover" data-testid={`use-${kind}-${it.id}`}>{it.name}</button>
                  ))}
                  {owned.length > 0 && <button onClick={() => remove(kind)} className="btn-danger text-xs">إزالة</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "inventory" && (
        <div className="glass p-6" data-testid="settings-inventory">
          {inv.length === 0 ? <div className="text-mono text-sm text-[var(--text-muted)]">لا توجد مشتريات</div> : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{inv.map((i, idx) => (
              <div key={idx} className="glass p-3"><div className="text-display font-bold">{i.name}</div><div className="text-mono text-xs text-[var(--text-muted)]">{i.kind}</div></div>
            ))}</div>
          )}
        </div>
      )}

      {tab === "points" && (
        <div className="glass p-6" data-testid="settings-points">
          <PointsTransfer />
          <hr className="my-4 border-white/5"/>
          {hist.length === 0 ? <div className="text-mono text-sm text-[var(--text-muted)]">لا يوجد سجل</div> : hist.map((h) => (
            <div key={h.id} className="flex justify-between py-2 border-b border-white/5 text-sm">
              <div><b className="text-mono" style={{ color: h.amount > 0 ? "var(--positive)" : "var(--negative)" }}>{h.amount > 0 ? "+" : ""}{h.amount}</b><span className="ms-2 text-[var(--text-secondary)]">{h.reason}</span>{h.related && <span className="ms-2 text-[var(--text-muted)]">@{h.related.username}</span>}</div>
              <div className="text-mono text-xs text-[var(--text-muted)]">{new Date(h.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "redeem" && <RedeemCode />}
    </div>
  );
}

function PointsTransfer() {
  const [to, setTo] = useState(""); const [amt, setAmt] = useState(0);
  const submit = async () => {
    try { await api.post("/points/transfer", { to_username: to, amount: Number(amt) }); alert("تم"); setTo(""); setAmt(0); }
    catch (e) { alert(e?.response?.data?.detail); }
  };
  return (
    <div className="space-y-2" data-testid="points-transfer">
      <div className="text-display">تحويل نقاط</div>
      <input className="input-cyber" placeholder="اسم المستخدم" value={to} onChange={(e) => setTo(e.target.value)} data-testid="transfer-to" />
      <input className="input-cyber" type="number" placeholder="القيمة" value={amt} onChange={(e) => setAmt(e.target.value)} data-testid="transfer-amount" />
      <button onClick={submit} className="btn-accent" data-testid="transfer-submit">تحويل</button>
    </div>
  );
}

function RedeemCode() {
  const [code, setCode] = useState("");
  const submit = async () => {
    try { const r = await api.post("/codes/redeem", { code }); alert(`تم! حصلت على ${r.data.points} نقطة`); setCode(""); }
    catch (e) { alert(e?.response?.data?.detail); }
  };
  return (
    <div className="glass p-6 space-y-2" data-testid="redeem-code">
      <div className="text-display">استبدال كود</div>
      <input className="input-cyber" placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} data-testid="redeem-input" />
      <button onClick={submit} className="btn-accent" data-testid="redeem-submit">استبدال</button>
    </div>
  );
}
