import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { Crown, Code2, ShieldCheck, BadgeCheck, ArrowLeft, Search, Ban, Lock, Trash2, Plus, Eye, Megaphone, Settings as SetIcon, Wrench } from 'lucide-react';
import UserBadge, { FramedAvatar } from '../components/UserBadge';

export default function AdminDev() {
  const { user, siteSettings, T, refreshProfile } = useApp();
  const navigate = useNavigate();

  // Two-step access: if user is owner/developer, allow direct; else require admin/1234
  const [accessGranted, setAccessGranted] = useState(!!user && (user.role === 'owner' || user.role === 'developer'));
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');

  const ADMIN_USERNAME = process.env.REACT_APP_ADMIN_USERNAME || 'admin';
  const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || '1234';

  const [tab, setTab] = useState('users');

  // ---- USERS ----
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [createForm, setCreateForm] = useState({ email: '', password: '', username: '', display_name: '', role: 'user' });
  const [banForm, setBanForm] = useState({ target_id: '', duration: 'permanent', custom_days: 1, reason: '' });

  // ---- CODES ----
  const [codes, setCodes] = useState([]);
  const [codeForm, setCodeForm] = useState({ code: '', points: 0, premium_duration: '', name_color: '', background_value: '', background_type: '', frame_id: '', max_uses: 1, expires: 'permanent', expires_days: 7 });

  // ---- SITE ----
  const [siteForm, setSiteForm] = useState({ site_name: '', site_logo: '', maintenance: false, maintenance_message: '' });
  const [broadcastText, setBroadcastText] = useState('');

  // ---- GROUPS ----
  const [groupId, setGroupId] = useState('');
  const [groupFound, setGroupFound] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);

  // ---- EMOJIS ----
  const [packForm, setPackForm] = useState({ id: '', name: '', locked: false, price: 0 });
  const [emojiPacks, setEmojiPacks] = useState([]);

  useEffect(() => {
    if (!accessGranted) return;
    (async () => {
      const { data: c } = await supabase.from('codes').select('*').order('created_at', { ascending: false });
      setCodes(c || []);
      setSiteForm(siteSettings);
      const { data: ep } = await supabase.from('emoji_packs').select('*');
      setEmojiPacks(ep || []);
    })();
  }, [accessGranted, siteSettings]);

  function tryAdminLogin(e) {
    e.preventDefault();
    if (adminUser === ADMIN_USERNAME && adminPass === ADMIN_PASSWORD) {
      setAccessGranted(true);
      toast.success(T('loginSuccess'));
    } else toast.error('Invalid');
  }

  // Search profile
  async function doSearch() {
    if (!search) { setSearchResults([]); return; }
    const { data } = await supabase.from('profiles').select('*').or(`username.ilike.%${search}%,email.ilike.%${search}%`).limit(20);
    setSearchResults(data || []);
  }

  async function setRole(targetId, role) {
    if (role === 'owner') {
      // Only one owner allowed
      await supabase.from('profiles').update({ role: 'user' }).eq('role', 'owner');
    }
    await supabase.from('profiles').update({ role }).eq('id', targetId);
    toast.success(T('saved'));
    doSearch();
    if (targetId === user?.id) refreshProfile();
  }

  async function toggleVerify(targetId, curr) {
    await supabase.from('profiles').update({ verified: !curr }).eq('id', targetId);
    toast.success(T('saved'));
    doSearch();
  }

  async function banUser(target) {
    const isDevApplying = user?.role === 'developer';
    let until = null;
    const now = new Date();
    if (banForm.duration === 'permanent') {
      if (isDevApplying) return toast.error('المطور: حد أقصى أسبوع');
      until = null;
    } else if (banForm.duration === 'week') { now.setDate(now.getDate() + 7); until = now.toISOString(); }
    else if (banForm.duration === 'month') {
      if (isDevApplying) return toast.error('المطور: حد أقصى أسبوع');
      now.setDate(now.getDate() + 30); until = now.toISOString();
    } else if (banForm.duration === 'year') {
      if (isDevApplying) return toast.error('المطور: حد أقصى أسبوع');
      now.setDate(now.getDate() + 365); until = now.toISOString();
    } else if (banForm.duration === 'custom') {
      now.setDate(now.getDate() + parseInt(banForm.custom_days || 1));
      until = now.toISOString();
    }
    await supabase.from('profiles').update({ banned_until: until, ban_reason: banForm.reason }).eq('id', target);
    toast.success(T('saved'));
    doSearch();
  }

  async function unban(target) {
    await supabase.from('profiles').update({ banned_until: null, ban_reason: '' }).eq('id', target);
    toast.success(T('saved'));
    doSearch();
  }

  // Create user (via Auth signUp)
  async function createUser() {
    const { email, password, username, display_name, role } = createForm;
    if (!email || !password || !username) return toast.error('Missing fields');
    const { data: ex } = await supabase.from('profiles').select('id').ilike('username', username).maybeSingle();
    if (ex) return toast.error(T('usernameTaken'));
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return toast.error(error.message);
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id, email, username, display_name: display_name || username, password_plain: password, role
      });
      toast.success(T('saved'));
      setCreateForm({ email: '', password: '', username: '', display_name: '', role: 'user' });
    }
  }

  // Codes
  async function createCode() {
    const c = codeForm;
    const code = (c.code || Math.random().toString(36).slice(2, 10)).toUpperCase();
    let expires_at = null;
    if (c.expires !== 'permanent') {
      const d = new Date(); d.setDate(d.getDate() + parseInt(c.expires_days || 7)); expires_at = d.toISOString();
    }
    const { error } = await supabase.from('codes').insert({
      code, points: parseInt(c.points || 0),
      premium_duration: c.premium_duration,
      name_color: c.name_color, background_value: c.background_value, background_type: c.background_type, frame_id: c.frame_id,
      max_uses: c.max_uses === -1 || c.max_uses === '-1' ? -1 : parseInt(c.max_uses || 1),
      expires_at,
    });
    if (error) return toast.error(error.message);
    toast.success(T('saved'));
    const { data: cs } = await supabase.from('codes').select('*').order('created_at', { ascending: false });
    setCodes(cs || []);
  }

  async function deleteCode(id) {
    await supabase.from('codes').delete().eq('id', id);
    setCodes(codes.filter(c => c.id !== id));
  }

  // Site
  async function saveSite() {
    await supabase.from('site_settings').update(siteForm).eq('id', 'global');
    toast.success(T('saved'));
  }
  async function sendBroadcast() {
    if (!broadcastText.trim()) return;
    if (user?.role !== 'owner') return toast.error('فقط المالك يستطيع');
    await supabase.from('broadcasts').insert({ sender_id: user.id, content: broadcastText });
    setBroadcastText('');
    toast.success(T('saved'));
  }

  // Groups
  async function findGroup() {
    if (!groupId) return;
    const { data } = await supabase.from('conversations').select('*').eq('id', groupId).maybeSingle();
    setGroupFound(data || null);
    if (data) {
      const { data: m } = await supabase.from('conversation_members').select('*').eq('conversation_id', data.id);
      setGroupMembers(m || []);
    }
  }
  async function deleteGroup() {
    if (!groupFound) return;
    if (!window.confirm('Confirm')) return;
    await supabase.from('conversations').delete().eq('id', groupFound.id);
    setGroupFound(null); setGroupMembers([]);
    toast.success(T('saved'));
  }
  async function saveGroup() {
    await supabase.from('conversations').update({ name: groupFound.name, description: groupFound.description, only_admins_send: groupFound.only_admins_send }).eq('id', groupFound.id);
    toast.success(T('saved'));
  }

  // Emojis
  async function createPack() {
    const { error } = await supabase.from('emoji_packs').insert({ id: packForm.id, name: packForm.name, locked: packForm.locked, price: parseInt(packForm.price || 0) });
    if (error) return toast.error(error.message);
    const { data } = await supabase.from('emoji_packs').select('*');
    setEmojiPacks(data || []);
    setPackForm({ id: '', name: '', locked: false, price: 0 });
    toast.success(T('saved'));
  }
  async function deletePack(id) {
    await supabase.from('emoji_packs').delete().eq('id', id);
    setEmojiPacks(emojiPacks.filter(p => p.id !== id));
  }

  if (!accessGranted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0B0C10] p-6">
        <motion.form onSubmit={tryAdminLogin} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <Wrench size={18} />
            <h1 className="text-xl font-bold">{T('devLogin')}</h1>
          </div>
          <Label>{T('username')}</Label>
          <Input value={adminUser} onChange={(e) => setAdminUser(e.target.value)} className="mb-3" data-testid="admin-username-input" />
          <Label>{T('password')}</Label>
          <Input type="password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} className="mb-4" data-testid="admin-password-input" />
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate('/')}><ArrowLeft size={14} className="me-2"/>{T('back')}</Button>
            <Button type="submit" className="flex-1" data-testid="admin-login-btn">{T('login')}</Button>
          </div>
        </motion.form>
      </div>
    );
  }

  const TabBtn = ({ id, icon: Icon, label }) => (
    <button onClick={() => setTab(id)} data-testid={`tab-${id}`}
      className={`px-3 py-2 rounded-xl text-sm flex items-center gap-2 ${tab === id ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-white/[0.06]'}`}>
      <Icon size={14}/> {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0B0C10]">
      <header className="sticky top-0 z-10 backdrop-blur-xl backdrop-saturate-150 bg-white/70 dark:bg-white/[0.04] border-b border-black/5 dark:border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench size={16}/>
          <h1 className="font-bold tracking-tight">{user?.role === 'owner' ? T('ownerPanel') : (user?.role === 'developer' ? T('devPanel') : T('devLogin'))}</h1>
        </div>
        <Button variant="ghost" onClick={() => navigate('/')} data-testid="back-home-btn"><ArrowLeft size={14} className="me-2"/>{T('back')}</Button>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        <div className="flex flex-wrap gap-2 mb-6">
          <TabBtn id="users" icon={Search} label={T('userManagement')} />
          <TabBtn id="codes" icon={Plus} label={T('createCode')} />
          <TabBtn id="groups" icon={ShieldCheck} label={T('groupManagement')} />
          <TabBtn id="emojis" icon={Plus} label={T('emojisManagement')} />
          <TabBtn id="site" icon={SetIcon} label={T('siteSettings')} />
        </div>

        {tab === 'users' && (
          <section className="space-y-4">
            <div className="rounded-2xl p-4 border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03]">
              <h3 className="font-semibold mb-3">{T('searchUsers')}</h3>
              <div className="flex gap-2">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={T('searchUsernames')} data-testid="admin-user-search" />
                <Button onClick={doSearch} data-testid="admin-search-btn"><Search size={14}/></Button>
              </div>
              <div className="mt-3 space-y-2">
                {searchResults.map(u => (
                  <div key={u.id} className="p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <FramedAvatar profile={u} size={36} />
                      <div className="flex-1 min-w-0">
                        <UserBadge profile={u} />
                        <div className="text-xs text-zinc-500">@{u.username} · {u.email}</div>
                        <div className="text-xs text-zinc-500">{T('password')}: <code className="font-mono">{u.password_plain || '—'}</code></div>
                        {u.banned_until && <div className="text-xs text-rose-500">Banned until {new Date(u.banned_until).toLocaleString()}</div>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Button size="sm" variant="outline" onClick={() => setRole(u.id, 'owner')} disabled={user?.role !== 'owner'}><Crown size={12} className="me-1"/>{T('setOwner')}</Button>
                      <Button size="sm" variant="outline" onClick={() => setRole(u.id, 'developer')} disabled={user?.role !== 'owner'}><Code2 size={12} className="me-1"/>{T('setDeveloper')}</Button>
                      <Button size="sm" variant="outline" onClick={() => setRole(u.id, 'user')}>{T('removeRole')}</Button>
                      <Button size="sm" variant="outline" onClick={() => toggleVerify(u.id, u.verified)}><BadgeCheck size={12} className="me-1"/>{u.verified ? T('unverify') : T('verifyUser')}</Button>
                      <Button size="sm" variant="outline" onClick={() => unban(u.id)}><Lock size={12} className="me-1"/>{T('unbanUser')}</Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 items-center">
                      <select value={banForm.duration} onChange={(e) => setBanForm({ ...banForm, duration: e.target.value })} className="text-xs p-2 rounded-lg bg-white dark:bg-white/10 border border-black/5 dark:border-white/10">
                        <option value="week">أسبوع</option>
                        <option value="month">شهر</option>
                        <option value="year">سنة</option>
                        <option value="custom">مخصص (أيام)</option>
                        <option value="permanent">دائم</option>
                      </select>
                      {banForm.duration === 'custom' && (
                        <Input type="number" value={banForm.custom_days} onChange={(e) => setBanForm({ ...banForm, custom_days: e.target.value })} className="w-24" />
                      )}
                      <Input placeholder="reason" value={banForm.reason} onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })} className="flex-1 min-w-[120px]" />
                      <Button size="sm" variant="destructive" onClick={() => banUser(u.id)}><Ban size={12} className="me-1"/>{T('banUser')}</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-4 border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03]">
              <h3 className="font-semibold mb-3">{T('createUser')}</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                <Input placeholder={T('email')} value={createForm.email} onChange={(e) => setCreateForm({...createForm, email: e.target.value})} data-testid="create-user-email" />
                <Input placeholder={T('password')} value={createForm.password} onChange={(e) => setCreateForm({...createForm, password: e.target.value})} />
                <Input placeholder={T('username')} value={createForm.username} onChange={(e) => setCreateForm({...createForm, username: e.target.value})} />
                <Input placeholder={T('displayName')} value={createForm.display_name} onChange={(e) => setCreateForm({...createForm, display_name: e.target.value})} />
              </div>
              <Button onClick={createUser} className="mt-2" data-testid="create-user-btn">{T('createUser')}</Button>
            </div>

            {user?.role === 'owner' && (
              <div className="rounded-2xl p-4 border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03]">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Megaphone size={14}/> {T('broadcast')}</h3>
                <Textarea value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} placeholder={T('broadcastMessage')} data-testid="broadcast-input" />
                <Button onClick={sendBroadcast} className="mt-2" data-testid="broadcast-send-btn">{T('sendBroadcast')}</Button>
              </div>
            )}
          </section>
        )}

        {tab === 'codes' && (
          <section className="space-y-4">
            <div className="rounded-2xl p-4 border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03]">
              <h3 className="font-semibold mb-3">{T('createCode')}</h3>
              <div className="grid sm:grid-cols-3 gap-2">
                <Input placeholder={T('codeName')} value={codeForm.code} onChange={(e) => setCodeForm({...codeForm, code: e.target.value})} />
                <Input placeholder={T('codePoints')} type="number" value={codeForm.points} onChange={(e) => setCodeForm({...codeForm, points: e.target.value})} />
                <select className="p-2 rounded-lg bg-white dark:bg-white/10 border border-black/5 dark:border-white/10" value={codeForm.premium_duration} onChange={(e) => setCodeForm({...codeForm, premium_duration: e.target.value})}>
                  <option value="">— premium —</option>
                  <option value="week">أسبوع</option>
                  <option value="month">شهر</option>
                  <option value="year">سنة</option>
                </select>
                <Input placeholder="name_color (#hex)" value={codeForm.name_color} onChange={(e) => setCodeForm({...codeForm, name_color: e.target.value})} />
                <Input placeholder="background (#hex or url)" value={codeForm.background_value} onChange={(e) => setCodeForm({...codeForm, background_value: e.target.value})} />
                <select className="p-2 rounded-lg bg-white dark:bg-white/10 border border-black/5 dark:border-white/10" value={codeForm.background_type} onChange={(e) => setCodeForm({...codeForm, background_type: e.target.value})}>
                  <option value="">— bg type —</option>
                  <option value="color">color</option>
                  <option value="image">image</option>
                </select>
                <Input placeholder="frame (#hex)" value={codeForm.frame_id} onChange={(e) => setCodeForm({...codeForm, frame_id: e.target.value})} />
                <div className="flex gap-1">
                  <Input placeholder={T('maxUses')} type="number" value={codeForm.max_uses} onChange={(e) => setCodeForm({...codeForm, max_uses: e.target.value})} />
                  <Button variant="outline" size="sm" onClick={() => setCodeForm({...codeForm, max_uses: -1})}>∞</Button>
                </div>
                <select className="p-2 rounded-lg bg-white dark:bg-white/10 border border-black/5 dark:border-white/10" value={codeForm.expires} onChange={(e) => setCodeForm({...codeForm, expires: e.target.value})}>
                  <option value="permanent">{T('permanent')}</option>
                  <option value="days">days</option>
                </select>
                {codeForm.expires === 'days' && <Input type="number" placeholder="days" value={codeForm.expires_days} onChange={(e) => setCodeForm({...codeForm, expires_days: e.target.value})} />}
              </div>
              <Button onClick={createCode} className="mt-3" data-testid="create-code-btn">{T('createCode')}</Button>
            </div>

            <div className="rounded-2xl p-4 border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03]">
              <h3 className="font-semibold mb-3">{T('activeCodes')}</h3>
              <div className="space-y-2">
                {codes.map(c => (
                  <div key={c.id} className="flex flex-wrap items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-white/[0.04]">
                    <div className="text-sm">
                      <code className="font-mono font-bold">{c.code}</code> · {c.points}p ·
                      uses {c.used_count}/{c.max_uses === -1 ? '∞' : c.max_uses}
                      {c.expires_at && <> · until {new Date(c.expires_at).toLocaleDateString()}</>}
                      {!c.expires_at && <> · {T('permanent')}</>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => deleteCode(c.id)}><Trash2 size={12} className="text-rose-500"/></Button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {tab === 'groups' && (
          <section className="rounded-2xl p-4 border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03]">
            <h3 className="font-semibold mb-3">{T('groupManagement')}</h3>
            <div className="flex gap-2 mb-3">
              <Input placeholder={T('groupId')} value={groupId} onChange={(e) => setGroupId(e.target.value)} data-testid="admin-group-id" />
              <Button onClick={findGroup}><Search size={14}/></Button>
            </div>
            {groupFound && (
              <div className="space-y-2">
                <Input value={groupFound.name || ''} onChange={(e) => setGroupFound({...groupFound, name: e.target.value})} />
                <Textarea value={groupFound.description || ''} onChange={(e) => setGroupFound({...groupFound, description: e.target.value})} />
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.04]">
                  <span className="text-sm">{T('onlyAdminsSend')}</span>
                  <Switch checked={!!groupFound.only_admins_send} onCheckedChange={(v) => setGroupFound({...groupFound, only_admins_send: v})} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveGroup}>{T('save')}</Button>
                  <Button variant="destructive" onClick={deleteGroup}>{T('deleteGroup')}</Button>
                </div>
                <div className="text-xs text-zinc-500 mt-2">Members: {groupMembers.length}</div>
              </div>
            )}
          </section>
        )}

        {tab === 'emojis' && (
          <section className="rounded-2xl p-4 border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03]">
            <h3 className="font-semibold mb-3">{T('addEmojiPack')}</h3>
            <div className="grid sm:grid-cols-4 gap-2">
              <Input placeholder="id" value={packForm.id} onChange={(e) => setPackForm({...packForm, id: e.target.value})} />
              <Input placeholder={T('packName')} value={packForm.name} onChange={(e) => setPackForm({...packForm, name: e.target.value})} />
              <Input type="number" placeholder="price" value={packForm.price} onChange={(e) => setPackForm({...packForm, price: e.target.value})} />
              <label className="flex items-center gap-2 text-sm"><Switch checked={packForm.locked} onCheckedChange={(v) => setPackForm({...packForm, locked: v})} /> {T('locked')}</label>
            </div>
            <Button onClick={createPack} className="mt-3">{T('addEmojiPack')}</Button>
            <div className="mt-4 space-y-2">
              {emojiPacks.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-white/[0.04]">
                  <span>{p.name} ({p.id}) · {p.locked ? `${p.price}p` : T('free')}</span>
                  <Button size="sm" variant="ghost" onClick={() => deletePack(p.id)}><Trash2 size={12} className="text-rose-500"/></Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'site' && (
          <section className="rounded-2xl p-4 border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] space-y-3">
            <h3 className="font-semibold mb-1">{T('siteSettings')}</h3>
            <div>
              <Label>{T('siteName')}</Label>
              <Input value={siteForm.site_name || ''} onChange={(e) => setSiteForm({...siteForm, site_name: e.target.value})} data-testid="site-name-input" />
            </div>
            <div>
              <Label>{T('siteLogo')} (URL)</Label>
              <Input value={siteForm.site_logo || ''} onChange={(e) => setSiteForm({...siteForm, site_logo: e.target.value})} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.04]">
              <span className="text-sm">{T('maintenanceMode')}</span>
              <Switch checked={!!siteForm.maintenance} onCheckedChange={(v) => setSiteForm({...siteForm, maintenance: v})} data-testid="maintenance-toggle" />
            </div>
            <div>
              <Label>{T('maintenanceMessage')}</Label>
              <Textarea value={siteForm.maintenance_message || ''} onChange={(e) => setSiteForm({...siteForm, maintenance_message: e.target.value})} />
            </div>
            <Button onClick={saveSite} data-testid="save-site-btn">{T('save')}</Button>
          </section>
        )}
      </div>
    </div>
  );
}
