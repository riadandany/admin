import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useSite } from "../lib/site";
import { useT } from "../i18n";

export default function Signup() {
  const { signup } = useAuth();
  const { lang } = useSite();
  const t = useT(lang);
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "", confirm: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setErr("كلمتا المرور غير متطابقتين"); return; }
    setBusy(true); setErr("");
    try {
      await signup({ name: form.name, username: form.username, email: form.email, password: form.password });
      nav("/");
    } catch (e) {
      setErr(e?.response?.data?.detail || "خطأ");
    } finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen bg-cyber grid place-items-center p-4 relative">
      <div className="relative z-10 w-full max-w-md glass-strong p-8" data-testid="signup-card">
        <div className="text-center mb-6">
          <div className="text-display text-3xl font-black neon-text">انشاء حساب جديد</div>
          <div className="text-mono text-[11px] mt-2 text-[var(--text-muted)]">// NEW USER REGISTRATION</div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {["name", "username", "email"].map((k) => (
            <div key={k}>
              <label className="text-sm text-[var(--text-secondary)] mb-1 block">{t(k)}</label>
              <input data-testid={`signup-${k}`} className="input-cyber" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required />
            </div>
          ))}
          <div>
            <label className="text-sm text-[var(--text-secondary)] mb-1 block">{t("password")}</label>
            <input data-testid="signup-password" type="password" className="input-cyber" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm text-[var(--text-secondary)] mb-1 block">{t("confirm_password")}</label>
            <input data-testid="signup-confirm" type="password" className="input-cyber" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
          </div>
          {err && <div className="text-sm" style={{ color: "var(--negative)" }}>{err}</div>}
          <button disabled={busy} className="btn-accent w-full" data-testid="signup-submit">{busy ? "..." : t("signup")}</button>
        </form>
        <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          {t("have_account")} <Link to="/login" className="text-[var(--accent)] hover:underline">{t("login")}</Link>
        </div>
      </div>
    </div>
  );
}
