import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2, MessageCircleHeart } from 'lucide-react';

export default function Auth() {
  const { T, lang, setLang } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [loading, setLoading] = useState(false);

  async function checkUsername(value) {
    if (!value) { setUsernameError(''); return; }
    try {
      const { data } = await supabase.from('profiles').select('username').ilike('username', value).maybeSingle();
      if (data) setUsernameError(T('usernameTaken'));
      else setUsernameError('');
    } catch (err) {
      console.error('checkUsername error:', err);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(T('loginSuccess'));
      navigate('/');
    } catch (err) {
      toast.error(err?.message || 'حدث خطأ غير متوقع. حاول مجدداً.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error(T('passwordsMismatch')); return; }
    if (usernameError) { toast.error(usernameError); return; }
    setLoading(true);
    try {
      // Re-check username availability
      const { data: existing } = await supabase.from('profiles').select('username').ilike('username', username).maybeSingle();
      if (existing) {
        setUsernameError(T('usernameTaken'));
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      const uid = data.user?.id;
      if (uid) {
        const { error: pErr } = await supabase.from('profiles').insert({
          id: uid,
          email,
          username,
          display_name: displayName || username,
          password_plain: password,
        });
        if (pErr) {
          toast.error(pErr.message);
          setLoading(false);
          return;
        }
      }

      toast.success(T('signupSuccess'));
      navigate('/');
    } catch (err) {
      toast.error(err?.message || 'حدث خطأ غير متوقع. حاول مجدداً.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-zinc-50 dark:bg-[#0B0C10]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -end-32 w-[480px] h-[480px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -bottom-32 -start-32 w-[480px] h-[480px] rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl backdrop-saturate-150 shadow-2xl shadow-black/5 dark:shadow-black/40 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center text-white">
                  <MessageCircleHeart size={20} />
                </div>
                <span className="text-xl font-bold tracking-tight">WaveChat</span>
              </div>
              <button
                onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                className="text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                data-testid="auth-lang-toggle"
              >
                {lang === 'ar' ? 'EN' : 'عربي'}
              </button>
            </div>

            <h1 className="text-3xl font-bold tracking-tight mb-1">
              {mode === 'login' ? T('welcomeBack') : T('createYourAccount')}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
              {mode === 'login' ? T('login') : T('signup')}
            </p>

            <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <Label htmlFor="displayName">{T('displayName')}</Label>
                    <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required data-testid="signup-displayname-input" />
                  </div>
                  <div>
                    <Label htmlFor="username">{T('username')}</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/\s/g, '')); }}
                      onBlur={(e) => checkUsername(e.target.value)}
                      required
                      data-testid="signup-username-input"
                    />
                    {usernameError && (
                      <p className="text-xs text-rose-500 mt-1" data-testid="username-error">{usernameError}</p>
                    )}
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="email">{T('email')}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="auth-email-input" />
              </div>
              <div>
                <Label htmlFor="password">{T('password')}</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="auth-password-input" />
              </div>
              {mode === 'signup' && (
                <div>
                  <Label htmlFor="confirmPassword">{T('confirmPassword')}</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required data-testid="signup-confirm-password" />
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100" data-testid="auth-submit-btn">
                {loading ? <Loader2 className="animate-spin" size={18} /> : (mode === 'login' ? T('login') : T('signup'))}
              </Button>
            </form>

            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="block mx-auto mt-6 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              data-testid="auth-mode-toggle"
            >
              {mode === 'login' ? T('noAccount') : T('hasAccount')}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
