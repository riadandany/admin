import React from 'react';
import { formatTokens } from '../lib/format';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import UserBadge, { FramedAvatar } from './UserBadge';

function FormattedText({ text }) {
  const tokens = formatTokens(text);
  return (
    <>
      {tokens.map((tok, i) => {
        if (tok.type === 'bold') return <strong key={i} className="font-semibold">{tok.value}</strong>;
        if (tok.type === 'underline') return <u key={i}>{tok.value}</u>;
        if (tok.type === 'strike') return <s key={i} className="opacity-70">{tok.value}</s>;
        if (tok.type === 'code') return (
          <code
            key={i}
            onClick={() => { navigator.clipboard.writeText(tok.value); toast.success('Copied'); }}
            className="inline-flex items-center gap-1 rounded-md bg-black/10 dark:bg-white/10 px-1.5 py-[1px] text-[0.85em] font-mono cursor-pointer hover:bg-black/15 dark:hover:bg-white/15"
            title="Click to copy"
          >
            <Copy size={10} />{tok.value}
          </code>
        );
        return <React.Fragment key={i}>{tok.value}</React.Fragment>;
      })}
    </>
  );
}

export default function MessageBubble({ message, isOwn, senderProfile, showSender }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} px-3`}>
      <div className={`flex gap-2 max-w-[78%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isOwn && showSender && <FramedAvatar profile={senderProfile} size={32} />}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {!isOwn && showSender && senderProfile && (
            <div className="text-xs mb-1 opacity-80">
              <UserBadge profile={senderProfile} size={12} />
            </div>
          )}
          <div
            className={`px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
              isOwn
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-tr-sm'
                : 'bg-white dark:bg-white/[0.06] border border-black/5 dark:border-white/10 text-zinc-900 dark:text-zinc-100 rounded-tl-sm'
            }`}
            data-testid="message-bubble"
          >
            {message.attachment_url && message.attachment_type === 'image' && (
              <img src={message.attachment_url} alt="img" className="rounded-xl mb-2 max-h-72 object-cover" />
            )}
            {message.attachment_url && message.attachment_type === 'audio' && (
              <audio src={message.attachment_url} controls className="mb-2" />
            )}
            {message.attachment_url && message.attachment_type === 'video' && (
              <video src={message.attachment_url} controls className="rounded-xl mb-2 max-h-72" />
            )}
            {message.content && <FormattedText text={message.content} />}
          </div>
          <span className="text-[10px] text-zinc-400 mt-1">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}
