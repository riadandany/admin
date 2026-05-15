import React, { useEffect, useState } from 'react';
import { Lock, LogOut, Eye, Settings as SettingsIcon, Palette, Square, FileText, Mail, Megaphone, Volume2, CheckCircle2 } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import AdminSettings from '../components/admin/AdminSettings';
import AdminColors from '../components/admin/AdminColors';
import AdminButtons from '../components/admin/AdminButtons';
import AdminPages from '../components/admin/AdminPages';
import AdminMessages from '../components/admin/AdminMessages';
import AdminAds from '../components/admin/AdminAds';
import AdminSounds from '../components/admin/AdminSounds';

const LoginScreen = () => {
  const { login } = useSite();
  const [u, setU] = useState(''); const [p, setP] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    const ok = await login(u, p);
    setBusy(false);
    if (!ok) setErr('بيانات غير صحيحة');
  };
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-5" dir="rtl">
      <div className="absolute inset-0 radial-green opacity-70 pointer-events-none" />
      <div className="relative w-full max-w-md glass-card rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-yellow-400 flex items-center justify-center mb-4">
            <Lock className="text-emerald-950" size={28} />
          </div>
          <h1 className="text-3xl font-bold gradient-text-green">لوحة المطور</h1>
          <p className="text-gray-400 text-sm mt-1">Control Panel</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label-light">اسم المستخدم</label><input value={u} onChange={(e)=>setU(e.target.value)} className="input-dark" autoFocus /></div>
          <div><label className="label-light">كلمة المرور</label><input type="password" value={p} onChange={(e)=>setP(e.target.value)} className="input-dark" /></div>
          {err && <div className="text-red-400 text-sm text-center">{err}</div>}
          <button disabled={busy} className="btn-admin-grad w-full py-3 rounded-lg disabled:opacity-60">{busy ? '...' : 'دخول'}</button>
        </form>
      </div>
    </div>
  );
};

const tabs = [
  { id: 'settings', label: 'الإعدادات', icon: SettingsIcon, C: AdminSettings },
  { id: 'colors', label: 'الألوان', icon: Palette, C: AdminColors },
  { id: 'buttons', label: 'أزرار الرئيسية', icon: Square, C: AdminButtons },
  { id: 'pages', label: 'الصفحات', icon: FileText, C: AdminPages },
  { id: 'ads', label: 'الإعلانات', icon: Megaphone, C: AdminAds },
  { id: 'messages', label: 'الرسائل', icon: Mail, C: AdminMessages },
  { id: 'sounds', label: 'الأصوات', icon: Volume2, C: AdminSounds }
];

const Dashboard = () => {
  const { logout, refreshAll } = useSite();
  const [active, setActive] = useState('settings');
  const [showOk, setShowOk] = useState(true);
  useEffect(() => { refreshAll(); const t = setTimeout(() => setShowOk(false), 3000); return () => clearTimeout(t); }, [refreshAll]);
  const Active = tabs.find(t => t.id === active)?.C || AdminSettings;
  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      <div className="absolute inset-x-0 top-0 h-96 radial-green opacity-40 pointer-events-none" />
      <header className="relative max-w-7xl mx-auto px-5 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-right">
            <h1 className="text-2xl font-bold gradient-text-green leading-tight">لوحة المطور</h1>
            <p className="text-gray-400 text-xs">Control Panel</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center"><SettingsIcon className="text-emerald-300" size={18} /></div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition text-sm"><Eye size={16}/> الموقع</a>
          <button onClick={logout} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition text-sm"><LogOut size={16}/> خروج</button>
        </div>
      </header>
      {showOk && (
        <div className="relative max-w-7xl mx-auto px-5"><div className="flex items-center justify-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 py-3 rounded-xl mt-2"><CheckCircle2 size={18}/> تم تسجيل الدخول</div></div>
      )}
      <div className="relative max-w-7xl mx-auto px-5 mt-6">
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {tabs.map(t => {
            const Icon = t.icon; const a = active === t.id;
            return <button key={t.id} onClick={() => setActive(t.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${a ? 'tab-active' : 'tab-inactive'}`}><Icon size={16}/>{t.label}</button>;
          })}
        </div>
        <div className="section-card mb-10"><Active /></div>
      </div>
    </div>
  );
};

const AdminDev = () => { const { isAuthed } = useSite(); return isAuthed ? <Dashboard /> : <LoginScreen />; };
export default AdminDev;
