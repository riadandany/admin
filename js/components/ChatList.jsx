import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, Plus, X, Users, Inbox, UserPlus, Star } from 'lucide-react';
import UserBadge, { FramedAvatar } from './UserBadge';
import { toast } from 'sonner';

export default function ChatList({ onSelect, selected }) {
  const { user, T } = useApp();
  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [groupRequests, setGroupRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [blocks, setBlocks] = useState([]);

  const loadAll = useCallback(async () => {
    if (!user) return;
    // Conversations
    const { data: mems } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', user.id);
    const ids = (mems || []).map(m => m.conversation_id);
    let enriched = [];
    if (ids.length) {
      const { data: convs } = await supabase.from('conversations').select('*').in('id', ids);
      enriched = await Promise.all((convs || []).map(async (c) => {
        const { data: last } = await supabase.from('messages').select('*').eq('conversation_id', c.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
        let other = null;
        if (!c.is_group) {
          const { data: m } = await supabase.from('conversation_members').select('user_id').eq('conversation_id', c.id);
          const otherId = (m || []).map(x => x.user_id).find(x => x !== user.id);
          if (otherId) {
            const { data: p } = await supabase.from('profiles').select('*').eq('id', otherId).maybeSingle();
            other = p;
          }
        }
        return { ...c, lastMessage: last, other };
      }));
      enriched.sort((a, b) => new Date(b.lastMessage?.created_at || b.created_at) - new Date(a.lastMessage?.created_at || a.created_at));
    }
    setConversations(enriched);
    // Friends
    const { data: fr } = await supabase.from('friendships').select('*').or(`user_a.eq.${user.id},user_b.eq.${user.id}`).eq('status', 'accepted');
    const fids = (fr || []).map(x => x.user_a === user.id ? x.user_b : x.user_a);
    if (fids.length) {
      const { data: fps } = await supabase.from('profiles').select('*').in('id', fids);
      const favSet = new Set(user.favorite_friends || []);
      setFriends((fps || []).map(p => ({ ...p, favorite: favSet.has(p.id) })));
    } else setFriends([]);
    // Pending requests
    const { data: rq } = await supabase.from('friendships').select('*').eq('user_b', user.id).eq('status', 'pending');
    if (rq?.length) {
      const senderIds = rq.map(x => x.user_a);
      const { data: sp } = await supabase.from('profiles').select('*').in('id', senderIds);
      setRequests((rq || []).map(r => ({ ...r, sender: (sp || []).find(p => p.id === r.user_a) })));
    } else setRequests([]);
    // Group join requests
    const { data: gjr } = await supabase.from('group_join_requests').select('*').eq('target_user', user.id).eq('status', 'pending');
    if (gjr?.length) {
      const sids = gjr.map(x => x.requester_id);
      const cids = gjr.map(x => x.conversation_id);
      const { data: ps } = await supabase.from('profiles').select('*').in('id', sids);
      const { data: cs } = await supabase.from('conversations').select('*').in('id', cids);
      setGroupRequests((gjr || []).map(r => ({ ...r, requester: (ps || []).find(p => p.id === r.requester_id), conv: (cs || []).find(c => c.id === r.conversation_id) })));
    } else setGroupRequests([]);
    setBlocks(user.blocked_users || []);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadAll();
    const ch = supabase.channel(`chatlist_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_members' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_join_requests' }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, loadAll]);

  async function searchUsers(q) {
    if (!q) { setSearchResults([]); return; }
    const { data } = await supabase.from('profiles').select('*').ilike('username', `%${q}%`).limit(10);
    setSearchResults((data || []).filter(u => u.id !== user.id && !blocks.includes(u.id)));
  }

  async function sendFriendRequest(other) {
    // Check if already exists
    const { data: ex } = await supabase.from('friendships').select('*').or(`and(user_a.eq.${user.id},user_b.eq.${other.id}),and(user_a.eq.${other.id},user_b.eq.${user.id})`).maybeSingle();
    if (ex) { toast.message('الطلب موجود مسبقاً'); return; }
    const { error } = await supabase.from('friendships').insert({ user_a: user.id, user_b: other.id, status: 'pending' });
    if (error) return toast.error(error.message);
    toast.success('تم إرسال طلب الصداقة');
  }

  async function acceptRequest(req) {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', req.id);
    toast.success('تم القبول');
    loadAll();
  }
  async function rejectRequest(req) {
    await supabase.from('friendships').delete().eq('id', req.id);
    loadAll();
  }
  async function acceptGroupJoin(r) {
    await supabase.from('conversation_members').insert({ conversation_id: r.conversation_id, user_id: r.requester_id, role: 'member' });
    await supabase.from('group_join_requests').update({ status: 'accepted' }).eq('id', r.id);
    toast.success('تمت إضافة العضو');
    loadAll();
  }
  async function rejectGroupJoin(r) {
    await supabase.from('group_join_requests').delete().eq('id', r.id);
    loadAll();
  }

  async function startDM(otherUser) {
    const { data: mine } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', user.id);
    const { data: theirs } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', otherUser.id);
    const set = new Set((mine || []).map(x => x.conversation_id));
    const shared = (theirs || []).map(x => x.conversation_id).filter(id => set.has(id));
    if (shared.length) {
      const { data: convs } = await supabase.from('conversations').select('*').in('id', shared).eq('is_group', false);
      if (convs?.[0]) { onSelect(convs[0]); setSearch(''); setSearchResults([]); return; }
    }
    const { data: conv, error } = await supabase.from('conversations').insert({ is_group: false }).select().single();
    if (error) return toast.error(error.message);
    await supabase.from('conversation_members').insert([
      { conversation_id: conv.id, user_id: user.id }, { conversation_id: conv.id, user_id: otherUser.id },
    ]);
    onSelect(conv);
    setSearch(''); setSearchResults([]); loadAll();
  }

  async function createGroup() {
    if (!groupName.trim() || selectedMembers.length === 0) return toast.error('أدخل اسم المجموعة وأضف أعضاء');
    const { data: conv, error } = await supabase.from('conversations').insert({
      is_group: true, name: groupName, owner_id: user.id, member_limit: 25,
    }).select().single();
    if (error) return toast.error(error.message);
    await supabase.from('conversation_members').insert([
      { conversation_id: conv.id, user_id: user.id, role: 'owner' },
      ...selectedMembers.map(m => ({ conversation_id: conv.id, user_id: m.id, role: 'member' })),
    ]);
    toast.success('تم إنشاء المجموعة');
    setShowNewGroup(false); setGroupName(''); setSelectedMembers([]);
    loadAll(); onSelect(conv);
  }

  const totalPending = requests.length + groupRequests.length;

  return (
    <div className="w-full md:w-[360px] border-e border-black/5 dark:border-white/10 flex flex-col bg-white dark:bg-[#0F1014] min-h-0">
      <div className="p-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{T('chats')}</h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setShowRequests(true)} title="الطلبات" data-testid="requests-btn" className="relative">
            <Inbox size={18} />
            {totalPending > 0 && <span className="absolute -top-1 -end-1 text-[10px] bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center">{totalPending}</span>}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowNewGroup(true)} data-testid="new-group-btn"><Plus size={18} /></Button>
        </div>
      </div>

      <div className="p-3">
        <div className="relative">
          <Search size={14} className="absolute top-1/2 -translate-y-1/2 start-3 text-zinc-400" />
          <Input placeholder={T('searchUsernames')} value={search} onChange={(e) => { setSearch(e.target.value); searchUsers(e.target.value); }} className="ps-9 rounded-xl" data-testid="user-search-input" />
        </div>
        {searchResults.length > 0 && (
          <div className="mt-2 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-black/5 dark:border-white/10 overflow-hidden">
            {searchResults.map(u => {
              const isFriend = friends.some(f => f.id === u.id);
              return (
                <div key={u.id} className="flex items-center gap-2 p-2 hover:bg-zinc-100 dark:hover:bg-white/[0.08]">
                  <FramedAvatar profile={u} size={32} />
                  <button onClick={() => isFriend ? startDM(u) : null} className="flex-1 min-w-0 text-start">
                    <UserBadge profile={u} />
                    <div className="text-xs text-zinc-500">@{u.username}</div>
                  </button>
                  {isFriend ? (
                    <Button size="sm" onClick={() => startDM(u)} data-testid={`dm-${u.username}`}>محادثة</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => sendFriendRequest(u)} data-testid={`addfriend-${u.username}`}><UserPlus size={12} className="me-1" />إضافة</Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {friends.length > 0 && (
        <div className="px-3 pb-2">
          <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 mb-2 px-1">الأصدقاء</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {friends.sort((a,b) => (b.favorite?1:0)-(a.favorite?1:0)).map(f => (
              <button key={f.id} onClick={() => startDM(f)} className="shrink-0 flex flex-col items-center gap-1 w-16" data-testid={`friend-${f.username}`}>
                <div className="relative"><FramedAvatar profile={f} size={44} />{f.favorite && <Star size={12} className="absolute -top-1 -end-1 text-amber-400 fill-amber-400" />}</div>
                <span className="text-[10px] truncate w-full text-center">{f.display_name || f.username}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {conversations.map(c => (
          <button key={c.id} onClick={() => onSelect(c)} className={`w-full text-start flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition ${selected?.id === c.id ? 'bg-zinc-100 dark:bg-white/[0.06]' : ''}`} data-testid={`conversation-item-${c.id}`}>
            {c.is_group ? (
              c.avatar_url ? <img src={c.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover" /> :
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center text-white font-bold">{(c.name || '?').slice(0,1)}</div>
            ) : <FramedAvatar profile={c.other} size={44} />}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{c.is_group ? c.name : <UserBadge profile={c.other} />}</div>
              <div className="text-xs text-zinc-500 truncate">{c.lastMessage?.content || (c.lastMessage?.attachment_type ? `📎 ${c.lastMessage.attachment_type}` : '...')}</div>
            </div>
          </button>
        ))}
        {conversations.length === 0 && <p className="text-center text-sm text-zinc-400 p-6">ابدأ بالبحث عن اسم مستخدم</p>}
      </div>

      {showNewGroup && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowNewGroup(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#15161A] border border-black/5 dark:border-white/10 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Users size={16} />{T('newGroup')}</h3>
              <button onClick={() => setShowNewGroup(false)}><X size={16} /></button>
            </div>
            <Input placeholder={T('groupName')} value={groupName} onChange={(e) => setGroupName(e.target.value)} data-testid="new-group-name" />
            <div className="mt-3 text-xs text-zinc-500">اختر أعضاء من قائمة أصدقائك</div>
            <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-black/5 dark:border-white/10">
              {friends.length === 0 && <div className="p-3 text-sm text-zinc-400 text-center">ليس لديك أصدقاء بعد. أضف أصدقاء أولاً.</div>}
              {friends.map(f => {
                const sel = selectedMembers.some(s => s.id === f.id);
                return (
                  <label key={f.id} className="flex items-center gap-2 p-2 hover:bg-zinc-50 dark:hover:bg-white/[0.04] cursor-pointer">
                    <input type="checkbox" checked={sel} onChange={() => setSelectedMembers(s => sel ? s.filter(x => x.id !== f.id) : [...s, f])} data-testid={`group-member-${f.username}`} />
                    <FramedAvatar profile={f} size={28} />
                    <span className="text-sm">@{f.username}</span>
                  </label>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowNewGroup(false)}>{T('cancel')}</Button>
              <Button onClick={createGroup} data-testid="create-group-btn">{T('confirm')}</Button>
            </div>
          </div>
        </div>
      )}

      {showRequests && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowRequests(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#15161A] border border-black/5 dark:border-white/10 p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid="requests-modal">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">الطلبات الواردة</h3>
              <button onClick={() => setShowRequests(false)}><X size={16} /></button>
            </div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 mb-2">طلبات الصداقة</div>
            <div className="space-y-2 mb-4">
              {requests.length === 0 && <div className="text-xs text-zinc-400">لا توجد طلبات.</div>}
              {requests.map(r => (
                <div key={r.id} className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-white/[0.04]">
                  <FramedAvatar profile={r.sender} size={36} />
                  <div className="flex-1"><UserBadge profile={r.sender} /><div className="text-xs text-zinc-500">@{r.sender?.username}</div></div>
                  <Button size="sm" onClick={() => acceptRequest(r)} data-testid={`accept-friend-${r.sender?.username}`}>قبول</Button>
                  <Button size="sm" variant="ghost" onClick={() => rejectRequest(r)}>رفض</Button>
                </div>
              ))}
            </div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 mb-2">طلبات الانضمام للمجموعات</div>
            <div className="space-y-2">
              {groupRequests.length === 0 && <div className="text-xs text-zinc-400">لا توجد طلبات.</div>}
              {groupRequests.map(r => (
                <div key={r.id} className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-white/[0.04]">
                  <FramedAvatar profile={r.requester} size={36} />
                  <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{r.requester?.username} → {r.conv?.name}</div></div>
                  <Button size="sm" onClick={() => acceptGroupJoin(r)}>قبول</Button>
                  <Button size="sm" variant="ghost" onClick={() => rejectGroupJoin(r)}>رفض</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
