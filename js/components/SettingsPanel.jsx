import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase, uploadFile } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { X, Bell, Lock, Sun, Moon, Monitor, ShoppingBag, Crown, Code2, Plus, Trash2 } from 'lucide-react';
import UserBadge, { FramedAvatar } from './UserBadge';

export default function SettingsPanel({ onClose, openStore, openAdminDev }) {
  const { user, refreshProfile, T, lang, setLang, theme, setTheme, signOut, siteSettings } = useApp();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [username, setUsername] = useState(user?.username || '');
  const [socialLinks, setSocialLinks] = useState(user?.social_links || []);
  const [newLink, setNewLink] = useState('');
  const [pin, setPin] = useState('');

  if (!user) return null;
  const owned = user.owned_items || [];
  const ownedNameColors = owned.filter(i => i.startsWith('name_color:'));
  const ownedBgs = owned.filter(i => i.startsWith('bg:'));
  const ownedFrames = owned.filter(i => i.startsWith('frame:'));

  async function saveProfile() {
    const { error } = await supabase.from('profiles').update({
      display_name: displayName,
      bio,
      social_links: socialLinks,
    }).eq('id', user.id);
    if (error) return toast.error(error.message);
    await refreshProfile();
    toast.success(T('saved'));
  }

  async function changeUsername() {
    const lastChange = user.last_username_change ? new Date(user.last_username_change) : null;
    if (lastChange && (Date.now() - lastChange.getTime()) < 7 * 24 * 60 * 60 * 1000) {
      return toast.error(T('usernameChangeLimit'));
    }
    if (!username) return;
    const { data: exists } = await supabase.from('profiles').select('id').ilike('username', username).neq('id', user.id).maybeSingle();
    if (exists) return toast.error(T('usernameTaken'));
    const { error } = await supabase.from('profiles').update({ username, last_username_change: new Date().toISOString() }).eq('id', user.id);
    if (error) return toast.error(error.message);
    await refreshProfile();
    toast.success(T('saved'));
  }

  async function changeAvatar(e) {
    const f = e.target.files?.[0]; if (!f) return;
    try {
      const url = await uploadFile('avatars', f, `${user.id}/`);
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
      await refreshProfile();
      toast.success(T('saved'));
    } catch (err) { toast.error(err.message); }
  }

  async function setNameColor(color) {
    // Free for premium/owner/dev, paid otherwise (already purchased)
    await supabase.from('profiles').update({ name_color: color }).eq('id', user.id);
    await refreshProfile();
    toast.success(T('saved'));
  }

  async function setBgColor(color) {
    await supabase.from('profiles').update({ background_value: color, background_type: 'color' }).eq('id', user.id);
    await refreshProfile();
    toast.success(T('saved'));
  }

  async function setFrame(frameId) {
    await supabase.from('profiles').update({ frame_id: frameId }).eq('id', user.id);
    await refreshProfile();
    toast.success(T('saved'));
  }

  function savePin() {
    if (pin.length !== 4 || !/^\d+$/.test(pin)) { toast.error('PIN must be 4 digits'); return; }
    localStorage.setItem('wave_pin', pin);
    sessionStorage.setItem('wave_pin_unlocked', '1');
    toast.success(T('pinSet'));
    setPin('');
  }
  function removePin() { localStorage.removeItem('wave_pin'); toast.success(T('removePin')); }

  async function requestNotifications() {
    if (!('Notification' in window)) return toast.error('not supported');
    const r = await Notification.requestPermission();
    if (r === 'granted') toast.success(T('notificationsEnabled'));
  }

  const isPremium = user.premium_until && new Date(user.premium_until) > new Date();
  const canFreeCustomize = isPremium || user.role === 'owner' || user.role === 'developer';

  const PRESET_COLORS = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#84cc16'];
  const PRESET_FRAMES = [
    { id: '#D4AF37', name: 'ذهبي' },
    { id: '#059669', name: 'زمردي' },
    { id: '#E11D48', name: 'ياقوتي' },
    { id: '#C0C0C0', name: 'فضي' },
  ];

  return (
    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#15161A] border border-black/5 dark:border-white/10 p-6 shadow-2xl"
        data-testid="settings-modal">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">{T('settings')}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        {/* Profile */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FramedAvatar profile={user} size={56} />
            <div>
              <UserBadge profile={user} />
              <div className="text-xs text-zinc-500">@{user.username} • <span className="text-amber-500 font-medium">{user.points} {T('points')}</span></div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500">{T('displayName')}</label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} data-testid="settings-displayname" />
            </div>
            <div>
              <label className="text-xs text-zinc-500">{T('username')}</label>
              <div className="flex gap-2">
                <Input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} />
                <Button variant="outline" onClick={changeUsername}>{T('save')}</Button>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-zinc-500">{T('bio')}</label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="..." />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-zinc-500">{T('socialLinks')}</label>
              <div className="flex gap-2">
                <Input value={newLink} onChange={(e) => setNewLink(e.target.value)} placeholder="https://..." />
                <Button variant="outline" onClick={() => { if (newLink) { setSocialLinks([...socialLinks, newLink]); setNewLink(''); } }}><Plus size={14}/></Button>
              </div>
              <div className="mt-2 space-y-1">
                {socialLinks.map((l, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-zinc-50 dark:bg-white/[0.04]">
                    <span className="truncate">{l}</span>
                    <button onClick={() => setSocialLinks(socialLinks.filter((_, idx) => idx !== i))}><Trash2 size={12} className="text-rose-500"/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <label className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-white/10 text-sm cursor-pointer">
              {T('changeAvatar')}
              <input type="file" className="hidden" accept="image/*" onChange={changeAvatar} data-testid="settings-avatar-input" />
            </label>
            <Button onClick={saveProfile} data-testid="settings-save-btn">{T('saveChanges')}</Button>
          </div>
        </section>

        {/* Appearance */}
        <section className="mb-8">
          <h3 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-3">{T('theme')} & {T('language')}</h3>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[{v:'light',i:Sun,l:T('light')},{v:'dark',i:Moon,l:T('dark')},{v:'system',i:Monitor,l:T('system')}].map(o => {
              const Icon = o.i;
              return (
                <button key={o.v} onClick={() => setTheme(o.v)} data-testid={`theme-${o.v}`}
                  className={`p-3 rounded-xl border ${theme === o.v ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-white/[0.06]' : 'border-black/5 dark:border-white/10'} flex flex-col items-center gap-1`}>
                  <Icon size={18} />
                  <span className="text-xs">{o.l}</span>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setLang('ar')} data-testid="lang-ar" className={`p-2.5 rounded-xl border ${lang === 'ar' ? 'border-zinc-900 dark:border-white' : 'border-black/5 dark:border-white/10'}`}>{T('arabic')}</button>
            <button onClick={() => setLang('en')} data-testid="lang-en" className={`p-2.5 rounded-xl border ${lang === 'en' ? 'border-zinc-900 dark:border-white' : 'border-black/5 dark:border-white/10'}`}>{T('english')}</button>
          </div>
        </section>

        {/* Customization (owned items) */}
        <section className="mb-8">
          <h3 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-3">{T('nameColor')}</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            <button onClick={() => setNameColor('')} className="text-xs px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/10">— None</button>
            {(canFreeCustomize ? PRESET_COLORS : ownedNameColors.map(o => o.split(':')[1])).map(c => (
              <button key={c} onClick={() => setNameColor(c)} style={{ background: c }} className="w-8 h-8 rounded-full ring-1 ring-black/10 dark:ring-white/10" data-testid={`name-color-${c}`} />
            ))}
          </div>

          <h3 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mt-4 mb-3">{T('backgroundColor')}</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            <button onClick={() => setBgColor('')} className="text-xs px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/10">— None</button>
            {(canFreeCustomize ? PRESET_COLORS : ownedBgs.map(o => o.split(':')[1])).map(c => (
              <button key={c} onClick={() => setBgColor(c)} style={{ background: c }} className="w-8 h-8 rounded-lg ring-1 ring-black/10 dark:ring-white/10" />
            ))}
          </div>

          <h3 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mt-4 mb-3">{T('profileFrame')}</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFrame('')} className="text-xs px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/10">— None</button>
            {(canFreeCustomize ? PRESET_FRAMES.map(f => f.id) : ownedFrames.map(o => o.split(':')[1])).map(f => (
              <button key={f} onClick={() => setFrame(f)} style={{ background: f }} className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-zinc-800" />
            ))}
          </div>
        </section>

        {/* Security */}
        <section className="mb-8">
          <h3 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-3 flex items-center gap-2"><Lock size={14}/> {T('pinLock')}</h3>
          <div className="flex items-center gap-2">
            <Input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder={T('pinPlaceholder')} className="max-w-xs" data-testid="pin-setup-input" />
            <Button onClick={savePin} data-testid="pin-save-btn">{T('setPin')}</Button>
            <Button variant="ghost" onClick={removePin}>{T('removePin')}</Button>
          </div>
          <Button variant="ghost" onClick={requestNotifications} className="mt-3"><Bell size={14} className="me-2"/>{T('enableNotifications')}</Button>
        </section>

        {/* Footer actions */}
        <div className="flex flex-wrap justify-between gap-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={openStore} data-testid="open-store-btn"><ShoppingBag size={14} className="me-2"/>{T('store')}</Button>
            {(user.role === 'owner' || user.role === 'developer') && (
              <Button variant="outline" onClick={openAdminDev} data-testid="open-admin-dev-btn">
                {user.role === 'owner' ? <Crown size={14} className="me-2"/> : <Code2 size={14} className="me-2"/>}
                {user.role === 'owner' ? T('ownerPanel') : T('devPanel')}
              </Button>
            )}
          </div>
          <Button variant="destructive" onClick={signOut} data-testid="logout-btn">{T('logout')}</Button>
        </div>
        <div className="mt-4 text-center text-xs text-zinc-400">{siteSettings.site_name}</div>
      </motion.div>
    </div>
  );
}
