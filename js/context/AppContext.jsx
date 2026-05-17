import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { translations } from '../lib/i18n';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState(() => localStorage.getItem('wave_lang') || 'ar');
  const [theme, setTheme] = useState(() => localStorage.getItem('wave_theme') || 'dark');
  const [siteSettings, setSiteSettings] = useState({ site_name: 'WaveChat', site_logo: '', maintenance: false, maintenance_message: '' });

  // Keep-alive interval ref to prevent garbage collection
  const keepAliveRef = useRef(null);
  const profileChannelRef = useRef(null);
  const siteChannelRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      let r = theme;
      if (theme === 'system') r = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', r === 'dark');
    };
    apply();
    localStorage.setItem('wave_theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('wave_lang', lang);
  }, [lang]);

  // Site settings channel - with stable channel name to avoid reconnect loops
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('site_settings').select('*').eq('id', 'global').maybeSingle();
      if (mounted && data) setSiteSettings(data);
    })();

    // Clean up old channel first
    if (siteChannelRef.current) {
      try { supabase.removeChannel(siteChannelRef.current); } catch (e) { /* noop */ }
    }

    const ch = supabase.channel('site_settings_global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, (p) => {
        if (p.new) setSiteSettings(p.new);
      })
      .subscribe();

    siteChannelRef.current = ch;
    return () => {
      mounted = false;
      try { supabase.removeChannel(ch); } catch (e) { /* noop */ }
    };
  }, []);

  // FIX: ensureProfile now only READS the profile, never overwrites user-set data
  // If profile doesn't exist yet (race condition right after signup), wait briefly and retry
  const ensureProfile = useCallback(async (au) => {
    // Try to load existing profile first
    const { data: existing } = await supabase.from('profiles').select('*').eq('id', au.id).maybeSingle();
    if (existing) return existing;

    // Profile not found yet — may be a race condition right after signup insert
    // Wait 800ms and retry once before auto-creating
    await new Promise(r => setTimeout(r, 800));
    const { data: retried } = await supabase.from('profiles').select('*').eq('id', au.id).maybeSingle();
    if (retried) return retried;

    // Only auto-create if truly no profile exists (e.g. OAuth users, not email/password signup)
    // For email/password, Auth.jsx already inserts the profile with correct username + displayName
    const baseUsername = (au.email || `user${Date.now()}`).split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    let username = baseUsername || `user${Math.floor(Math.random() * 9999)}`;
    let n = 0;
    while (n < 5) {
      const { data: taken } = await supabase.from('profiles').select('id').ilike('username', username).maybeSingle();
      if (!taken) break;
      n++; username = `${baseUsername}${Math.floor(Math.random() * 9999)}`;
    }
    const { data: created } = await supabase.from('profiles').insert({
      id: au.id, email: au.email, username, display_name: username, points: 0, role: 'user',
    }).select().single();
    return created;
  }, []);

  const refreshProfile = useCallback(async (id) => {
    const uid = id || authUser?.id;
    if (!uid) return null;
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (data) setUser(data);
    return data;
  }, [authUser]);

  // Auth state effect
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        if (session?.user) {
          setAuthUser(session.user);
          const p = await ensureProfile(session.user);
          if (p && mounted) setUser(p);
        }
        if (mounted) setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setAuthUser(session.user);
        const p = await ensureProfile(session.user);
        if (p) setUser(p);
      } else {
        setAuthUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [ensureProfile]);

  // Realtime profile sync - stable channel, no random suffix
  useEffect(() => {
    if (!user?.id) return;

    // Clean up old channel
    if (profileChannelRef.current) {
      try { supabase.removeChannel(profileChannelRef.current); } catch (e) { /* noop */ }
    }

    const ch = supabase.channel(`profile_self_${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, (p) => {
        if (p.new) setUser(p.new);
      })
      .subscribe();

    profileChannelRef.current = ch;
    return () => {
      try { supabase.removeChannel(ch); } catch (e) { /* noop */ }
    };
  }, [user?.id]);

  // FIX: Keep-alive ping to prevent Supabase realtime from timing out and causing "3 dots" disconnect
  // Supabase closes idle realtime connections after ~60s of no activity
  useEffect(() => {
    if (!user?.id) {
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
        keepAliveRef.current = null;
      }
      return;
    }

    // Ping Supabase every 30 seconds to keep the connection alive
    keepAliveRef.current = setInterval(async () => {
      try {
        // Lightweight query to keep connection alive
        await supabase.from('profiles').select('id').eq('id', user.id).limit(1);
      } catch (e) {
        // If this fails, try to refresh the session
        try {
          await supabase.auth.refreshSession();
        } catch (e2) { /* noop */ }
      }
    }, 30000); // every 30 seconds

    return () => {
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
        keepAliveRef.current = null;
      }
    };
  }, [user?.id]);

  // FIX: Handle page visibility changes — reconnect when tab becomes active again
  useEffect(() => {
    if (!user?.id) return;
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible') {
        // Refresh session and profile when user returns to tab
        try {
          await supabase.auth.refreshSession();
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
          if (data) setUser(data);
        } catch (e) { /* noop */ }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user?.id]);

  const signOut = async () => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
    await supabase.auth.signOut();
    setUser(null);
    setAuthUser(null);
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
      lang, setLang, theme, setTheme,
      siteSettings, setSiteSettings,
      refreshProfile, signOut, T,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
