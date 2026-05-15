import React, { useState } from 'react';
import { useSite } from '../../context/SiteContext';
import { Save } from 'lucide-react';

const Row = ({label, val, onChange}) => (
  <div className="flex items-center justify-between py-3 border-b border-emerald-500/10 last:border-0">
    <div className="text-gray-200">{label}</div>
    <div className="flex items-center gap-3">
      <span className="text-gray-400 text-sm font-mono">{val}</span>
      <input type="color" value={val||'#22c55e'} onChange={(e)=>onChange(e.target.value)} className="w-12 h-10 rounded cursor-pointer border border-emerald-500/30 bg-transparent" />
    </div>
  </div>
);

const AdminColors = () => {
  const { settings, updateSettings } = useSite();
  const [c, setC] = useState({
    primary_color: settings.primary_color, accent_color: settings.accent_color,
    background_color: settings.background_color, text_color: settings.text_color
  });
  React.useEffect(() => setC({primary_color: settings.primary_color, accent_color: settings.accent_color, background_color: settings.background_color, text_color: settings.text_color}), [settings]);
  const save = async () => { await updateSettings(c); };
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">ألوان الموقع</h2>
      <div className="glass-card rounded-xl px-5">
        <Row label="اللون الأساسي" val={c.primary_color} onChange={(v)=>setC({...c, primary_color: v})} />
        <Row label="لون التأكيد" val={c.accent_color} onChange={(v)=>setC({...c, accent_color: v})} />
        <Row label="لون الخلفية" val={c.background_color} onChange={(v)=>setC({...c, background_color: v})} />
        <Row label="لون النص" val={c.text_color} onChange={(v)=>setC({...c, text_color: v})} />
      </div>
      <button onClick={save} className="btn-grad px-6 py-3 rounded-lg flex items-center gap-2 mt-5"><Save size={16}/>حفظ</button>
    </div>
  );
};
export default AdminColors;
