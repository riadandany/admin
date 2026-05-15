import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Mail } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { playNav } from '../lib/sounds';

const Navbar = () => {
  const { settings, pages } = useSite();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const visiblePages = (pages || []).filter(p => p.show_in_nav);

  const linkCls = (slug) => `nav-pill px-4 py-2 rounded-full text-sm font-medium ${location.pathname === slug ? 'text-emerald-300 bg-emerald-500/10' : 'text-gray-200'}`;

  return (
    <header className="sticky top-0 z-40 w-full bg-black/70 backdrop-blur-md border-b border-emerald-500/10">
      <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
        <Link to="/" onClick={playNav} className="flex items-center gap-2">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="logo" className="w-9 h-9 rounded-full object-cover border border-emerald-500/40" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-emerald-950 font-bold text-sm">{(settings.site_name||'M').charAt(0)}</div>
          )}
          <span className="text-white text-lg font-bold tracking-wide">{settings.site_name}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          <Link onClick={playNav} to="/" className={linkCls('/')}>الرئيسية</Link>
          {visiblePages.map(p => (
            <Link key={p.id} onClick={playNav} to={p.slug.startsWith('/') ? p.slug : '/' + p.slug} className={linkCls(p.slug.startsWith('/') ? p.slug : '/' + p.slug)}>{p.title}</Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center">
          <Link onClick={playNav} to="/contact" className="px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-semibold border border-emerald-500/40 hover:bg-emerald-500/30 transition flex items-center gap-1.5">
            <Mail size={14} /> تواصل معنا
          </Link>
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden text-white p-2">{open ? <X size={22}/> : <Menu size={22}/>}</button>
      </div>
      {open && (
        <div className="md:hidden border-t border-emerald-500/10 bg-black/95 px-5 py-3 space-y-1">
          <Link to="/" onClick={() => { setOpen(false); playNav(); }} className={`block ${linkCls('/')}`}>الرئيسية</Link>
          {visiblePages.map(p => (
            <Link key={p.id} to={p.slug.startsWith('/') ? p.slug : '/' + p.slug} onClick={() => { setOpen(false); playNav(); }} className={`block ${linkCls(p.slug)}`}>{p.title}</Link>
          ))}
          <Link to="/contact" onClick={() => { setOpen(false); playNav(); }} className="block px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-300 text-sm">تواصل معنا</Link>
        </div>
      )}
    </header>
  );
};
export default Navbar;
