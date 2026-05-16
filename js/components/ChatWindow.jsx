import React, { useEffect, useRef, useState } from 'react';
import { supabase, uploadFile } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { sounds } from '../lib/sounds';
import { Send, Image as ImageIcon, Mic, Smile, X } from 'lucide-react';
import MessageBubble from './MessageBubble';
import UserBadge, { FramedAvatar } from './UserBadge';
import GroupSettings from './GroupSettings';

const EMOJIS = ['😀','😁','😂','🤣','😊','😍','🥰','😘','😎','🤩','🤔','🙄','😏','😒','😞','😢','😭','😡','🤬','👍','👎','👏','🙏','💪','🔥','✨','💯','❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','💖','💕','💞','🌹','🌸','🎉','🎂','🎁','⭐','💎','👑'];

export default function ChatWindow({ conversation, onBack }) {
  const { user, T } = useApp();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [members, setMembers] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const scrollRef = useRef();
  const fileRef = useRef();

  // Load messages + members + profiles
  useEffect(() => {
    if (!conversation) return;
    (async () => {
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })
        .limit(200);
      setMessages(msgs || []);

      const { data: mem } = await supabase
        .from('conversation_members')
        .select('*')
        .eq('conversation_id', conversation.id);
      setMembers(mem || []);

      const ids = Array.from(new Set([...(msgs || []).map(m => m.sender_id), ...(mem || []).map(m => m.user_id)].filter(Boolean)));
      if (ids.length) {
        const { data: profs } = await supabase.from('profiles').select('*').in('id', ids);
        const map = {};
        (profs || []).forEach(p => { map[p.id] = p; });
        setProfiles(map);
      }
    })();

    const ch = supabase
      .channel(`messages_${conversation.id}_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          const m = payload.new;
          setMessages(prev => [...prev, m]);
          if (m.sender_id !== user?.id) {
            sounds.receive();
            // Browser notification
            if (Notification && Notification.permission === 'granted') {
              const sender = profiles[m.sender_id];
              new Notification(sender?.display_name || 'New message', { body: m.content || 'Sent a media' });
            }
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [conversation?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400">{T('selectChat')}</div>
    );
  }

  const myMember = members.find(m => m.user_id === user?.id);
  const otherUserId = !conversation.is_group ? members.find(m => m.user_id !== user?.id)?.user_id : null;
  const otherProfile = otherUserId ? profiles[otherUserId] : null;

  const canSend = () => {
    if (!conversation.is_group) return true;
    if (!myMember) return false;
    if (myMember.muted || myMember.banned) return false;
    if (conversation.only_admins_send && myMember.role === 'member') {
      const allowed = conversation.allowed_senders || [];
      return allowed.includes(user.id);
    }
    return true;
  };

  async function sendMessage(opts = {}) {
    const text = opts.content ?? content;
    if (!text && !opts.attachment_url) return;
    if (!canSend()) { toast.error('غير مسموح بالإرسال'); return; }
    const payload = {
      conversation_id: conversation.id,
      sender_id: user.id,
      content: text,
      attachment_url: opts.attachment_url || null,
      attachment_type: opts.attachment_type || null,
    };
    const { error } = await supabase.from('messages').insert(payload);
    if (error) { toast.error(error.message); return; }
    setContent('');
    setShowEmoji(false);
    sounds.send();
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile('chat-media', file, `${user.id}/`);
      const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'audio';
      await sendMessage({ content: '', attachment_url: url, attachment_type: type });
    } catch (err) { toast.error(err.message); }
    e.target.value = '';
  }

  async function toggleRecord() {
    if (recording) {
      mediaRecorder?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        try {
          const url = await uploadFile('chat-media', file, `${user.id}/voice/`);
          await sendMessage({ content: '', attachment_url: url, attachment_type: 'audio' });
        } catch (err) { toast.error(err.message); }
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setMediaRecorder(mr);
      setRecording(true);
    } catch (err) { toast.error('Microphone access denied'); }
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-[#0B0C10] min-w-0">
      <div className="sticky top-0 z-10 backdrop-blur-xl backdrop-saturate-150 bg-white/70 dark:bg-white/[0.04] border-b border-black/5 dark:border-white/10 px-4 py-3 flex items-center gap-3" data-testid="chat-header">
        <button onClick={onBack} className="md:hidden text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
          <X size={18} />
        </button>
        <div className="flex-1 flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => conversation.is_group && setShowGroupSettings(true)}>
          {conversation.is_group ? (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center text-white font-bold">
              {(conversation.name || '?').slice(0,1)}
            </div>
          ) : (
            <FramedAvatar profile={otherProfile} size={40} />
          )}
          <div className="min-w-0">
            <div className="font-semibold truncate">
              {conversation.is_group ? conversation.name : <UserBadge profile={otherProfile} />}
            </div>
            <div className="text-xs text-zinc-500">
              {conversation.is_group ? `${members.length} ${T('members')}` : `@${otherProfile?.username || ''}`}
            </div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-2">
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            isOwn={m.sender_id === user?.id}
            senderProfile={profiles[m.sender_id]}
            showSender={conversation.is_group}
          />
        ))}
      </div>

      {showEmoji && (
        <div className="px-3 pb-2">
          <div className="grid grid-cols-10 gap-1 p-3 rounded-2xl bg-white dark:bg-white/[0.04] border border-black/5 dark:border-white/10 max-h-44 overflow-y-auto" data-testid="emoji-picker">
            {EMOJIS.map(e => (
              <button key={e} className="text-xl hover:scale-125 transition" onClick={() => setContent(c => c + e)}>{e}</button>
            ))}
          </div>
        </div>
      )}

      <div className="sticky bottom-0 backdrop-blur-xl backdrop-saturate-150 bg-white/70 dark:bg-white/[0.04] border-t border-black/5 dark:border-white/10 p-3">
        <div className="flex items-end gap-2">
          <input type="file" ref={fileRef} onChange={handleFile} className="hidden" accept="image/*,video/*,audio/*" />
          <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()} data-testid="attach-btn"><ImageIcon size={18} /></Button>
          <Button variant="ghost" size="icon" onClick={() => setShowEmoji(s => !s)} data-testid="emoji-btn"><Smile size={18} /></Button>
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={T('typeMessage')}
            className="flex-1 rounded-xl"
            data-testid="message-input"
          />
          <Button variant={recording ? 'destructive' : 'ghost'} size="icon" onClick={toggleRecord} data-testid="record-btn"><Mic size={18} /></Button>
          <Button onClick={() => sendMessage()} size="icon" className="rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" data-testid="send-btn">
            <Send size={18} />
          </Button>
        </div>
      </div>

      {showGroupSettings && conversation.is_group && (
        <GroupSettings
          conversation={conversation}
          members={members}
          profiles={profiles}
          onClose={() => setShowGroupSettings(false)}
          onUpdated={async () => {
            const { data: m } = await supabase.from('conversation_members').select('*').eq('conversation_id', conversation.id);
            setMembers(m || []);
          }}
        />
      )}
    </div>
  );
}
