import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit3, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSite } from '../../context/SiteContext';

const AdEditor = ({ ad, onClose, onSaved }) => {
  const [a, setA] = useState(ad);
  const { pages } = useSite();
  const save = async () => {
    const payload = { title: a.title, description: a.description||'', button_text: a.button_text||null, button_url: a.button_url||null, button_internal: !!a.button_internal, show_on_pages: a.show_on_pages?.length ? a.show_on_pages : ['*'], display_mode: a.display_mode||'once', is_active: a.is_active !== false };
    if (a.id) await supabase.from('ads').update(payload).eq('id', a.id);
    else await supabase.from('ads').insert([payload]);
    onSaved();
  };
  const togglePage = (slug) => { const arr = a.show_on_pages || ['*']; if (arr.includes(slug)) setA({...a, show_on_pages: arr.filter(s=>s!==slug)}); else setA({...a, show_on_pages: [...arr.filter(s=>s!=='*'), slug]}); };
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-start justify-center overflow-auto p-4" dir="rtl">
      <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl w-full max-w-2xl p-6 my-4">
        <div className="flex items-center justify-between mb-5"><h3 className="text-xl font-bold text-white">{a.id?'تعديل إعلان':'إضافة إعلان'}</h3><button onClick={onClose}><X className="text-gray-400 hover:text-white" size={22}/></button></div>
        <div className="space-y-3">
          <div><label className="label-light">العنوان</label><input className="input-dark" value={a.title||''} onChange={(e)=>setA({...a, title: e.target.value})} /></div>
          <div><label className="label-light">الوصف</label><textarea rows={3} className="input-dark" value={a.description||''} onChange={(e)=>setA({...a, description: e.target.value})} /></div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className="label-light">نص الزر (اختياري)</label><input className="input-dark" value={a.button_text||''} onChange={(e)=>setA({...a, button_text: e.target.value})} /></div>
            <div><label className="label-light">رابط الزر</label><input className="input-dark" value={a.button_url||''} onChange={(e)=>setA({...a, button_url: e.target.value})} /></div>
          </div>
          <label className="flex items-center gap-2 text-gray-200"><input type="checkbox" checked={!!a.button_internal} onChange={(e)=>setA({...a, button_internal: e.target.checked})} className="accent-emerald-500 w-4 h-4"/>الرابط داخلي (صفحة في الموقع)</label>
          <div><label className="label-light">وضع العرض</label>
            <select className="input-dark" value={a.display_mode||'once'} onChange={(e)=>setA({...a, display_mode: e.target.value})}>
              <option value="once">مرة واحدة للزائر</option>
              <option value="always">في كل زيارة</option>
            </select></div>
          <div><label className="label-light">الصفحات التي تظهر فيها (اتركها * لكل الصفحات)</label>
            <div className="flex flex-wrap gap-2 mt-1">
              <button onClick={()=>setA({...a, show_on_pages:['*']})} className={`px-3 py-1.5 rounded-lg text-xs ${(a.show_on_pages||['*']).includes('*')?'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40':'bg-gray-700/30 text-gray-300'}`}>جميع الصفحات</button>
              <button onClick={()=>togglePage('/')} className={`px-3 py-1.5 rounded-lg text-xs ${(a.show_on_pages||[]).includes('/')?'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40':'bg-gray-700/30 text-gray-300'}`}>الرئيسية</button>
              {(pages||[]).map(p=>(<button key={p.id} onClick={()=>togglePage(p.slug)} className={`px-3 py-1.5 rounded-lg text-xs ${(a.show_on_pages||[]).includes(p.slug)?'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40':'bg-gray-700/30 text-gray-300'}`}>{p.title}</button>))}
            </div></div>
          <label className="flex items-center gap-2 text-gray-200"><input type="checkbox" checked={a.is_active!==false} onChange={(e)=>setA({...a, is_active: e.target.checked})} className="accent-emerald-500 w-4 h-4"/>فعّال</label>
          <div className="flex justify-end gap-2 pt-3"><button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700/50 text-gray-200">إلغاء</button><button onClick={save} className="btn-grad px-5 py-2 rounded-lg flex items-center gap-1.5"><Save size={14}/>حفظ</button></div>
        </div>
      </div>
    </div>
  );
};

const AdminAds = () => {
  const [ads, setAds] = useState([]);
  const [editing, setEditing] = useState(null);
  const load = async () => { const { data } = await supabase.from('ads').select('*').order('created_at', { ascending: false }); setAds(data||[]); };
  useEffect(() => { load(); }, []);
  const remove = async (id) => { if (!confirm('حذف الإعلان؟')) return; await supabase.from('ads').delete().eq('id', id); load(); };
  return (
    <div>
      <div className="flex items-center justify-between mb-5"><h2 className="text-2xl font-bold">الإعلانات</h2><button onClick={() => setEditing({title:'', show_on_pages:['*'], display_mode:'once', is_active:true})} className="btn-grad px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"><Plus size={16}/>إضافة إعلان</button></div>
      <div className="space-y-3">
        {ads.length === 0 && <p className="text-gray-400 text-center py-8">لا توجد إعلانات</p>}
        {ads.map(a => (
          <div key={a.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-white font-semibold">{a.title} {!a.is_active && <span className="text-xs text-amber-400">(معطل)</span>}</div>
              <div className="text-gray-400 text-sm">{a.description?.slice(0,80)} • {a.display_mode === 'once' ? 'مرة واحدة' : 'دائم'}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(a)} className="px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition"><Edit3 size={14}/></button>
              <button onClick={() => remove(a.id)} className="px-3 py-2 rounded-lg bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 transition"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>
      {editing && <AdEditor ad={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
};
export default AdminAds;
