import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { useSite } from "../lib/site";
import { useT } from "../i18n";
import { Avatar, UserName } from "../components/UserBits";
import ProfilePopup from "../components/ProfilePopup";
import { Send, Image as ImageIcon, Mic, Paperclip, Hash, Users, ShieldCheck } from "lucide-react";

export default function Chat() {
  const { user } = useAuth();
  const { lang } = useSite();
  const t = useT(lang);
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(params.get("dm") ? "dm" : (params.get("staff") ? "staff" : "public"));
  const [dmUser, setDmUser] = useState(params.get("dm") || null);
  const [friends, setFriends] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showProfile, setShowProfile] = useState(null);
  const [recording, setRecording] = useState(false);
  const recRef = useRef(null);
  const fileRef = useRef(null);
  const scrollRef = useRef(null);
  const isStaff = ["owner", "developer", "moderator"].includes(user?.role);

  useEffect(() => { api.get("/friends").then((r) => setFriends(r.data)).catch(() => {}); }, []);

  const load = async () => {
    try {
      let url = `/chat/${tab}`;
      if (tab === "dm" && dmUser) url += `?to=${dmUser}`;
      if (tab === "dm" && !dmUser) { setMessages([]); return; }
      const r = await api.get(url);
      setMessages(r.data);
      setTimeout(() => scrollRef.current?.scrollTo({ top: 9e9 }), 50);
    } catch {}
  };
  useEffect(() => { load(); const i = setInterval(load, 4000); return () => clearInterval(i); }, [tab, dmUser]); // eslint-disable-line

  const send = async (extra = {}) => {
    if (!input.trim() && !extra.media_url) return;
    if (tab === "dm" && !dmUser) return;
    try {
      const body = { content: input, message_type: "text", to_user: tab === "dm" ? dmUser : undefined, ...extra };
      await api.post(`/chat/${tab}`, body);
      setInput("");
      load();
    } catch (e) { alert(e?.response?.data?.detail || "خطأ"); }
  };

  const uploadFile = async (file, type) => {
    const fd = new FormData(); fd.append("file", file);
    const r = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    await send({ media_url: r.data.url, message_type: type, content: "" });
  };

  const onFilePick = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const type = f.type.startsWith("image/") ? "image" : "link";
    uploadFile(f, type);
    e.target.value = "";
  };

  const toggleRec = async () => {
    if (recording) {
      recRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const file = new File([blob], "voice.webm", { type: "audio/webm" });
        await uploadFile(file, "voice");
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      recRef.current = mr;
      setRecording(true);
    } catch (e) { alert("Microphone access denied"); }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 relative z-10">
      <div className="grid grid-cols-12 gap-3 h-[78vh]">
        <aside className="col-span-3 glass p-3 overflow-y-auto">
          <div className="text-mono text-xs text-[var(--text-muted)] mb-2">// CHANNELS</div>
          <button onClick={() => { setTab("public"); setDmUser(null); setParams({}); }} className={`w-full text-start px-3 py-2 rounded-lg flex items-center gap-2 ${tab==="public"?"bg-[var(--accent)]/15 text-[var(--accent)]":"hover:bg-white/5"}`} data-testid="tab-public"><Hash size={14}/> {t("public_chat")}</button>
          {isStaff && (
            <button onClick={() => { setTab("staff"); setDmUser(null); setParams({ staff: "1" }); }} className={`mt-1 w-full text-start px-3 py-2 rounded-lg flex items-center gap-2 ${tab==="staff"?"bg-[var(--negative)]/15 text-[var(--negative)]":"hover:bg-white/5"}`} data-testid="tab-staff"><ShieldCheck size={14}/> {t("staff_chat")}</button>
          )}
          <div className="text-mono text-xs text-[var(--text-muted)] mt-4 mb-2">// {t("dms")}</div>
          {friends.length === 0 && <div className="text-xs text-[var(--text-muted)]">لا يوجد أصدقاء بعد</div>}
          {friends.map((f) => (
            <button key={f.id} onClick={() => { setTab("dm"); setDmUser(f.id); setParams({ dm: f.id }); }} className={`w-full mt-1 text-start px-2 py-1.5 rounded-lg flex items-center gap-2 ${dmUser===f.id?"bg-[var(--accent)]/15":"hover:bg-white/5"}`} data-testid={`dm-${f.username}`}>
              <Avatar user={f} size={26} />
              <UserName user={f} className="text-sm" />
            </button>
          ))}
        </aside>

        <main className="col-span-9 glass flex flex-col">
          <div className="p-3 border-b border-white/5 flex items-center gap-2">
            <div className="text-display font-bold">{tab === "public" ? `# ${t("public_chat")}` : tab === "staff" ? `🛡 ${t("staff_chat")}` : `@ DM`}</div>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className="flex items-start gap-2" data-testid="chat-message">
                <button onClick={() => setShowProfile(m.user?.username)}><Avatar user={m.user} size={36} /></button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><button onClick={() => setShowProfile(m.user?.username)}><UserName user={m.user} className="text-sm" /></button> <span className="text-mono text-[10px] text-[var(--text-muted)]">{new Date(m.created_at).toLocaleString()}</span></div>
                  {m.message_type === "text" && <div className="text-sm text-[var(--text-secondary)] break-words">{m.content}</div>}
                  {m.message_type === "image" && <img src={m.media_url} alt="" className="max-w-xs rounded-lg mt-1 border border-white/10" />}
                  {m.message_type === "voice" && <audio src={m.media_url} controls className="mt-1" />}
                  {m.message_type === "link" && <a href={m.media_url} target="_blank" rel="noreferrer" className="text-[var(--accent)] underline text-sm">{m.media_url}</a>}
                  {m.message_type === "game" && <div className="glass p-2 mt-1 rounded-md inline-block"><div className="text-mono text-xs mb-1">🎮 Game Invite</div><a href={`/games/${m.game_slug}`} className="btn-accent inline-block text-xs">ابدأ اللعبة</a></div>}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-white/5 flex items-center gap-2" data-testid="chat-composer">
            <button onClick={() => fileRef.current?.click()} className="btn-ghost p-2" data-testid="chat-file"><Paperclip size={16}/></button>
            <input ref={fileRef} type="file" hidden onChange={onFilePick} />
            <button onClick={toggleRec} className={`btn-ghost p-2 ${recording ? "text-[var(--negative)] border-[var(--negative)]" : ""}`} data-testid="chat-mic"><Mic size={16}/></button>
            <input className="input-cyber" placeholder={t("type_message")} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} data-testid="chat-input" />
            <button className="btn-accent" onClick={() => send()} data-testid="chat-send"><Send size={16} /></button>
          </div>
        </main>
      </div>
      {showProfile && <ProfilePopup username={showProfile} onClose={() => setShowProfile(null)} />}
    </div>
  );
}
