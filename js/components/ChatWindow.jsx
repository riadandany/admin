import React, { useEffect, useRef, useState } from 'react';
import { supabase, uploadFile } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { sounds } from '../lib/sounds';
import { Send, Image as ImageIcon, Mic, Smile, X, Trash2, MoreVertical, Flag, Star, UserX, Copy, Pause, Play, Video as VideoIcon } from 'lucide-react';
import MessageBubble from './MessageBubble';
import UserBadge, { FramedAvatar } from './UserBadge';
import GroupSettings from './GroupSettings';

const EMOJIS = ['😀','😁','😂','🤣','😊','😍','🥰','😘','😎','🤩','🤔','🙄','😏','😒','😞','😢','😭','😡','🤬','👍','👎','👏','🙏','💪','🔥','✨','💯','❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','💖','💕','💞','🌹','🌸','🎉','🎂','🎁','⭐','💎','👑'];

export default function ChatWindow({ conversation, onBack }) {
  const { user, T, refreshProfile } = useApp();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [members, setMembers] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [recState, setRecState] = useState('idle'); // idle, recording, paused
  const [recTime, setRecTime] = useState(0);
  const [openMenu, setOpenMenu] = useState(null);
  const [showOtherMenu, setShowOtherMenu] = useState(false);
  const [showNickname, setShowNickname] = useState(false);
  const [nickValue, setNickValue] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const scrollRef = useRef();
  const fileRef = useRef();
  const videoRef = useRef();
  const mrRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!conversation) return;
    let isMounted = true;
    (async () => {
      const { data: msgs } = await supabase.from('messages').select('*').eq('conversation_id', conversation.id).is('deleted_at', null).order('created_at', { ascending: true }).limit(200);
      if (!isMounted) return;
      setMessages(msgs || []);
      const { data: mem } = await supabase.from('conversation_members').select('*').eq('conversation_id', conversation.id);
      setMembers(mem || []);
      const ids = Array.from(new Set([...(msgs || []).map(m => m.sender_id), ...(mem || []).map(m => m.user_id)].filter(Boolean)));
      if (ids.length) {
        const { data: ps } = await supabase.from('profiles').select('*').in('id', ids);
        const map = {}; (ps || []).forEach(p => { map[p.id] = p; });
        setProfiles(map);
      }
    })();
    const ch = supabase.channel(`messages_${conversation.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` }, (p) => {
        const m = p.new;
        setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
        if (m.sender_id !== user?.id) sounds.receive();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` }, (p) => {
        setMessages(prev => prev.map(x => x.id === p.new.id ? p.new : x).filter(x => !x.deleted_at));
      })
      .subscribe();
    return () => { isMounted = false; supabase.removeChannel(ch); };
  }, [conversation?.id, user?.id]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  if (!conversation) return <div className="flex-1 flex items-center justify-center text-zinc-400">{T('selectChat')}</div>;

  const myMember = members.find(m => m.user_id === user?.id);
  const otherUserId = !conversation.is_group ? members.find(m => m.user_id !== user?.id)?.user_id : null;
  const otherProfile = otherUserId ? profiles[otherUserId] : null;
  const nicknames = user?.nicknames || {};
  const displayOther = otherProfile ? { ...otherProfile, display_name: nicknames[otherProfile.id] || otherProfile.display_name } : null;

  const canSend = () => {
    if (!conversation.is_group) return true;
    if (!myMember) return false;
    if (myMember.muted || myMember.banned) return false;
    if (conversation.only_admins_send && myMember.role === 'member') return false;
    return true;
  };

  async function sendMessage(opts = {}) {
    const text = (opts.content ?? content).trim();
    if (!text && !opts.attachment_url) return;
    if (!canSend()) { toast.error('غير مسموح بالإرسال'); return; }
    const payload = { conversation_id: conversation.id, sender_id: user.id, content: text, attachment_url: opts.attachment_url || null, attachment_type: opts.attachment_type || null };
    const { error } = await supabase.from('messages').insert(payload);
    if (error) return toast.error(error.message);
    setContent(''); setShowEmoji(false); sounds.send();
  }

  async function handleFile(e, kind) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const url = await uploadFile('chat-media', file, `${user.id}/`);
      let type = kind;
      if (!type) type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'audio';
      await sendMessage({ content: '', attachment_url: url, attachment_type: type });
    } catch (err) { toast.error(err.message || 'فشل الرفع'); }
    e.target.value = '';
  }

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mrRef.current = mr;
      mr.start();
      setRecState('recording'); setRecTime(0);
      timerRef.current = setInterval(() => setRecTime(t => t + 1), 1000);
    } catch { toast.error('Microphone access denied'); }
  }
  function pauseRec() {
    if (mrRef.current?.state === 'recording') { mrRef.current.pause(); setRecState('paused'); clearInterval(timerRef.current); }
    else if (mrRef.current?.state === 'paused') { mrRef.current.resume(); setRecState('recording'); timerRef.current = setInterval(() => setRecTime(t => t + 1), 1000); }
  }
  function cancelRec() {
    try { mrRef.current?.stop(); } catch (e) { /* noop */ }
    streamRef.current?.getTracks().forEach(t => t.stop());
    clearInterval(timerRef.current);
    chunksRef.current = []; setRecState('idle'); setRecTime(0);
  }
  async function sendRec() {
    if (!mrRef.current) return;
    mrRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      try {
        const url = await uploadFile('chat-media', file, `${user.id}/voice/`);
        await sendMessage({ content: '', attachment_url: url, attachment_type: 'audio' });
      } catch (err) { toast.error(err.message || 'فشل الرفع'); }
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
    try { mrRef.current.stop(); } catch (e) { /* noop */ }
    clearInterval(timerRef.current); setRecState('idle'); setRecTime(0);
  }

  async function deleteMessage(m) {
    if (m.sender_id !== user.id && user.role !== 'owner') return;
    await supabase.from('messages').update({ deleted_at: new Date().toISOString(), content: '', attachment_url: null }).eq('id', m.id);
    setMessages(prev => prev.filter(x => x.id !== m.id));
  }
  async function deleteConversation() {
    if (!window.confirm('حذف المحادثة كاملة؟')) return;
    if (conversation.is_group) {
      await supabase.from('conversation_members').delete().match({ conversation_id: conversation.id, user_id: user.id });
    } else {
      await supabase.from('conversations').delete().eq('id', conversation.id);
    }
    toast.success('تم الحذف'); onBack?.();
  }
  async function blockUser() {
    if (!otherProfile) return;
    const blocked = [...new Set([...(user.blocked_users || []), otherProfile.id])];
    await supabase.from('profiles').update({ blocked_users: blocked }).eq('id', user.id);
    await refreshProfile();
    toast.success('تم الحظر');
  }
  async function toggleFavorite() {
    if (!otherProfile) return;
    const fav = user.favorite_friends || [];
    const next = fav.includes(otherProfile.id) ? fav.filter(x => x !== otherProfile.id) : [...fav, otherProfile.id];
    await supabase.from('profiles').update({ favorite_friends: next }).eq('id', user.id);
    await refreshProfile();
    toast.success(fav.includes(otherProfile.id) ? 'أزيل من المفضلة' : 'أضيف للمفضلة');
  }
  async function saveNickname() {
    if (!otherProfile) return;
    const next = { ...(user.nicknames || {}), [otherProfile.id]: nickValue };
    if (!nickValue) delete next[otherProfile.id];
    await supabase.from('profiles').update({ nicknames: next }).eq('id', user.id);
    await refreshProfile();
    setShowNickname(false); setNickValue('');
    toast.success('تم الحفظ');
  }
  async function reportUser() {
    if (!otherProfile || !reportReason.trim()) return toast.error('أدخل سبب البلاغ');
    await supabase.from('reports').insert({ reporter_id: user.id, target_id: otherProfile.id, reason: reportReason, status: 'open' });
    setShowReport(false); setReportReason('');
    toast.success('تم إرسال البلاغ');
  }
  async function copyMessage(m) {
    if (m.content) { await navigator.clipboard.writeText(m.content); toast.success('Copied'); }
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-[#0B0C10] min-w-0">
      <div className="sticky top-0 z-10 backdrop-blur-xl backdrop-saturate-150 bg-white/70 dark:bg-white/[0.04] border-b border-black/5 dark:border-white/10 px-4 py-3 flex items-center gap-3" data-testid="chat-header">
        <button onClick={onBack} className="md:hidden text-zinc-500 hover:text-zinc-900 dark:hover:text-white"><X size={18} /></button>
        <div className="flex-1 flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => conversation.is_group && setShowGroupSettings(true)}>
          {conversation.is_group ? (
            conversation.avatar_url ? <img src={conversation.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" /> :
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center text-white font-bold">{(conversation.name || '?').slice(0,1)}</div>
          ) : <FramedAvatar profile={displayOther} size={40} />}
          <div className="min-w-0">
            <div className="font-semibold truncate">{conversation.is_group ? conversation.name : <UserBadge profile={displayOther} />}</div>
            <div className="text-xs text-zinc-500">{conversation.is_group ? `${members.length} ${T('members')}` : `@${otherProfile?.username || ''}`}</div>
          </div>
        </div>
        <div className="relative">
          <Button variant="ghost" size="icon" onClick={() => setShowOtherMenu(s => !s)} data-testid="chat-options-btn"><MoreVertical size={18} /></Button>
          {showOtherMenu && (
            <div className="absolute end-0 top-full mt-1 z-30 w-52 rounded-xl bg-white dark:bg-[#15161A] border border-black/5 dark:border-white/10 shadow-xl py-1" onMouseLeave={() => setShowOtherMenu(false)}>
              {!conversation.is_group && otherProfile && (
                <>
                  <button onClick={() => { setShowOtherMenu(false); toggleFavorite(); }} className="w-full text-start px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center gap-2" data-testid="favorite-friend-btn"><Star size={14} className={(user.favorite_friends || []).includes(otherProfile.id) ? 'text-amber-400 fill-amber-400' : ''} /> صديق مفضل</button>
                  <button onClick={() => { setShowOtherMenu(false); setNickValue(nicknames[otherProfile.id] || ''); setShowNickname(true); }} className="w-full text-start px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-white/10">تعديل اسم مستعار</button>
                  <button onClick={() => { setShowOtherMenu(false); setShowReport(true); }} className="w-full text-start px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center gap-2" data-testid="report-user-btn"><Flag size={14} /> إبلاغ</button>
                  <button onClick={() => { setShowOtherMenu(false); blockUser(); }} className="w-full text-start px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-white/10 text-rose-500 flex items-center gap-2" data-testid="block-user-btn"><UserX size={14} /> حظر</button>
                </>
              )}
              <button onClick={() => { setShowOtherMenu(false); deleteConversation(); }} className="w-full text-start px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-white/10 text-rose-500 flex items-center gap-2" data-testid="delete-conv-btn"><Trash2 size={14} /> حذف المحادثة</button>
            </div>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="group relative">
            <MessageBubble message={m} isOwn={m.sender_id === user?.id} senderProfile={profiles[m.sender_id]} showSender={conversation.is_group} />
            <div className={`absolute top-0 ${m.sender_id === user?.id ? 'start-3' : 'end-3'} hidden group-hover:flex gap-1`}>
              <button onClick={() => copyMessage(m)} className="p-1 rounded bg-white/80 dark:bg-zinc-800/80 backdrop-blur"><Copy size={12} /></button>
              {(m.sender_id === user?.id || user.role === 'owner') && (
                <button onClick={() => deleteMessage(m)} className="p-1 rounded bg-white/80 dark:bg-zinc-800/80 backdrop-blur text-rose-500" data-testid={`del-msg-${m.id}`}><Trash2 size={12} /></button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showEmoji && (
        <div className="px-3 pb-2">
          <div className="grid grid-cols-10 gap-1 p-3 rounded-2xl bg-white dark:bg-white/[0.04] border border-black/5 dark:border-white/10 max-h-44 overflow-y-auto" data-testid="emoji-picker">
            {EMOJIS.map(e => <button key={e} className="text-xl hover:scale-125 transition" onClick={() => setContent(c => c + e)}>{e}</button>)}
          </div>
        </div>
      )}

      {recState !== 'idle' && (
        <div className="mx-3 mb-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3" data-testid="recorder-bar">
          <span className={`w-2.5 h-2.5 rounded-full bg-rose-500 ${recState === 'recording' ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-mono">{Math.floor(recTime / 60)}:{String(recTime % 60).padStart(2, '0')}</span>
          <div className="flex-1 text-xs text-zinc-500">{recState === 'recording' ? 'جارٍ التسجيل...' : 'متوقف مؤقتاً'}</div>
          <Button size="sm" variant="ghost" onClick={pauseRec} data-testid="rec-pause-btn">{recState === 'recording' ? <Pause size={14} /> : <Play size={14} />}</Button>
          <Button size="sm" variant="ghost" onClick={cancelRec} className="text-rose-500" data-testid="rec-cancel-btn"><X size={14} /></Button>
          <Button size="sm" onClick={sendRec} data-testid="rec-send-btn"><Send size={14} /></Button>
        </div>
      )}

      <div className="sticky bottom-0 backdrop-blur-xl backdrop-saturate-150 bg-white/70 dark:bg-white/[0.04] border-t border-black/5 dark:border-white/10 p-3">
        <div className="flex items-end gap-2">
          <input type="file" ref={fileRef} onChange={(e) => handleFile(e)} className="hidden" accept="image/*" />
          <input type="file" ref={videoRef} onChange={(e) => handleFile(e, 'video')} className="hidden" accept="video/*" />
          <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()} data-testid="attach-img-btn"><ImageIcon size={18} /></Button>
          <Button variant="ghost" size="icon" onClick={() => videoRef.current?.click()} data-testid="attach-video-btn"><VideoIcon size={18} /></Button>
          <Button variant="ghost" size="icon" onClick={() => setShowEmoji(s => !s)} data-testid="emoji-btn"><Smile size={18} /></Button>
          <Input value={content} onChange={(e) => setContent(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={T('typeMessage')} className="flex-1 rounded-xl" data-testid="message-input" />
          <Button variant={recState !== 'idle' ? 'destructive' : 'ghost'} size="icon" onClick={() => recState === 'idle' ? startRec() : null} data-testid="record-btn"><Mic size={18} /></Button>
          <Button onClick={() => sendMessage()} size="icon" className="rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" data-testid="send-btn"><Send size={18} /></Button>
        </div>
      </div>

      {showGroupSettings && conversation.is_group && (
        <GroupSettings conversation={conversation} members={members} profiles={profiles} onClose={() => setShowGroupSettings(false)}
          onUpdated={async () => { const { data: m } = await supabase.from('conversation_members').select('*').eq('conversation_id', conversation.id); setMembers(m || []); }} />
      )}

      {showNickname && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowNickname(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#15161A] border border-black/5 dark:border-white/10 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">اسم مستعار</h3>
            <Input value={nickValue} onChange={(e) => setNickValue(e.target.value)} placeholder="اتركه فارغاً للإزالة" data-testid="nickname-input" />
            <div className="mt-3 flex justify-end gap-2"><Button variant="ghost" onClick={() => setShowNickname(false)}>إلغاء</Button><Button onClick={saveNickname} data-testid="nickname-save-btn">حفظ</Button></div>
          </div>
        </div>
      )}

      {showReport && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowReport(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#15161A] border border-black/5 dark:border-white/10 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Flag size={16} className="text-rose-500" />الإبلاغ عن المستخدم</h3>
            <Input value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="السبب" data-testid="report-reason-input" />
            <div className="mt-3 flex justify-end gap-2"><Button variant="ghost" onClick={() => setShowReport(false)}>إلغاء</Button><Button onClick={reportUser} data-testid="report-submit-btn">إرسال</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
