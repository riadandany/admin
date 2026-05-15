import React, { useEffect, useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';
import { playPage, playButton } from '../lib/sounds';

const Contact = () => {
  const [form, setForm] = useState({ name: '', contact: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { playPage(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.contact || !form.message) return;
    setLoading(true); setError('');
    playButton();
    const { error } = await supabase.from('messages').insert([form]);
    setLoading(false);
    if (error) { setError('حدث خطأ أثناء الإرسال'); return; }
    setSent(true); setForm({ name: '', contact: '', message: '' });
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      <Navbar />
      <section className="relative">
        <div className="absolute inset-0 radial-green opacity-50 pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-5 py-16">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text-green text-center mb-3">تواصل معنا</h1>
          <p className="text-gray-400 text-center mb-10">أرسل لنا فكرتك أو مشكلتك</p>
          <form onSubmit={submit} className="glass-card rounded-2xl p-7 space-y-4">
            <div>
              <label className="label-light">الاسم</label>
              <input className="input-dark" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <label className="label-light">البريد الإلكتروني أو الرقم</label>
              <input className="input-dark" value={form.contact} onChange={(e) => setForm({...form, contact: e.target.value})} required />
            </div>
            <div>
              <label className="label-light">فكرتك أو مشكلتك</label>
              <textarea rows={5} className="input-dark" value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} required />
            </div>
            {error && <div className="text-red-400 text-sm text-center">{error}</div>}
            <button type="submit" disabled={loading} className="btn-grad w-full py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60">
              <Send size={16} /> {loading ? 'جارٍ الإرسال...' : 'إرسال'}
            </button>
            {sent && (
              <div className="flex items-center justify-center gap-2 text-emerald-300 text-center text-sm">
                <CheckCircle2 size={16} /> تم الإرسال بنجاح
              </div>
            )}
          </form>
        </div>
      </section>
      <Footer />
    </div>
  );
};
export default Contact;
