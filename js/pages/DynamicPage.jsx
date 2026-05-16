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
  const [lightbox, setLightbox] = useState(null); // {src}

  useEffect(() => {
    (async () => {
      const lookup = '/' + slug;
      const { data } = await supabase.from('pages').select('*').or(`slug.eq.${lookup},slug.eq.${slug}`).maybeSingle();
      setPage(data);
      setLoading(false);
      playPage();
    })();
  }, [slug]);

  // Trigger an actual file download (forces save dialog rather than navigation)
  const triggerDownload = async (url, filename) => {
    try {
      const res = await fetch(url, { mode: 'cors' });
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || url.split('/').pop().split('?')[0] || 'image';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

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

  // FULL SCREEN page types — keep Navbar at top, fill the rest of the screen
  // (code, external link, files act as embedded mini-site below the navbar)
  if (page.type === 'code') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col" dir="rtl">
        <Navbar />
        <iframe
          title={page.title}
          srcDoc={`<!doctype html><html><head><meta charset="utf-8"/><style>html,body{margin:0;padding:0}${content.css || ''}</style></head><body>${content.html || ''}<script>${content.js || ''}<\/script></body></html>`}
          style={{ flex: 1, width: '100%', minHeight: 'calc(100vh - 64px)', border: 0, background: '#fff', display: 'block' }}
          data-testid="code-iframe-fullscreen"
        />
      </div>
    );
  }

  if (page.type === 'external') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col" dir="rtl">
        <Navbar />
        <iframe
          title={page.title}
          src={content.url || 'about:blank'}
          style={{ flex: 1, width: '100%', minHeight: 'calc(100vh - 64px)', border: 0, background: '#fff', display: 'block' }}
          data-testid="external-iframe-fullscreen"
        />
      </div>
    );
  }

  if (page.type === 'files') {
    // Treat uploaded files as embedded mini-site (HTML/PDF/images render inline)
    const files = content.files || [];
    // Prefer index.html if exists
    const indexFile = files.find(f => /index\.html?$/i.test(f.name || ''));
    const target = indexFile || files[0];
    if (!target) {
      return (
        <div className="min-h-screen bg-black text-white" dir="rtl">
          <Navbar />
          <div className="flex items-center justify-center py-24"><p className="text-gray-400">لا توجد ملفات</p></div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-black text-white flex flex-col" dir="rtl">
        <Navbar />
        <iframe
          title={page.title}
          src={target.url}
          style={{ flex: 1, width: '100%', minHeight: 'calc(100vh - 64px)', border: 0, background: '#fff', display: 'block' }}
          data-testid="files-iframe-fullscreen"
        />
      </div>
    );
  }

  const Body = () => {
    switch (page.type) {
      case 'custom':
        return (
          <div>
            <div
              className="prose prose-invert max-w-none text-gray-100 leading-loose rich-content"
              data-testid="custom-page-body"
              dangerouslySetInnerHTML={{ __html: content.body || '' }}
            />
            {(content.video_items || content.videos || []).map((v, i) => {
              const url = typeof v === 'string' ? v : v.url;
              const title = typeof v === 'object' ? v.title : '';
              const id = (url || '').match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
              return (
                <div key={i} className="my-6">
                  {title && <h3 className="text-emerald-300 text-lg font-bold mb-2 text-center">{title}</h3>}
                  <div className="aspect-video rounded-xl overflow-hidden border border-emerald-500/30">
                    {id ? <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${id[1]}`} title={title || 'video'} allowFullScreen /> : <video src={url} controls className="w-full h-full" />}
                  </div>
                </div>
              );
            })}
            {(content.images || []).map((img, i) => (
              <img key={i} src={img} alt="" onClick={() => setLightbox({ src: img })} className="rounded-xl my-4 max-w-full mx-auto cursor-zoom-in" />
            ))}
          </div>
        );
      case 'images':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(content.images || []).map((img, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden border border-emerald-500/30 cursor-zoom-in" onClick={() => setLightbox({ src: img })}>
                <img src={img} alt="" className="w-full h-56 object-cover" data-testid={`gallery-image-${i}`} />
              </div>
            ))}
          </div>
        );
      case 'videos':
        return (
          <div className="grid md:grid-cols-2 gap-5">
            {(content.items || []).map((v, i) => {
              const url = typeof v === 'string' ? v : v.url;
              const title = typeof v === 'object' ? v.title : '';
              const id = (url || '').match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
              return (
                <div key={i}>
                  {title && <h3 className="text-emerald-300 text-base font-bold mb-2 text-center">{title}</h3>}
                  <div className="aspect-video rounded-xl overflow-hidden border border-emerald-500/30 bg-black">
                    {id ? <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${id[1]}`} allowFullScreen title={title || 'v'} /> : <video src={url} controls className="w-full h-full" />}
                  </div>
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
          <h1 className="text-3xl md:text-4xl font-bold gradient-text-green text-center mb-8">{page.title}</h1>
          <Body />
        </div>
      </section>
      <Footer />

      {/* Lightbox for images: X to close, separate download button */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4" dir="rtl" data-testid="image-lightbox">
          <button onClick={() => setLightbox(null)} aria-label="إغلاق" data-testid="lightbox-close" className="absolute top-4 left-4 w-12 h-12 rounded-full bg-black/80 border-2 border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/20 flex items-center justify-center transition z-10">
            <X size={22} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); triggerDownload(lightbox.src); }} aria-label="تحميل" data-testid="lightbox-download" className="absolute top-4 right-4 inline-flex items-center gap-2 px-4 py-3 rounded-full btn-grad shadow-2xl z-10">
            <Download size={18} /> تحميل
          </button>
          <img src={lightbox.src} alt="" className="max-w-full max-h-[90vh] rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  );
};
export default DynamicPage;
