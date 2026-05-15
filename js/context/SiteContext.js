import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { setSoundSettings } from '../lib/sounds';

const SiteContext = createContext(null);

const DEFAULT_SETTINGS = {
  id: 1,
  site_name: 'موقعي',
  site_description: 'نورتوني — موقعي الشخصي الفاخر',
  logo_url: '',
  logo_size: 140,
  hero_message: 'نحن الفخامة',
  about_text: 'هنا تكتب نبذة قصيرة عنك من لوحة المطور.',
  primary_color: '#22c55e',
  accent_color: '#86efac',
  background_color: '#050a05',
  text_color: '#F0F0F0',
  sound_nav_url: '',
  sound_button_url: '',
  sound_page_url: ''
};

export const SiteProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem('mr_site_settings_cache');
      return cached ? JSON.parse(cached) : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });
  const [pages, setPages] = useState([]);
  const [buttons, setButtons] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(() => sessionStorage.getItem('mr_admin_auth') === '1');

  const refreshAll = useCallback(async () => {
    const [s, p, b, a] = await Promise.all([
      supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('pages').select('*').order('nav_order', { ascending: true }),
      supabase.from('home_buttons').select('*').order('btn_order', { ascending: true }),
      supabase.from('ads').select('*').eq('is_active', true).order('created_at', { ascending: false })
    ]);
    if (s.data) {
      setSettings(s.data);
      setSoundSettings(s.data);
      try { localStorage.setItem('mr_site_settings_cache', JSON.stringify(s.data)); } catch {}
    }
    if (p.data) setPages(p.data);
    if (b.data) setButtons(b.data);
    if (a.data) setAds(a.data);
    setLoading(false);
  }, []);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  const updateSettings = async (patch) => {
    const next = { ...settings, ...patch, updated_at: new Date().toISOString() };
    setSettings(next);
    setSoundSettings(next);
    await supabase.from('site_settings').upsert({ ...next }).eq('id', 1);
  };

  const login = async (username, password) => {
    const { data, error } = await supabase.rpc('verify_admin', { p_username: username, p_password: password });
    if (!error && data === true) {
      sessionStorage.setItem('mr_admin_auth', '1');
      setIsAuthed(true);
      return true;
    }
    return false;
  };

  const logout = () => { sessionStorage.removeItem('mr_admin_auth'); setIsAuthed(false); };

  return (
    <SiteContext.Provider value={{
      settings, pages, buttons, ads, loading, isAuthed,
      refreshAll, updateSettings, login, logout, setPages, setButtons, setAds
    }}>
      {children}
    </SiteContext.Provider>
  );
};

export const useSite = () => useContext(SiteContext);
