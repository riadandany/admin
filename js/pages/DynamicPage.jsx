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
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    (async () => {
      const lookup = '/' + slug;
      const { data } = await supabase.from('pages').select('*').or(`slug.eq.${lookup},slug.eq.${slug}`).maybeSingle();
      setPage(data);
      setLoading(false);
      playPage();
      if (data && data.type === 'external' && data.content?.url) {
        window.open(data.content.url, '_blank', 'noopener,noreferrer');
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

  // Code page = full screen iframe, no navbar
  if (page.type === 'code') {
    const content = page.content || {};
    return (
      <iframe
        title="code"
        srcDoc={`<!doctype html><html><head><style>${content.css || ''}</style></head><body>${content.html || ''}<script>${content.js || ''}<\/script></body></html>`}
        style={{ width: '100vw', height: '100vh', display: 'block', border: 'none', position: 'fixed', top: 0, left: 0 }}
      />
    );
  }

  // External link = opened in new tab, show message
  if (page.type === 'external') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-5" dir="rtl">
        <p className="text-emerald-300 text-xl">تم فتح الرابط في نافذة جديدة 🔗</p>
        <a href={page.content?.url} target="_blank" rel="noopener noreferrer" className="btn-grad px-6 py-2 rounded-lg text-sm">فتح الرابط مجدداً</a>
        <button onClick={() => nav(-1)} className="text-gray-400 text-sm hover:text-white">← رجوع</button>
      </div>
    );
  }

  const content = page.content || {};

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
          <>
            {lightbox && (
              <div
                className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                onClick={() => setLightbox(null)}
              >
                <button
                  onClick={() => setLightbox(null)}
                  className="absolute top-4 right-4 bg-zinc-800 text-white rounded-full p-2 hover:bg-red-600 transition z-50"
                >
                  <X size={22} />
                </button>
                <a
                  href={lightbox}
                  download
                  onClick={e => e.stopPropagation()}
                  className="absolute top-4 left-4 bg-emerald-600 text-white rounded-full p-2 hover:bg-emerald-500 transition z-50"
                >
                  <Download size={22} />
                </a>
                <img
                  src={lightbox}
                  alt=""
                  className="max-w-full max-h-[90vh] rounded-xl object-contain"
                  onClick={e => e.stopPropagation()}
                />
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(content.images || []).map((img, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border border-emerald-500/30 cursor-pointer" onClick={() => setLightbox(img)}>
                  <img src={img} alt="" className="w-full h-56 object-cover" />
                  {content.allow_download && (
                    <a
                      href={img}
                      download
                      onClick={e => e.stopPropagation()}
                      className="absolute bottom-2 right-2 bg-emerald-500/90 text-emerald-950 p-2 rounded-full hover:bg-emerald-400 transition"
                    >
                      <Download size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </>
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
              <a key={i} href={f.url} download className="flex items-center justify-between glass-card rounded-xl p-4 hover:bg-emerald-500/10 transition">
                <span className="text-white">{f.name || 'file ' + (i+1)}</span>
                <Download size={18} className="text-emerald-300" />
              </a>
            ))}
          </div>
        );
      case 'code':
        return (
          <iframe
            title="code"
            srcDoc={`<!doctype html><html><head><style>${content.css || ''}</style></head><body>${content.html || ''}<script>${content.js || ''}<\/script></body></html>`}
            className="w-full bg-white"
            style={{ height: '100vh', display: 'block', border: 'none' }}
          />
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
    </div>
  );
};
export default DynamicPage;

