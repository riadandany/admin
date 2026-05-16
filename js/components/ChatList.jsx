import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search, Plus, X } from 'lucide-react';
import UserBadge, { FramedAvatar } from './UserBadge';
import { toast } from 'sonner';

export default function ChatList({ onSelect, selected }) {
  const { user, T } = useApp();
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [groupSearchResults, setGroupSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    if (!user) return;
    loadConversations();
    const ch = supabase
      .channel(`conv_members_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_members' }, () => loadConversations())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => loadConversations())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [user?.id]);

  async function loadConversations() {
    const { data: mems } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', user.id);
    const ids = (mems || []).map(m => m.conversation_id);
    if (!ids.length) { setConversations([]); return; }
    const { data: convs } = await supabase.from('conversations').select('*').in('id', ids).order('created_at', { ascending: false });
    // Get last message + counterpart for direct chats
    const enriched = await Promise.all((convs || []).map(async (c) => {
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
    setConversations(enriched);
  }

  async function searchUsers(q) {
    if (!q || q.length < 1) { setSearchResults([]); return; }
    const { data } = await supabase.from('profiles').select('*').ilike('username', `%${q}%`).limit(10);
    setSearchResults((data || []).filter(u => u.id !== user.id));
  }

  async function startDM(otherUser) {
    // Find existing 1:1 conversation
    const { data: mine } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', user.id);
    const { data: theirs } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', otherUser.id);
    const mineIds = new Set((mine || []).map(x => x.conversation_id));
    const shared = (theirs || []).map(x => x.conversation_id).filter(id => mineIds.has(id));
    if (shared.length) {
      const { data: convs } = await supabase.from('conversations').select('*').in('id', shared).eq('is_group', false);
      if (convs && convs[0]) {
        onSelect(convs[0]);
        setSearch(''); setSearchResults([]);
        return;
      }
    }
    // Create new
    const { data: conv, error } = await supabase.from('conversations').insert({ is_group: false }).select().single();
    if (error) { toast.error(error.message); return; }
    await supabase.from('conversation_members').insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: otherUser.id },
    ]);
    onSelect(conv);
    setSearch(''); setSearchResults([]);
    loadConversations();
  }

  async function searchForGroup(q) {
    if (!q) { setGroupSearchResults([]); return; }
    const { data } = await supabase.from('profiles').select('*').ilike('username', `%${q}%`).limit(10);
    setGroupSearchResults((data || []).filter(u => u.id !== user.id && !selectedMembers.find(s => s.id === u.id)));
  }

  async function createGroup() {
    if (!groupName.trim() || selectedMembers.length === 0) { toast.error('أدخل اسم المجموعة وأضف أعضاء'); return; }
    const { data: conv, error } = await supabase.from('conversations').insert({
      is_group: true, name: groupName, owner_id: user.id, member_limit: 25,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    const rows = [
      { conversation_id: conv.id, user_id: user.id, role: 'owner' },
      ...selectedMembers.map(m => ({ conversation_id: conv.id, user_id: m.id, role: 'member' })),
    ];
    await supabase.from('conversation_members').insert(rows);
    toast.success('تم إنشاء المجموعة');
    setShowNewGroup(false);
    setGroupName(''); setSelectedMembers([]); setGroupSearch(''); setGroupSearchResults([]);
    loadConversations();
    onSelect(conv);
  }

  return (
    <div className="w-full md:w-[360px] border-e border-black/5 dark:border-white/10 flex flex-col bg-white dark:bg-[#0F1014] min-h-0">
      <div className="p-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{T('chats')}</h2>
        <Button variant="ghost" size="icon" onClick={() => setShowNewGroup(true)} data-testid="new-group-btn"><Plus size={18} /></Button>
      </div>

      <div className="p-3">
        <div className="relative">
          <Search size={14} className="absolute top-1/2 -translate-y-1/2 start-3 text-zinc-400" />
          <Input
            placeholder={T('searchUsernames')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); searchUsers(e.target.value); }}
            className="ps-9 rounded-xl"
            data-testid="user-search-input"
          />
        </div>
        {searchResults.length > 0 && (
          <div className="mt-2 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-black/5 dark:border-white/10 overflow-hidden">
            {searchResults.map(u => (
              <button key={u.id} onClick={() => startDM(u)} className="flex items-center gap-2 p-2 w-full hover:bg-zinc-100 dark:hover:bg-white/[0.08]" data-testid={`search-result-${u.username}`}>
                <FramedAvatar profile={u} size={32} />
                <div className="min-w-0 text-start">
                  <UserBadge profile={u} />
                  <div className="text-xs text-zinc-500">@{u.username}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.map(c => (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            className={`w-full text-start flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition ${selected?.id === c.id ? 'bg-zinc-100 dark:bg-white/[0.06]' : ''}`}
            data-testid={`conversation-item-${c.id}`}
          >
            {c.is_group ? (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center text-white font-bold">
                {(c.name || '?').slice(0,1)}
              </div>
            ) : (
              <FramedAvatar profile={c.other} size={44} />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">
                {c.is_group ? c.name : <UserBadge profile={c.other} />}
              </div>
              <div className="text-xs text-zinc-500 truncate">
                {c.lastMessage?.content || (c.lastMessage?.attachment_type ? `📎 ${c.lastMessage.attachment_type}` : '...')}
              </div>
            </div>
          </button>
        ))}
        {conversations.length === 0 && (
          <p className="text-center text-sm text-zinc-400 p-6">ابدأ بالبحث عن اسم مستخدم</p>
        )}
      </div>

      {showNewGroup && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowNewGroup(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#15161A] border border-black/5 dark:border-white/10 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{T('newGroup')}</h3>
              <button onClick={() => setShowNewGroup(false)}><X size={16} /></button>
            </div>
            <Input placeholder={T('groupName')} value={groupName} onChange={(e) => setGroupName(e.target.value)} data-testid="new-group-name" />
            <div className="mt-3">
              <Input placeholder={T('searchUsernames')} value={groupSearch} onChange={(e) => { setGroupSearch(e.target.value); searchForGroup(e.target.value); }} data-testid="new-group-search" />
              {groupSearchResults.length > 0 && (
                <div className="mt-2 rounded-xl border border-black/5 dark:border-white/10 max-h-40 overflow-y-auto">
                  {groupSearchResults.map(u => (
                    <button key={u.id} onClick={() => { setSelectedMembers(s => [...s, u]); setGroupSearch(''); setGroupSearchResults([]); }} className="flex items-center gap-2 p-2 w-full hover:bg-zinc-50 dark:hover:bg-white/[0.04]">
                      <FramedAvatar profile={u} size={28} />
                      <span>@{u.username}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedMembers.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selectedMembers.map(m => (
                  <span key={m.id} className="text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center gap-1">
                    @{m.username}
                    <button onClick={() => setSelectedMembers(s => s.filter(x => x.id !== m.id))}><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowNewGroup(false)}>{T('cancel')}</Button>
              <Button onClick={createGroup} data-testid="create-group-btn">{T('confirm')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
