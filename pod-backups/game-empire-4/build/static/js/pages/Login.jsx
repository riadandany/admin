import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useSite } from "../lib/site";
import { useT } from "../i18n";

export default function Login() {
  const { login } = useAuth();
  const { lang, setLang } = useSite();
  const t = useT(lang);
  const nav = useNavigate();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      await login(id, pw);
      nav("/");
    } catch (e) {
      setErr(e?.response?.data?.detail || "خطأ");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="min-h-screen bg-cyber grid place-items-center p-4 relative">
      <div className="relative z-10 w-full max-w-md glass-strong p-8" data-testid="login-card">
        <div className="text-center mb-6">
          <div className="text-display text-4xl font-black neon-text tracking-tight">Mr Games</div>
          <div className="text-mono text-[11px] mt-2 text-[var(--text-muted)]">// SECURE LOGIN TERMINAL</div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-[var(--text-secondary)] mb-1 block">{t("username")} / {t("email")}</label>
            <input data-testid="login-identifier" className="input-cyber" value={id} onChange={(e) => setId(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm text-[var(--text-secondary)] mb-1 block">{t("password")}</label>
            <input data-testid="login-password" className="input-cyber" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
          </div>
          {err && <div className="text-sm" style={{ color: "var(--negative)" }}>{err}</div>}
          <button disabled={busy} className="btn-accent w-full" data-testid="login-submit">{busy ? "..." : t("login")}</button>
        </form>
        <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          {t("no_account")} <Link to="/signup" className="text-[var(--accent)] hover:underline">{t("signup")}</Link>
        </div>
        <div className="mt-4 text-center">
          <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="text-mono text-xs text-[var(--text-muted)] hover:text-[var(--accent)]">
            {lang === "ar" ? "EN" : "AR"}
          </button>
        </div>
      </div>
    </div>
  );
}
