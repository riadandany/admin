import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';
import { playPage } from '../lib/sounds';

const DynamicPage = () => {
  const { slug } = useParams();
  const nav = useNavigate();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxImg, setLightboxImg] = useState(null);

  // تحميل ملف/صورة بشكل صحيح حتى مع روابط خارجية
  const downloadFile = async (url, name) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name || url.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    (async () => {
      const lookup = '/' + slug;
      const { data } = await supabase.from('pages').select('*').or(`slug.eq.${lookup},slug.eq.${slug}`).maybeSingle();
      setPage(data);
      setLoading(false);
      playPage();
      if (data && data.type === 'external' && data.content?.url) {
        window.location.href = data.content.url;
      }
    })();
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center" dir="rtl">جارٍ التحميل...</div>;

  if (!page) return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 py-24 text-center">
        <h1 className="text-4xl font-bold gradient-text-green mb-3">الصفحة غير موجودة</h1>
        <button onClick={() => nav('/')} className="btn-grad px-6 py-2 rounded-lg mt-4">العودة</button>
      </div>
      <Footer />
    </div>
  );

  const content = page.content || {};

  // ── كود: iframe يملأ الشاشة كاملاً مع إبقاء الشريط العلوي ──
  if (page.type === 'code') {
    return (
      <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#000' }}>
        <Navbar />
        <iframe
          title="code"
          srcDoc={`<!doctype html><html><head><style>${content.css || ''}</style></head><body>${content.html || ''}<script>${content.js || ''}<\/script></body></html>`}
          style={{ flex: 1, width: '100%', border: 'none', background: 'white' }}
        />
      </div>
    );
  }

  // ── رابط خارجي: يعيد التوجيه تلقائياً ──
  if (page.type === 'external') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col" dir="rtl">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="animate-pulse text-emerald-300 text-2xl font-bold">جارٍ التوجيه...</div>
            <p className="text-gray-400 text-sm">{content.url}</p>
          </div>
        </div>
      </div>
    );
  }

  const Body = () => {
    switch (page.type) {
      case 'custom':
        return (
          <div className="prose prose-invert max-w-none">
            <div className="text-gray-100 whitespace-pre-wrap leading-loose text-lg">{content.body}</div>
            {(content.videos || []).map((v, i) => {
              const id = (v.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/) || [])[1];
              return id ? (
                <div key={i} className="aspect-video my-4 rounded-xl overflow-hidden border border-emerald-500/30">
                  <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${id}`} title="video" allowFullScreen />
                </div>
              ) : <video key={i} src={v} controls className="w-full rounded-xl my-4" />;
            })}
            {(content.images || []).map((img, i) => (
              <img key={i} src={img} alt="" className="rounded-xl my-4 max-w-full mx-auto" />
            ))}
          </div>
        );

      case 'images':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(content.images || []).map((img, i) => (
              <div
                key={i}
                className="relative group rounded-xl overflow-hidden border border-emerald-500/30 cursor-pointer"
                onClick={() => setLightboxImg(img)}
              >
                <img src={img} alt="" className="w-full h-56 object-cover transition group-hover:scale-105" />
                {content.allow_download && (
                  <button
                    onClick={(e) => { e.stopPropagation(); downloadFile(img); }}
                    className="absolute bottom-2 right-2 bg-emerald-500/90 text-emerald-950 p-2 rounded-full hover:bg-emerald-400 transition"
                    title="تحميل"
                  >
                    <Download size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        );

      case 'videos':
        return (
          <div className="grid md:grid-cols-2 gap-5">
            {(content.items || []).map((v, i) => {
              const url = typeof v === 'string' ? v : v.url;
              const id = (url || '').match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
              return (
                <div key={i} className="aspect-video rounded-xl overflow-hidden border border-emerald-500/30 bg-black">
                  {id ? <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${id[1]}`} allowFullScreen title="v" /> : <video src={url} controls className="w-full h-full" />}
                </div>
              );
            })}
          </div>
        );

      case 'files':
        return (
          <div className="max-w-2xl mx-auto space-y-3">
            {(content.files || []).map((f, i) => (
              <button
                key={i}
                onClick={() => downloadFile(f.url, f.name)}
                className="w-full flex items-center justify-between glass-card rounded-xl p-4 hover:bg-emerald-500/10 transition text-right"
              >
                <span className="text-white">{f.name || 'ملف ' + (i + 1)}</span>
                <Download size={18} className="text-emerald-300" />
              </button>
            ))}
          </div>
        );

      default:
        return <p className="text-gray-400">نوع صفحة غير مدعوم</p>;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      <Navbar />
      <section className="relative">
        <div className="absolute inset-0 radial-green opacity-30 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-5 py-12">
          <h1 className="text-3xl md:text-4xl font-bold gradient-text-green text-center mb-8">{page.title}</h1>
          <Body />
        </div>
      </section>
      <Footer />

      {/* ── Lightbox للصور ── */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          {/* زر الإغلاق */}
          <button
            className="absolute top-4 left-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition z-10"
            onClick={() => setLightboxImg(null)}
            title="إغلاق"
          >
            <X size={24} />
          </button>

          {/* زر التحميل */}
          {content.allow_download && (
            <button
              className="absolute top-4 right-4 bg-emerald-500/90 hover:bg-emerald-400 text-emerald-950 rounded-full p-2.5 transition z-10"
              onClick={(e) => { e.stopPropagation(); downloadFile(lightboxImg); }}
              title="تحميل"
            >
              <Download size={20} />
            </button>
          )}

          {/* الصورة المكبّرة */}
          <img
            src={lightboxImg}
            alt=""
            className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default DynamicPage;
