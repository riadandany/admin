import { useEffect } from 'react';
import { useSite } from '../context/SiteContext';

// Updates browser title, favicon, and CSS color variables from settings
const HeadManager = () => {
  const { settings } = useSite();
  useEffect(() => {
    if (!settings) return;
    // Title
    if (settings.site_name) document.title = settings.site_name;
    // Favicon
    if (settings.logo_url) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
      link.href = settings.logo_url;
    }
    // Color vars
    const r = document.documentElement;
    const p = settings.primary_color || '#22c55e';
    const a = settings.accent_color || '#86efac';
    const bg = settings.background_color || '#050a05';
    const tx = settings.text_color || '#F0F0F0';
    r.style.setProperty('--c-primary', p);
    r.style.setProperty('--c-accent', a);
    r.style.setProperty('--c-bg', bg);
    r.style.setProperty('--c-text', tx);
    // Derived rgba (for borders/glows) - parse hex
    const hexToRgb = (h) => { const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h||''); return m ? `${parseInt(m[1],16)},${parseInt(m[2],16)},${parseInt(m[3],16)}` : '34,197,94'; };
    r.style.setProperty('--c-primary-rgb', hexToRgb(p));
    r.style.setProperty('--c-accent-rgb', hexToRgb(a));
    document.body.style.background = bg;
    document.body.style.color = tx;
  }, [settings]);
  return null;
};
export default HeadManager;
