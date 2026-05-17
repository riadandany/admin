import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Settings as SettingsIcon, ShoppingBag, Crown, Code2, LogOut, Megaphone } from 'lucide-react';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import SettingsPanel from '../components/SettingsPanel';
import StorePanel from '../components/StorePanel';
import UserBadge, { FramedAvatar } from '../components/UserBadge';
import { toast } from 'sonner';

export default function Home() {
  const { user, T, siteSettings, signOut } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [broadcast, setBroadcast] = useState(null);

  // Subscribe to latest broadcast
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (data) {
        const seen = localStorage.getItem('wave_seen_broadcast');
        if (seen !== data.id) setBroadcast(data);
      }
    })();
    const ch = supabase.channel(`broadcasts_${Math.random().toString(36).slice(2)}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broadcasts' }, (p) => {
      setBroadcast(p.new);
      toast.message('📣 ' + p.new.content);
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  if (!user) return null;
  const bgStyle = user.background_type === 'image' && user.background_value
    ? { backgroundImage: `url(${user.background_value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : user.background_type === 'color' && user.background_value
      ? { background: user.background_value }
      : {};

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="sticky top-0 z-20 backdrop-blur-xl backdrop-saturate-150 bg-white/70 dark:bg-white/[0.04] border-b border-black/5 dark:border-white/10 px-4 py-3 flex items-center justify-between" data-testid="app-header">
        <div className="flex items-center gap-2">
          {siteSettings.site_logo ? (
            <img src={siteSettings.site_logo} alt="logo" className="w-8 h-8 rounded-xl object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500" />
          )}
          <span className="font-bold tracking-tight">{siteSettings.site_name || 'WaveChat'}</span>
        </div>
        <div className="flex items-center gap-1">
          {(user.role === 'owner' || user.role === 'developer') && (
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin-dev')} title={user.role === 'owner' ? T('ownerPanel') : T('devPanel')} data-testid="header-admin-dev-btn">
              {user.role === 'owner' ? <Crown size={18} className="text-emerald-500" /> : <Code2 size={18} className="text-rose-500" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setShowStore(true)} data-testid="header-store-btn"><ShoppingBag size={18}/></Button>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} data-testid="header-settings-btn"><SettingsIcon size={18}/></Button>
          <Button variant="ghost" size="icon" onClick={signOut} title={T('logout')} data-testid="header-logout-btn"><LogOut size={18}/></Button>
          <div className="ms-2 hidden sm:flex items-center gap-2">
            <FramedAvatar profile={user} size={32} />
            <div className="text-xs">
              <UserBadge profile={user} />
              <div className="text-zinc-500">{user.points} {T('points')}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Broadcast banner */}
      {broadcast && (
        <div className="bg-gradient-to-r from-emerald-500/15 to-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center gap-2 text-sm" data-testid="broadcast-banner">
          <Megaphone size={14} className="text-amber-500" />
          <span className="flex-1">{broadcast.content}</span>
          <button onClick={() => { localStorage.setItem('wave_seen_broadcast', broadcast.id); setBroadcast(null); }} className="text-xs">×</button>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex min-h-0" style={bgStyle}>
        <div className={`${selected ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-auto`}>
          <ChatList onSelect={setSelected} selected={selected} />
        </div>
        <div className={`${selected ? 'flex' : 'hidden md:flex'} flex-col flex-1 min-w-0`}>
          <ChatWindow conversation={selected} onBack={() => setSelected(null)} />
        </div>
      </div>

      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          openStore={() => { setShowSettings(false); setShowStore(true); }}
          openAdminDev={() => { setShowSettings(false); navigate('/admin-dev'); }}
        />
      )}
      {showStore && <StorePanel onClose={() => setShowStore(false)} />}
    </div>
  );
}
