import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase, uploadFile } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { X, Coins, Gift, ArrowRightLeft, Sparkles } from 'lucide-react';

export default function StorePanel({ onClose }) {
  const { user, refreshProfile, T } = useApp();
  const [items, setItems] = useState([]);
  const [emojiPacks, setEmojiPacks] = useState([]);
  const [code, setCode] = useState('');
  const [transferUser, setTransferUser] = useState('');
  const [transferAmount, setTransferAmount] = useState(0);
  const [customBgFile, setCustomBgFile] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: it } = await supabase.from('store_items').select('*');
      setItems(it || []);
      const { data: ep } = await supabase.from('emoji_packs').select('*');
      setEmojiPacks(ep || []);
    })();
  }, []);

  if (!user) return null;
  const owned = user.owned_items || [];
  const unlockedPacks = user.unlocked_emoji_packs || [];

  async function buy(item) {
    if (user.points < item.price) return toast.error(T('insufficientPoints'));
    let updates = { points: user.points - item.price };
    const itemKey = `${item.type}:${item.value || item.id}`;
    if (item.type === 'premium_week' || item.type === 'premium_month' || item.type === 'premium_year') {
      const days = parseInt(item.value || '7');
      const start = user.premium_until && new Date(user.premium_until) > new Date() ? new Date(user.premium_until) : new Date();
      start.setDate(start.getDate() + days);
      updates.premium_until = start.toISOString();
    } else if (item.type === 'frame') {
      updates.owned_items = [...owned, `frame:${item.value}`];
    } else if (item.type === 'name_color') {
      // grant the right to set a single chosen color: user picks later from a palette
      updates.owned_items = [...owned, itemKey];
    } else if (item.type === 'background_color') {
      updates.owned_items = [...owned, itemKey];
    } else if (item.type === 'background_image') {
      // need to upload an image
      if (!customBgFile) return toast.error('ارفع صورة أولاً');
      try {
        const url = await uploadFile('store-assets', customBgFile, `${user.id}/bg/`);
        updates.owned_items = [...owned, `bg:${url}`];
        updates.background_value = url; updates.background_type = 'image';
      } catch (err) { return toast.error(err.message); }
      setCustomBgFile(null);
    } else if (item.type === 'group_member_slot') {
      // adds 1 to user-extra-slots
      updates.owned_items = [...owned, 'group_slot:1'];
    }
    await supabase.from('profiles').update(updates).eq('id', user.id);
    await refreshProfile();
    toast.success(T('purchased'));
  }

  async function buyEmojiPack(pack) {
    if (unlockedPacks.includes(pack.id)) return;
    if (user.points < pack.price) return toast.error(T('insufficientPoints'));
    await supabase.from('profiles').update({
      points: user.points - pack.price,
      unlocked_emoji_packs: [...unlockedPacks, pack.id],
    }).eq('id', user.id);
    await refreshProfile();
    toast.success(T('purchased'));
  }

  async function redeem() {
    if (!code.trim()) return;
    const { data, error } = await supabase.from('codes').select('*').ilike('code', code.trim()).maybeSingle();
    if (error || !data) return toast.error(T('invalidCode'));
    if (data.expires_at && new Date(data.expires_at) < new Date()) return toast.error(T('codeExpired'));
    if (data.max_uses !== -1 && data.used_count >= data.max_uses) return toast.error(T('codeUsed'));
    const usedBy = data.used_by || [];
    if (usedBy.includes(user.id)) return toast.error(T('codeUsed'));

    const updates = {};
    if (data.points) updates.points = user.points + data.points;
    if (data.premium_duration) {
      const days = data.premium_duration === 'week' ? 7 : data.premium_duration === 'month' ? 30 : 365;
      const start = user.premium_until && new Date(user.premium_until) > new Date() ? new Date(user.premium_until) : new Date();
      start.setDate(start.getDate() + days);
      updates.premium_until = start.toISOString();
    }
    if (data.name_color) updates.name_color = data.name_color;
    if (data.background_value) { updates.background_value = data.background_value; updates.background_type = data.background_type || 'color'; }
    if (data.frame_id) updates.frame_id = data.frame_id;

    await supabase.from('profiles').update(updates).eq('id', user.id);
    await supabase.from('codes').update({ used_count: data.used_count + 1, used_by: [...usedBy, user.id] }).eq('id', data.id);
    await refreshProfile();
    setCode('');
    toast.success(T('redeemSuccess'));
  }

  async function transfer() {
    const amount = parseInt(transferAmount);
    if (!amount || amount <= 0) return;
    if (amount > user.points) return toast.error(T('insufficientPoints'));
    const { data: target } = await supabase.from('profiles').select('*').ilike('username', transferUser).maybeSingle();
    if (!target) return toast.error('User not found');
    await supabase.from('profiles').update({ points: user.points - amount }).eq('id', user.id);
    await supabase.from('profiles').update({ points: (target.points || 0) + amount }).eq('id', target.id);
    await refreshProfile();
    setTransferUser(''); setTransferAmount(0);
    toast.success(T('saved'));
  }

  const ItemCard = ({ item }) => (
    <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4 flex flex-col" data-testid={`store-item-${item.id}`}>
      <div className="flex items-center gap-2 mb-2">
        {item.type === 'frame' && <div style={{ background: item.value }} className="w-8 h-8 rounded-full ring-2 ring-white" />}
        {item.type.includes('premium') && <Sparkles className="text-amber-500" size={18} />}
        <div className="font-medium">{item.name}</div>
      </div>
      <div className="text-xs text-zinc-500 mb-3">{item.price} {T('points')}</div>
      {item.type === 'background_image' && (
        <input type="file" accept="image/*" onChange={(e) => setCustomBgFile(e.target.files?.[0])} className="text-xs mb-2" />
      )}
      <Button size="sm" onClick={() => buy(item)} className="rounded-xl mt-auto" data-testid={`buy-${item.id}`}>{T('buyForPoints', { n: item.price })}</Button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#15161A] border border-black/5 dark:border-white/10 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">{T('storeTitle')}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="px-4 py-2 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center gap-2">
            <Coins size={16}/> <span className="font-semibold">{user.points} {T('points')}</span>
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <Input placeholder={T('enterCode')} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} data-testid="redeem-code-input" />
            <Button onClick={redeem} data-testid="redeem-btn"><Gift size={14} className="me-2"/>{T('redeem')}</Button>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.04]">
          <h3 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-3 flex items-center gap-2"><ArrowRightLeft size={14}/> {T('transferPoints')}</h3>
          <div className="flex flex-wrap gap-2">
            <Input placeholder={T('transferTo')} value={transferUser} onChange={(e) => setTransferUser(e.target.value)} className="max-w-xs" />
            <Input type="number" placeholder={T('amount')} value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="max-w-[140px]" />
            <Button onClick={transfer} data-testid="transfer-btn">{T('transfer')}</Button>
          </div>
        </div>

        <h3 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-3">{T('premiumPlans')}</h3>
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          {items.filter(i => i.type.startsWith('premium_')).map(i => <ItemCard key={i.id} item={i} />)}
        </div>

        <h3 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-3">{T('frames')}</h3>
        <div className="grid sm:grid-cols-4 gap-3 mb-6">
          {items.filter(i => i.type === 'frame').map(i => <ItemCard key={i.id} item={i} />)}
        </div>

        <h3 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-3">{T('backgrounds')} & {T('nameColors')}</h3>
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          {items.filter(i => ['name_color','background_color','background_image','group_member_slot'].includes(i.type)).map(i => <ItemCard key={i.id} item={i} />)}
        </div>

        <h3 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-3">{T('emojiPacks')}</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {emojiPacks.filter(p => p.locked).map(p => {
            const owned = unlockedPacks.includes(p.id);
            return (
              <div key={p.id} className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4">
                <div className="font-medium mb-2">{p.name}</div>
                <div className="text-xs text-zinc-500 mb-3">{p.price} {T('points')}</div>
                <Button size="sm" disabled={owned} onClick={() => buyEmojiPack(p)} className="w-full">{owned ? T('purchased') : T('buyForPoints', { n: p.price })}</Button>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
