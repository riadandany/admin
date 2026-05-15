import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit3, Save, X, Upload } from 'lucide-react';
import { supabase, uploadFile } from '../../lib/supabase';
import { useSite } from '../../context/SiteContext';

const PAGE_TYPES = [
  { v: 'custom', l: 'صفحة مخصصة (نص + فيديو + صور)' },
  { v: 'external', l: 'رابط خارجي' },
  { v: 'files', l: 'رفع ملفات' },
  { v: 'code', l: 'كود HTML/CSS/JS' },
  { v: 'images', l: 'صور (رفع فقط)' },
  { v: 'videos', l: 'فيديوهات (روابط + رفع)' }
];

const PageEditor = ({ page, onClose, onSaved }) => {
  const [p, setP] = useState(page);
  const [busy, setBusy] = useState(false);
  const content = p.content || {};
  const setContent = (patch) => setP({...p, content: {...content, ...patch}});
  const uploadImg = async (e, key='images') => {
    const files = e.target.files; if (!files) return;
    setBusy(true);
    const urls = [...(content[key]||[])];
    for (const f of files) { try { urls.push(await uploadFile(f, key)); } catch {} }
    setContent({ [key]: urls });
    setBusy(false);
  };
  const uploadFiles = async (e) => {
    const files = e.target.files; if (!files) return;
    setBusy(true);
    const arr = [...(content.files||[])];
    for (const f of files) { try { const url = await uploadFile(f, 'files'); arr.push({ name: f.name, url }); } catch {} }
    setContent({ files: arr });
    setBusy(false);
  };
  const save = async () => {
    setBusy(true);
    const payload = { slug: p.slug.startsWith('/') ? p.slug : '/' + p.slug, title: p.title, type: p.type, content: p.content, show_in_nav: p.show_in_nav, nav_order: p.nav_order || 100 };
    if (p.id) await supabase.from('pages').update(payload).eq('id', p.id);
    else await supabase.from('pages').insert([payload]);
    setBusy(false); onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-start justify-center overflow-auto p-4" dir="rtl">
      <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl w-full max-w-3xl p-6 my-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-white">{p.id ? 'تعديل صفحة' : 'إضافة صفحة'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={22}/></button>
        </div>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="label-light">عنوان الصفحة</label><input className="input-dark" value={p.title||''} onChange={(e)=>setP({...p, title: e.target.value})} /></div>
            <div><label className="label-light">المسار (مثل: /about)</label><input className="input-dark" value={p.slug||''} onChange={(e)=>setP({...p, slug: e.target.value})} /></div>
            <div><label className="label-light">نوع الصفحة</label>
              <select className="input-dark" value={p.type||'custom'} onChange={(e)=>setP({...p, type: e.target.value, content: {}})}>
                {PAGE_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2"><label className="flex items-center gap-2 text-gray-200 cursor-pointer"><input type="checkbox" checked={!!p.show_in_nav} onChange={(e)=>setP({...p, show_in_nav: e.target.checked})} className="accent-emerald-500 w-4 h-4" />إظهار في شريط التنقل</label></div>
          </div>

          {p.type === 'custom' && (
            <>
              <div><label className="label-light">المحتوى (نص حر)</label><textarea rows={6} className="input-dark" value={content.body||''} onChange={(e)=>setContent({body: e.target.value})} /></div>
              <div><label className="label-light">روابط فيديو (واحد لكل سطر)</label><textarea rows={3} className="input-dark" value={(content.videos||[]).join('\n')} onChange={(e)=>setContent({videos: e.target.value.split('\n').filter(Boolean)})} /></div>
              <div><label className="label-light">صور</label><label className="btn-grad px-4 py-2 rounded-lg cursor-pointer inline-flex items-center gap-1.5 text-sm"><Upload size={14}/>رفع صور<input type="file" accept="image/*" multiple className="hidden" onChange={(e)=>uploadImg(e,'images')} /></label>
                <div className="flex flex-wrap gap-2 mt-2">{(content.images||[]).map((i,k)=><img key={k} src={i} className="w-16 h-16 rounded object-cover" alt="" />)}</div></div>
            </>
          )}
          {p.type === 'external' && <div><label className="label-light">رابط خارجي</label><input className="input-dark" value={content.url||''} onChange={(e)=>setContent({url: e.target.value})} /></div>}
          {p.type === 'files' && (
            <div><label className="label-light">رفع ملفات</label><label className="btn-grad px-4 py-2 rounded-lg cursor-pointer inline-flex items-center gap-1.5 text-sm"><Upload size={14}/>رفع<input type="file" multiple className="hidden" onChange={uploadFiles} /></label>
              <ul className="mt-2 text-gray-300 text-sm space-y-1">{(content.files||[]).map((f,k)=><li key={k}>{f.name}</li>)}</ul></div>
          )}
          {p.type === 'code' && (
            <>
              <div><label className="label-light">HTML</label><textarea rows={4} className="input-dark font-mono text-xs" value={content.html||''} onChange={(e)=>setContent({html: e.target.value})} /></div>
              <div><label className="label-light">CSS</label><textarea rows={3} className="input-dark font-mono text-xs" value={content.css||''} onChange={(e)=>setContent({css: e.target.value})} /></div>
              <div><label className="label-light">JS</label><textarea rows={3} className="input-dark font-mono text-xs" value={content.js||''} onChange={(e)=>setContent({js: e.target.value})} /></div>
            </>
          )}
          {p.type === 'images' && (
            <>
              <label className="btn-grad px-4 py-2 rounded-lg cursor-pointer inline-flex items-center gap-1.5 text-sm"><Upload size={14}/>رفع صور<input type="file" accept="image/*" multiple className="hidden" onChange={(e)=>uploadImg(e,'images')} /></label>
              <label className="flex items-center gap-2 text-gray-200 cursor-pointer mt-3"><input type="checkbox" checked={!!content.allow_download} onChange={(e)=>setContent({allow_download: e.target.checked})} className="accent-emerald-500 w-4 h-4" />السماح بتحميل الصور</label>
              <div className="flex flex-wrap gap-2 mt-2">{(content.images||[]).map((i,k)=><img key={k} src={i} className="w-20 h-20 rounded object-cover" alt="" />)}</div>
            </>
          )}
          {p.type === 'videos' && (
            <div><label className="label-light">روابط فيديو (YouTube أو MP4) - واحد لكل سطر</label><textarea rows={4} className="input-dark" value={(content.items||[]).join('\n')} onChange={(e)=>setContent({items: e.target.value.split('\n').filter(Boolean)})} /></div>
          )}
          <div className="flex justify-end gap-2 pt-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700/50 text-gray-200">إلغاء</button>
            <button onClick={save} disabled={busy} className="btn-grad px-5 py-2 rounded-lg flex items-center gap-1.5"><Save size={14}/>{busy ? '...' : 'حفظ'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPages = () => {
  const { pages, refreshAll } = useSite();
  const [editing, setEditing] = useState(null);
  const remove = async (id) => { if (!confirm('حذف الصفحة؟')) return; await supabase.from('pages').delete().eq('id', id); refreshAll(); };
  return (
    <div>
      <div className="flex items-center justify-between mb-5"><h2 className="text-2xl font-bold">صفحات الموقع</h2><button onClick={() => setEditing({title:'', slug:'/new', type:'custom', content:{}, show_in_nav: true})} className="btn-grad px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"><Plus size={16}/> إضافة صفحة</button></div>
      <div className="space-y-3">
        {(pages||[]).length === 0 && <p className="text-gray-400 text-center py-8">لا توجد صفحات</p>}
        {(pages||[]).map(p => (
          <div key={p.id} className="glass-card rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-white font-semibold">{p.title} <span className="text-emerald-400 text-xs">({PAGE_TYPES.find(t=>t.v===p.type)?.l})</span></div>
              <div className="text-gray-400 text-sm">{p.slug} {p.show_in_nav ? '• ظاهرة' : '• مخفية'}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(p)} className="px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition flex items-center gap-1"><Edit3 size={14}/>تعديل</button>
              <button onClick={() => remove(p.id)} className="px-3 py-2 rounded-lg bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 transition"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>
      {editing && <PageEditor page={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refreshAll(); }} />}
    </div>
  );
};
export default AdminPages;
