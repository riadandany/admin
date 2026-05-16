import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * مربع تأكيد حذف مخصص
 * Props:
 *   open      - boolean
 *   message   - نص السؤال (مثلاً "هل تريد حذف هذه الصفحة؟")
 *   onConfirm - callback عند التأكيد
 *   onCancel  - callback عند الإلغاء
 */
const ConfirmDialog = ({ open, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" dir="rtl">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-zinc-900 border border-red-500/40 rounded-2xl w-full max-w-sm p-6 shadow-2xl fade-in-up text-center">
        <button
          onClick={onCancel}
          className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/5 text-gray-400 hover:text-white flex items-center justify-center transition"
        >
          <X size={16} />
        </button>
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle className="text-red-400" size={26} />
          </div>
        </div>
        <h3 className="text-white text-lg font-bold mb-2">تأكيد الحذف</h3>
        <p className="text-gray-300 text-sm mb-6">{message || 'هل أنت متأكد من الحذف؟ لا يمكن التراجع.'}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg bg-zinc-700/60 text-gray-200 hover:bg-zinc-600/60 transition text-sm font-medium"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition text-sm font-bold flex items-center gap-1.5"
          >
            حذف
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
