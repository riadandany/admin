import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useSite } from '../context/SiteContext';
import { playPage, playButton } from '../lib/sounds';

const Home = () => {
  const { settings, buttons } = useSite();
  useEffect(() => { playPage(); }, []);
  const size = settings.logo_size || 140;

  const primary = settings.primary_color || '#22c55e';

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl" style={{ background: settings.background_color }}>
      <Navbar />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 radial-green pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-5 py-20 md:py-28 text-center fade-in-up">
          <div className="flex justify-center mb-7">
            <div className="relative" style={{ width: size + 40, height: size + 40 }}>
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400/60 spin-slow" />
              <div className="absolute inset-3 rounded-full pulse-ring" />
              <div className="absolute inset-4 rounded-full overflow-hidden border-2 border-emerald-400/40 bg-black">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-emerald-300 text-4xl font-bold">{(settings.site_name||'M').charAt(0)}</div>
                )}
              </div>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm mb-5">
            <Sparkles size={14} /> {settings.hero_message}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-3">
            <span className="block text-white">أهلاً بكم في موقع</span>
            <span className="block gradient-text-green mt-2" style={{ background: `linear-gradient(135deg, ${settings.accent_color} 0%, ${primary} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{settings.site_name}</span>
          </h1>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">{settings.site_description}</p>

          {buttons && buttons.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
              {buttons.map(b => {
                const external = b.target_type === 'external';
                if (external) return <a key={b.id} href={b.target_url} target="_blank" rel="noreferrer" onClick={playButton} className="btn-grad px-7 py-3 rounded-full">{b.label}</a>;
                return <Link key={b.id} to={b.target_url} onClick={playButton} className="btn-grad px-7 py-3 rounded-full">{b.label}</Link>;
              })}
            </div>
          )}
        </div>
      </section>

      {settings.about_text && (
        <section className="relative py-16">
          <div className="absolute inset-0 radial-green opacity-40 pointer-events-none" />
          <div className="relative max-w-4xl mx-auto px-5">
            <div className="glass-card rounded-2xl px-8 py-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold gradient-text-green mb-4">عنّي</h2>
              <p className="text-gray-200 text-lg whitespace-pre-line">{settings.about_text}</p>
            </div>
          </div>
        </section>
      )}
      <Footer />
    </div>
  );
};
export default Home;
