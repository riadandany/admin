import React, { useEffect, useState } from 'react';
import { Mail, Trash2, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ConfirmDialog from '../ConfirmDialog';

const AdminMessages = () => {
  const [msgs, setMsgs] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }

  const load = async () => {
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
    setMsgs(data || []);
  };
  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await supabase.from('messages').update({ is_read: true }).eq('id', id);
    load();
  };

  const remove = async () => {
    if (!confirmDelete) return;
    await supabase.from('messages').delete().eq('id', confirmDelete.id);
    setConfirmDelete(null);
    load();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-5">رسائل الزوار ({msgs.length})</h2>
      {msgs.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><Mail size={32} className="mx-auto mb-3 opacity-50"/><p>لا توجد رسائل</p></div>
      ) : (
        <div className="space-y-3">
          {msgs.map(m => (
            <div key={m.id} className={`glass-card rounded-xl p-5 ${!m.is_read ? 'border-r-4 border-r-emerald-400' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{m.name}</span>
                  <span className="text-gray-400 text-sm">{m.contact}</span>
                  {!m.is_read && <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">جديد</span>}
                </div>
                <span className="text-gray-500 text-xs">{new Date(m.created_at).toLocaleString('ar')}</span>
              </div>
              <p className="text-gray-200 mb-3 whitespace-pre-wrap">{m.message}</p>
              <div className="flex items-center gap-2">
                {!m.is_read && (
                  <button onClick={() => markRead(m.id)} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition flex items-center gap-1">
                    <Check size={12}/>تعليم كمقروءة
                  </button>
                )}
                <button onClick={() => setConfirmDelete({ id: m.id, name: m.name })} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 transition flex items-center gap-1">
                  <Trash2 size={12}/>حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!confirmDelete}
        message={`هل تريد حذف رسالة "${confirmDelete?.name}"؟`}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};
export default AdminMessages;
