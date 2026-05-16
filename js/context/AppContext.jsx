import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { translations } from '../lib/i18n';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null); // profile row from public.profiles
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState(() => localStorage.getItem('wave_lang') || 'ar');
  const [theme, setTheme] = useState(() => localStorage.getItem('wave_theme') || 'system');
  const [siteSettings, setSiteSettings] = useState({ site_name: 'WaveChat', site_logo: '', maintenance: false, maintenance_message: '' });
  const [pinUnlocked, setPinUnlocked] = useState(false);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      let resolved = theme;
      if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      root.classList.toggle('dark', resolved === 'dark');
    };
    applyTheme();
    localStorage.setItem('wave_theme', theme);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const cb = () => theme === 'system' && applyTheme();
    mq.addEventListener?.('change', cb);
    return () => mq.removeEventListener?.('change', cb);
  }, [theme]);

  // Apply language / direction
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('wave_lang', lang);
  }, [lang]);

  // Load site settings + subscribe
  useEffect(() => {
    let ch;
    (async () => {
      const { data } = await supabase.from('site_settings').select('*').eq('id', 'global').maybeSingle();
      if (data) setSiteSettings(data);
      ch = supabase
        .channel(`site_settings_${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, (payload) => {
          if (payload.new) setSiteSettings(payload.new);
        })
        .subscribe();
    })();
    return () => { try { ch && supabase.removeChannel(ch); } catch (e) { /* noop */ } };
  }, []);

  // Auth bootstrap
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        if (session?.user) {
          setAuthUser(session.user);
          await refreshProfile(session.user.id);
        }
        setLoading(false);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setAuthUser(session.user);
        await refreshProfile(session.user.id);
      } else {
        setAuthUser(null);
        setUser(null);
      }
    });
    return () => { mounted = false; sub?.subscription?.unsubscribe?.(); };
    // eslint-disable-next-line
  }, []);

  const refreshProfile = useCallback(async (id) => {
    const uid = id || authUser?.id;
    if (!uid) return null;
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (data) setUser(data);
    return data;
  }, [authUser]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAuthUser(null);
    setPinUnlocked(false);
  };

  const T = useCallback((key, vars = {}) => {
    const dict = translations[lang] || translations.en;
    let str = dict[key] || translations.en[key] || key;
    Object.keys(vars).forEach((k) => { str = str.replace(`{${k}}`, vars[k]); });
    return str;
  }, [lang]);

  return (
    <AppContext.Provider value={{
      user, authUser, loading,
      lang, setLang,
      theme, setTheme,
      siteSettings, setSiteSettings,
      pinUnlocked, setPinUnlocked,
      refreshProfile, signOut, T,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
