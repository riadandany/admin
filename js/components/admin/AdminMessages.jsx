import React, { useEffect, useState } from 'react';
import { Mail, Trash2, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" dir="rtl">
    <div className="bg-zinc-900 border border-red-500/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
      <h3 className="text-white text-lg font-bold mb-3">تأكيد الحذف</h3>
      <p className="text-gray-300 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-700/50 text-gray-200 hover:bg-gray-600/50 transition">إلغاء</button>
        <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition flex items-center gap-1.5"><Trash2 size={14}/>حذف</button>
      </div>
    </div>
  </div>
);

const AdminMessages = () => {
  const [msgs, setMsgs] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const load = async () => { const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: false }); setMsgs(data||[]); };
  useEffect(() => { load(); }, []);
  const markRead = async (id) => { await supabase.from('messages').update({ is_read: true }).eq('id', id); load(); };
  const remove = async (id) => { await supabase.from('messages').delete().eq('id', id); setDeleteId(null); load(); };
  return (
    <div>
      {deleteId && <ConfirmModal message="هل أنت متأكد من حذف هذه الرسالة؟" onConfirm={() => remove(deleteId)} onCancel={() => setDeleteId(null)} />}
      <h2 className="text-2xl font-bold mb-5">رسائل الزوار ({msgs.length})</h2>
      {msgs.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><Mail size={32} className="mx-auto mb-3 opacity-50"/><p>لا توجد رسائل</p></div>
      ) : (
        <div className="space-y-3">{msgs.map(m => (
          <div key={m.id} className={`glass-card rounded-xl p-5 ${!m.is_read ? 'border-r-4 border-r-emerald-400' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><span className="font-bold text-white">{m.name}</span><span className="text-gray-400 text-sm">{m.contact}</span>{!m.is_read && <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">جديد</span>}</div>
              <span className="text-gray-500 text-xs">{new Date(m.created_at).toLocaleString('ar')}</span>
            </div>
            <p className="text-gray-200 mb-3 whitespace-pre-wrap">{m.message}</p>
            <div className="flex items-center gap-2">
              {!m.is_read && <button onClick={()=>markRead(m.id)} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition flex items-center gap-1"><Check size={12}/>تعليم كمقروءة</button>}
              <button onClick={()=>setDeleteId(m.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 transition flex items-center gap-1"><Trash2 size={12}/>حذف</button>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  );
};
export default AdminMessages;
