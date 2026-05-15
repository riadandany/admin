import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSite } from '../../context/SiteContext';

const AdminButtons = () => {
  const { buttons, refreshAll } = useSite();
  const [items, setItems] = useState([]);
  useEffect(() => setItems(buttons || []), [buttons]);

  const update = (i, patch) => { const arr = [...items]; arr[i] = {...arr[i], ...patch}; setItems(arr); };
  const add = async () => {
    const { data } = await supabase.from('home_buttons').insert([{ label: 'زر جديد', target_type: 'internal', target_url: '/', btn_order: items.length+1 }]).select();
    if (data) await refreshAll();
  };
  const save = async (b) => { await supabase.from('home_buttons').update({ label: b.label, target_type: b.target_type, target_url: b.target_url }).eq('id', b.id); await refreshAll(); };
  const remove = async (id) => { if (!confirm('هل أنت متأكد؟')) return; await supabase.from('home_buttons').delete().eq('id', id); await refreshAll(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-5"><h2 className="text-2xl font-bold">أزرار الصفحة الرئيسية</h2><button onClick={add} className="btn-grad px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"><Plus size={16}/> إضافة</button></div>
      <div className="space-y-4">
        {items.length === 0 && <p className="text-gray-400 text-center py-8">لا توجد أزرار</p>}
        {items.map((b, i) => (
          <div key={b.id} className="glass-card rounded-xl p-5 grid md:grid-cols-2 gap-4">
            <div><label className="label-light">نص الزر</label><input className="input-dark" value={b.label||''} onChange={(e)=>update(i,{label: e.target.value})} /></div>
            <div><label className="label-light">النوع</label>
              <select className="input-dark" value={b.target_type||'internal'} onChange={(e)=>update(i,{target_type: e.target.value})}>
                <option value="internal">صفحة داخلية</option>
                <option value="external">رابط خارجي</option>
              </select>
            </div>
            <div className="md:col-span-2"><label className="label-light">{b.target_type === 'external' ? 'رابط خارجي' : 'مسار داخلي'}</label><input className="input-dark" value={b.target_url||''} onChange={(e)=>update(i,{target_url: e.target.value})} /></div>
            <div className="md:col-span-2 flex justify-between">
              <button onClick={() => save(b)} className="btn-grad px-4 py-2 rounded-lg text-sm">حفظ</button>
              <button onClick={() => remove(b.id)} className="px-3 py-2 rounded-lg text-sm bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 transition flex items-center gap-1.5"><Trash2 size={14}/>حذف</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default AdminButtons;
