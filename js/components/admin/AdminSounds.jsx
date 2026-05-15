import React, { useEffect, useState } from 'react';
import { useSite } from '../../context/SiteContext';
import { uploadFile } from '../../lib/supabase';
import { Save, Upload, Play } from 'lucide-react';
import { playNav, playButton, playPage } from '../../lib/sounds';

const Item = ({ label, val, onChange, onTest }) => {
  const ref = React.useRef();
  const upload = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    try { const url = await uploadFile(f, 'sounds'); onChange(url); } catch { alert('فشل الرفع'); }
  };
  return (
    <div className="glass-card rounded-xl p-4">
      <label className="label-light">{label}</label>
      <div className="flex items-center gap-2">
        <input className="input-dark flex-1" value={val||''} onChange={(e)=>onChange(e.target.value)} placeholder="رابط mp3 أو اتركه فارغاً للصوت الافتراضي" />
        <label className="btn-grad px-3 py-3 rounded-lg cursor-pointer text-sm"><Upload size={14}/><input ref={ref} type="file" accept="audio/*" className="hidden" onChange={upload}/></label>
        <button onClick={onTest} className="px-3 py-3 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"><Play size={14}/></button>
      </div>
    </div>
  );
};

const AdminSounds = () => {
  const { settings, updateSettings } = useSite();
  const [s, setS] = useState({ sound_nav_url: settings.sound_nav_url, sound_button_url: settings.sound_button_url, sound_page_url: settings.sound_page_url });
  useEffect(() => setS({ sound_nav_url: settings.sound_nav_url, sound_button_url: settings.sound_button_url, sound_page_url: settings.sound_page_url }), [settings]);
  const save = async () => { await updateSettings(s); };
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">أصوات الموقع</h2>
      <p className="text-gray-400 text-sm mb-5">3 أصوات قصيرة متشابهة - اتركها فارغة لاستخدام الأصوات الافتراضية</p>
      <div className="space-y-3">
        <Item label="صوت شريط التنقل" val={s.sound_nav_url} onChange={(v)=>setS({...s, sound_nav_url: v})} onTest={playNav} />
        <Item label="صوت الأزرار" val={s.sound_button_url} onChange={(v)=>setS({...s, sound_button_url: v})} onTest={playButton} />
        <Item label="صوت ظهور الصفحة" val={s.sound_page_url} onChange={(v)=>setS({...s, sound_page_url: v})} onTest={playPage} />
      </div>
      <button onClick={save} className="btn-grad px-6 py-3 rounded-lg flex items-center gap-2 mt-5"><Save size={16}/>حفظ</button>
    </div>
  );
};
export default AdminSounds;
