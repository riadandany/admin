import React, { useState } from 'react';
import { useSite } from '../../context/SiteContext';
import { uploadFile } from '../../lib/supabase';
import { Upload, Save } from 'lucide-react';

const AdminSettings = () => {
  const { settings, updateSettings } = useSite();
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [local, setLocal] = useState(settings);
  React.useEffect(() => setLocal(settings), [settings]);

  const handleLogo = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true);
    try { const url = await uploadFile(f, 'logos'); setLocal(prev => ({...prev, logo_url: url})); } catch (e) { alert('فشل رفع اللوجو'); }
    setBusy(false);
  };
  const save = async () => { setBusy(true); await updateSettings(local); setBusy(false); setOk(true); setTimeout(() => setOk(false), 2000); };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold">إعدادات الموقع</h2>
      <div className="grid md:grid-cols-2 gap-5">
        <div><label className="label-light">اسم الموقع</label><input className="input-dark" value={local.site_name||''} onChange={(e)=>setLocal({...local, site_name: e.target.value})} /></div>
        <div><label className="label-light">حجم اللوجو: {local.logo_size}px</label><input type="range" min="80" max="320" value={local.logo_size||140} onChange={(e)=>setLocal({...local, logo_size: Number(e.target.value)})} className="w-full accent-emerald-500" /></div>
      </div>
      <div><label className="label-light">وصف الموقع</label><textarea rows={2} className="input-dark" value={local.site_description||''} onChange={(e)=>setLocal({...local, site_description: e.target.value})} /></div>
      <div><label className="label-light">رسالة الترحيب</label><input className="input-dark" value={local.hero_message||''} onChange={(e)=>setLocal({...local, hero_message: e.target.value})} /></div>
      <div><label className="label-light">نبذة عني (اتركها فارغة لإخفاء القسم)</label><textarea rows={4} className="input-dark" value={local.about_text||''} onChange={(e)=>setLocal({...local, about_text: e.target.value})} /></div>
      <div>
        <label className="label-light">لوجو الموقع</label>
        <div className="flex items-center gap-3">
          <input className="input-dark flex-1" value={local.logo_url||''} onChange={(e)=>setLocal({...local, logo_url: e.target.value})} placeholder="رابط اللوجو أو ارفع صورة" />
          <label className="btn-grad px-4 py-3 rounded-lg cursor-pointer flex items-center gap-1.5 text-sm"><Upload size={16}/>رفع<input type="file" accept="image/*" className="hidden" onChange={handleLogo} /></label>
        </div>
        {local.logo_url && <img src={local.logo_url} alt="" className="mt-3 w-20 h-20 rounded-full object-cover border border-emerald-500/40" />}
      </div>
      <button onClick={save} disabled={busy} className="btn-grad px-6 py-3 rounded-lg flex items-center gap-2 disabled:opacity-60"><Save size={16}/>{busy ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}</button>
      {ok && <div className="text-emerald-300 text-sm">تم الحفظ بنجاح</div>}
    </div>
  );
};
export default AdminSettings;
