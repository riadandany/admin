import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, X, ZoomIn } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';
import { playPage } from '../lib/sounds';

/* ── Lightbox ── */
const Lightbox = ({ src, onClose, allowDownload }) => (
  <div
    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div className="relative max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
      <button
        onClick={onClose}
        className="absolute -top-10 left-0 text-white bg-red-500/80 hover:bg-red-500 rounded-full p-1.5 transition"
      >
        <X size={20} />
      </button>
      {allowDownload && (
        <a
          href={src}
          download
          className="absolute -top-10 right-0 text-white bg-emerald-500/80 hover:bg-emerald-500 rounded-full p-1.5 transition"
          onClick={e => e.stopPropagation()}
        >
          <Download size={20} />
        </a>
      )}
      <img src={src} alt="" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
    </div>
  </div>
);

const DynamicPage = () => {
  const { slug } = useParams();
  const nav = useNavigate();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    (async () => {
      const lookup = '/' + slug;
      const { data } = await supabase
        .from('pages')
        .select('*')
        .or(`slug.eq.${lookup},slug.eq.${slug}`)
        .maybeSingle();
      setPage(data);
      setLoading(false);
      playPage();
      // رابط خارجي → توجيه فوري لتبويب جديد ثم رجوع للرئيسية
      if (data && data.type === 'external' && data.content?.url) {
        window.open(data.content.url, '_blank', 'noopener,noreferrer');
        nav('/');
      }
    })();
  }, [slug, nav]);

  if (loading)
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center" dir="rtl">
        جارٍ التحميل...
      </div>
    );

  if (!page)
    return (
      <div className="min-h-screen bg-black text-white" dir="rtl">
        <Navbar />
        <div className="max-w-3xl mx-auto px-5 py-24 text-center">
          <h1 className="text-4xl font-bold gradient-text-green mb-3">الصفحة غير موجودة</h1>
          <button onClick={() => nav('/')} className="btn-grad px-6 py-2 rounded-lg mt-4">
            العودة
          </button>
        </div>
        <Footer />
      </div>
    );

  const content = page.content || {};

  /* ── صفحة كود → ملء شاشة كامل بدون navbar ── */
  if (page.type === 'code') {
    return (
      <div className="fixed inset-0 z-50 bg-white" dir="ltr">
        <iframe
          title="code-page"
          srcDoc={`<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>${content.css || ''}</style></head><body>${content.html || ''}<script>${content.js || ''}<\/script></body></html>`}
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    );
  }

  /* ── صفحة رفع ملفات → تحميل مباشر ── */
  if (page.type === 'files') {
    return (
      <div className="min-h-screen bg-black text-white" dir="rtl">
        <Navbar />
        <section className="relative">
          <div className="absolute inset-0 radial-green opacity-30 pointer-events-none" />
          <div className="relative max-w-2xl mx-auto px-5 py-12">
            <h1 className="text-3xl md:text-4xl font-bold gradient-text-green text-center mb-8">
              {page.title}
            </h1>
            <div className="space-y-3">
              {(content.files || []).length === 0 && (
                <p className="text-gray-400 text-center py-8">لا توجد ملفات</p>
              )}
              {(content.files || []).map((f, i) => (
                <a
                  key={i}
                  href={f.url}
                  download={f.name || true}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between glass-card rounded-xl p-4 hover:bg-emerald-500/10 transition cursor-pointer"
                >
                  <span className="text-white font-medium">{f.name || 'ملف ' + (i + 1)}</span>
                  <div className="flex items-center gap-2 text-emerald-300">
                    <Download size={18} />
                    <span className="text-sm">تحميل</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  /* ── باقي أنواع الصفحات ── */
  const Body = () => {
    switch (page.type) {
      case 'custom':
        return (
          <div className="prose prose-invert max-w-none">
            <div className="text-gray-100 whitespace-pre-wrap leading-loose text-lg">
              {content.body}
            </div>
            {(content.videos || []).map((v, i) => {
              const id = (
                v.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/) ||
                []
              )[1];
              return id ? (
                <div
                  key={i}
                  className="aspect-video my-4 rounded-xl overflow-hidden border border-emerald-500/30"
                >
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${id}`}
                    title="video"
                    allowFullScreen
                  />
                </div>
              ) : (
                <video key={i} src={v} controls className="w-full rounded-xl my-4" />
              );
            })}
            {(content.images || []).map((img, i) => (
              <div key={i} className="relative inline-block my-4 cursor-pointer group"
                onClick={() => setLightbox({ src: img, allowDownload: false })}>
                <img src={img} alt="" className="rounded-xl max-w-full mx-auto" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition rounded-xl flex items-center justify-center">
                  <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition" size={32} />
                </div>
              </div>
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
                onClick={() => setLightbox({ src: img, allowDownload: content.allow_download })}
              >
                <img src={img} alt="" className="w-full h-56 object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                  <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition" size={28} />
                </div>
              </div>
            ))}
          </div>
        );

      case 'videos':
        return (
          <div className="grid md:grid-cols-2 gap-5">
            {(content.items || []).map((v, i) => {
              const url = typeof v === 'string' ? v : v.url;
              const id = (url || '').match(
                /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/
              );
              return (
                <div
                  key={i}
                  className="aspect-video rounded-xl overflow-hidden border border-emerald-500/30 bg-black"
                >
                  {id ? (
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${id[1]}`}
                      allowFullScreen
                      title="v"
                    />
                  ) : (
                    <video src={url} controls className="w-full h-full" />
                  )}
                </div>
              );
            })}
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
          <h1 className="text-3xl md:text-4xl font-bold gradient-text-green text-center mb-8">
            {page.title}
          </h1>
          <Body />
        </div>
      </section>
      <Footer />
      {lightbox && (
        <Lightbox
          src={lightbox.src}
          allowDownload={lightbox.allowDownload}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
};

export default DynamicPage;
