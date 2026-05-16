import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { playButton } from '../lib/sounds';

const AdPopup = () => {
  const { ads } = useSite();
  const location = useLocation();
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (!ads || ads.length === 0) { setActive(null); return; }
    const path = location.pathname;
    const matching = ads.filter(a => {
      const pgs = a.show_on_pages || ['*'];
      return pgs.includes('*') || pgs.includes(path);
    });
    for (const a of matching) {
      const mode = a.display_mode || 'once';
      if (mode === 'once') {
        // Once per browser (persistent)
        const key = 'ad_seen_' + a.id;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, '1');
          setActive(a);
          return;
        }
      } else if (mode === 'session') {
        // Once per session (until tab close)
        const key = 'ad_seen_session_' + a.id;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          setActive(a);
          return;
        }
      } else {
        // 'always' - show every visit, but only the first time per route within this session
        const key = 'ad_route_' + a.id + '_' + path;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          setActive(a);
          return;
        }
      }
    }
    setActive(null);
  }, [ads, location.pathname]);

  if (!active) return null;

  const isInternal = active.button_internal;
  const BtnTag = isInternal ? Link : 'a';
  const btnProps = isInternal ? { to: active.button_url || '/' } : { href: active.button_url, target: '_blank', rel: 'noreferrer' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={() => setActive(null)} />
      <div className="relative pointer-events-auto w-full max-w-md bg-gradient-to-br from-emerald-900/95 to-black/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-7 shadow-2xl text-center fade-in-up">
        <button onClick={() => setActive(null)} className="absolute top-2 left-2 w-9 h-9 rounded-full bg-black/60 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition flex items-center justify-center">
          <X size={16} />
        </button>
        <h3 className="text-white text-2xl font-bold mb-3">{active.title}</h3>
        {active.description && <p className="text-gray-200 mb-5 whitespace-pre-line">{active.description}</p>}
        {active.button_text && active.button_url && (
          <BtnTag {...btnProps} onClick={playButton} className="inline-block btn-grad px-6 py-3 rounded-lg">
            {active.button_text}
          </BtnTag>
        )}
      </div>
    </div>
  );
};

export default AdPopup;
