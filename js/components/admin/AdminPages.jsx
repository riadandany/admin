import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Save, X, Upload, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase, uploadFile } from '../../lib/supabase';
import { useSite } from '../../context/SiteContext';
import RichEditor from '../RichEditor';
import ConfirmDialog from '../ConfirmDialog';

const PAGE_TYPES = [
  { v: 'custom', l: 'صفحة مخصصة (نص منسق + فيديو + صور)' },
  { v: 'external', l: 'رابط (يفتح داخل الموقع)' },
  { v: 'files', l: 'رفع ملفات موقع (يظهر كصفحة كاملة)' },
  { v: 'code', l: 'كود HTML/CSS/JS (صفحة كاملة)' },
  { v: 'images', l: 'معرض صور' },
  { v: 'videos', l: 'فيديوهات (روابط منظمة)' }
];

const normalizeVideos = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(v => typeof v === 'string' ? { url: v, title: '' } : { url: v.url || '', title: v.title || '' });
  }
  return [];
};

const VideoManager = ({ items, onChange, testidPrefix = 'video' }) => {
  const list = normalizeVideos(items);
  const update = (i, patch) => { const next = [...list]; next[i] = { ...next[i], ...patch }; onChange(next); };
  const add = () => onChange([...list, { url: '', title: '' }]);
  const remove = (i) => onChange(list.filter((_, k) => k !== i));
  const move = (i, dir) => {
    const ni = i + dir;
    if (ni < 0 || ni >= list.length) return;
    const next = [...list];
    [next[i], next[ni]] = [next[ni], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {list.length === 0 && <p className="text-gray-500 text-sm">لا توجد فيديوهات. اضغط "إضافة فيديو".</p>}
      {list.map((v, i) => (
        <div key={i} className="border border-emerald-500/20 rounded-lg p-3 bg-zinc-900/50 space-y-2" data-testid={`${testidPrefix}-row-${i}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-emerald-300 text-xs font-bold">فيديو رقم {i + 1}</span>
            <div className="flex gap-1">
              <button type="button" onClick={() => move(i, -1)} className="p-1.5 rounded bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-40" disabled={i === 0} title="لأعلى"><ArrowUp size={14}/></button>
              <button type="button" onClick={() => move(i, 1)} className="p-1.5 rounded bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-40" disabled={i === list.length - 1} title="لأسفل"><ArrowDown size={14}/></button>
              <button type="button" onClick={() => remove(i)} className="p-1.5 rounded bg-red-500/10 text-red-300 hover:bg-red-500/20" title="حذف" data-testid={`${testidPrefix}-remove-${i}`}><Trash2 size={14}/></button>
            </div>
          </div>
          <input className="input-dark" placeholder="عنوان الفيديو" value={v.title || ''} onChange={(e) => update(i, { title: e.target.value })} data-testid={`${testidPrefix}-title-${i}`} />
          <input className="input-dark" placeholder="رابط الفيديو (YouTube أو MP4)" value={v.url || ''} onChange={(e) => update(i, { url: e.target.value })} data-testid={`${testidPrefix}-url-${i}`} />
        </div>
      ))}
      <button type="button" onClick={add} className="btn-grad px-4 py-2 rounded-lg inline-flex items-center gap-1.5 text-sm" data-testid={`${testidPrefix}-add`}><Plus size={14}/> إضافة فيديو</button>
    </div>
  );
};

const PageEditor = ({ page, onClose, onSaved }) => {
  const [p, setP] = useState(page);
  const [busy, setBusy] = useState(false);
  const content = p.content || {};
  const setContent = (patch) => setP({ ...p, content: { ...content, ...patch } });

  const uploadImg = async (e, key = 'images') => {
    const files = e.target.files; if (!files) return;
    setBusy(true);
    const urls = [...(content[key] || [])];
    for (const f of files) { try { urls.push(await uploadFile(f, key)); } catch (err) { console.error(err); } }
    setContent({ [key]: urls });
    setBusy(false);
  };
  const uploadFiles = async (e) => {
    const files = e.target.files; if (!files) return;
    setBusy(true);
    const arr = [...(content.files || [])];
    for (const f of files) { try { const url = await uploadFile(f, 'files'); arr.push({ name: f.name, url }); } catch (err) { console.error(err); } }
    setContent({ files: arr });
    setBusy(false);
  };
  const removeImg = (idx) => setContent({ images: (content.images || []).filter((_, i) => i !== idx) });
  const removeFile = (idx) => setContent({ files: (content.files || []).filter((_, i) => i !== idx) });

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
          <button onClick={onClose} className="text-gray-400 hover:text-white" data-testid="page-editor-close"><X size={22}/></button>
        </div>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="label-light">عنوان الصفحة</label><input className="input-dark" value={p.title || ''} onChange={(e) => setP({ ...p, title: e.target.value })} data-testid="page-title-input" /></div>
            <div><label className="label-light">المسار (مثل: /about)</label><input className="input-dark" value={p.slug || ''} onChange={(e) => setP({ ...p, slug: e.target.value })} data-testid="page-slug-input" /></div>
            <div><label className="label-light">نوع الصفحة</label>
              <select className="input-dark" value={p.type || 'custom'} onChange={(e) => setP({ ...p, type: e.target.value, content: {} })} data-testid="page-type-select">
                {PAGE_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2"><label className="flex items-center gap-2 text-gray-200 cursor-pointer"><input type="checkbox" checked={!!p.show_in_nav} onChange={(e) => setP({ ...p, show_in_nav: e.target.checked })} className="accent-emerald-500 w-4 h-4" /> إظهار في شريط التنقل</label></div>
          </div>

          {p.type === 'custom' && (
            <>
              <div>
                <label className="label-light">المحتوى (محرر منسق - مثل Word)</label>
                <RichEditor value={content.body || ''} onChange={(html) => setContent({ body: html })} />
                <p className="text-gray-500 text-xs mt-1">استخدم أزرار التنسيق فوق المحرر: عريض، مائل، تحته خط، توسيط، حجم الخط، اللون، الروابط...</p>
              </div>
              <div>
                <label className="label-light">فيديوهات</label>
                <VideoManager items={content.video_items || content.videos || []} onChange={(items) => setContent({ video_items: items, videos: items.map(v => v.url).filter(Boolean) })} testidPrefix="custom-video" />
              </div>
              <div>
                <label className="label-light">صور</label>
                <label className="btn-grad px-4 py-2 rounded-lg cursor-pointer inline-flex items-center gap-1.5 text-sm"><Upload size={14}/>رفع صور<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadImg(e, 'images')} /></label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(content.images || []).map((i, k) => (
                    <div key={k} className="relative group">
                      <img src={i} className="w-16 h-16 rounded object-cover" alt="" />
                      <button type="button" onClick={() => removeImg(k)} className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500/90 text-white flex items-center justify-center"><X size={12}/></button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {p.type === 'external' && (
            <div>
              <label className="label-light">رابط (سيُعرض داخل الموقع)</label>
              <input className="input-dark" placeholder="https://..." value={content.url || ''} onChange={(e) => setContent({ url: e.target.value })} data-testid="external-url-input" />
              <p className="text-gray-500 text-xs mt-1">ملاحظة: بعض المواقع لا تسمح بالعرض داخل إطار (iframe).</p>
            </div>
          )}
          {p.type === 'files' && (
            <div>
              <label className="label-light">رفع ملفات الموقع</label>
              <label className="btn-grad px-4 py-2 rounded-lg cursor-pointer inline-flex items-center gap-1.5 text-sm"><Upload size={14}/>رفع ملفات<input type="file" multiple className="hidden" onChange={uploadFiles} /></label>
              <ul className="mt-2 text-gray-300 text-sm space-y-1">
                {(content.files || []).map((f, k) => (
                  <li key={k} className="flex items-center gap-2 justify-between bg-zinc-800/50 px-3 py-2 rounded"><span>{f.name}</span><button type="button" onClick={() => removeFile(k)} className="text-red-400 hover:text-red-300"><Trash2 size={14}/></button></li>
                ))}
              </ul>
            </div>
          )}
          {p.type === 'code' && (
            <>
              <div><label className="label-light">HTML</label><textarea rows={6} className="input-dark font-mono text-xs" value={content.html || ''} onChange={(e) => setContent({ html: e.target.value })} data-testid="code-html-input" /></div>
              <div><label className="label-light">CSS</label><textarea rows={4} className="input-dark font-mono text-xs" value={content.css || ''} onChange={(e) => setContent({ css: e.target.value })} data-testid="code-css-input" /></div>
              <div><label className="label-light">JS</label><textarea rows={4} className="input-dark font-mono text-xs" value={content.js || ''} onChange={(e) => setContent({ js: e.target.value })} data-testid="code-js-input" /></div>
            </>
          )}
          {p.type === 'images' && (
            <>
              <label className="btn-grad px-4 py-2 rounded-lg cursor-pointer inline-flex items-center gap-1.5 text-sm"><Upload size={14}/>رفع صور<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadImg(e, 'images')} /></label>
              <div className="flex flex-wrap gap-2 mt-2">
                {(content.images || []).map((i, k) => (
                  <div key={k} className="relative group">
                    <img src={i} className="w-20 h-20 rounded object-cover" alt="" />
                    <button type="button" onClick={() => removeImg(k)} className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500/90 text-white flex items-center justify-center"><X size={12}/></button>
                  </div>
                ))}
              </div>
            </>
          )}
          {p.type === 'videos' && (
            <div>
              <label className="label-light">الفيديوهات</label>
              <VideoManager items={content.items || []} onChange={(items) => setContent({ items })} testidPrefix="videos-page" />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700/50 text-gray-200">إلغاء</button>
            <button onClick={save} disabled={busy} className="btn-grad px-5 py-2 rounded-lg flex items-center gap-1.5" data-testid="save-page-btn"><Save size={14}/>{busy ? '...' : 'حفظ'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPages = () => {
  const { pages, refreshAll } = useSite();
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, title }

  const remove = async () => {
    if (!confirmDelete) return;
    await supabase.from('pages').delete().eq('id', confirmDelete.id);
    setConfirmDelete(null);
    refreshAll();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold">صفحات الموقع</h2>
        <button onClick={() => setEditing({ title: '', slug: '/new', type: 'custom', content: {}, show_in_nav: true })} className="btn-grad px-4 py-2 rounded-lg text-sm flex items-center gap-1.5" data-testid="add-page-btn"><Plus size={16}/> إضافة صفحة</button>
      </div>
      <div className="space-y-3">
        {(pages || []).length === 0 && <p className="text-gray-400 text-center py-8">لا توجد صفحات</p>}
        {(pages || []).map(p => (
          <div key={p.id} className="glass-card rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-white font-semibold">{p.title} <span className="text-emerald-400 text-xs">({PAGE_TYPES.find(t => t.v === p.type)?.l})</span></div>
              <div className="text-gray-400 text-sm">{p.slug} {p.show_in_nav ? '• ظاهرة' : '• مخفية'}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(p)} className="px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition flex items-center gap-1"><Edit3 size={14}/>تعديل</button>
              <button onClick={() => setConfirmDelete({ id: p.id, title: p.title })} className="px-3 py-2 rounded-lg bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 transition"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>
      {editing && <PageEditor page={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refreshAll(); }} />}
      <ConfirmDialog
        open={!!confirmDelete}
        message={`هل تريد حذف الصفحة "${confirmDelete?.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};
export default AdminPages;
