import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase, uploadFile } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { X, Crown, ShieldCheck, UserMinus, Volume2, VolumeX, LogOut } from 'lucide-react';
import UserBadge, { FramedAvatar } from './UserBadge';

export default function GroupSettings({ conversation, members, profiles, onClose, onUpdated }) {
  const { user, T } = useApp();
  const [name, setName] = useState(conversation.name || '');
  const [description, setDescription] = useState(conversation.description || '');
  const [onlyAdmins, setOnlyAdmins] = useState(!!conversation.only_admins_send);

  const myMember = members.find(m => m.user_id === user?.id);
  const isOwner = myMember?.role === 'owner' || conversation.owner_id === user?.id;
  const isAdmin = isOwner || myMember?.role === 'admin';
  const isSiteOwner = user?.role === 'owner';

  async function saveInfo() {
    const { error } = await supabase.from('conversations').update({ name, description, only_admins_send: onlyAdmins }).eq('id', conversation.id);
    if (error) { toast.error(error.message); return; }
    toast.success(T('saved'));
  }

  async function changeAvatar(e) {
    const f = e.target.files?.[0]; if (!f) return;
    try {
      const url = await uploadFile('chat-media', f, `group-avatars/${conversation.id}/`);
      await supabase.from('conversations').update({ avatar_url: url }).eq('id', conversation.id);
      toast.success(T('saved'));
    } catch (err) { toast.error(err.message); }
  }

  async function setMemberRole(uid, role) {
    await supabase.from('conversation_members').update({ role }).match({ conversation_id: conversation.id, user_id: uid });
    onUpdated?.();
  }

  async function transferOwner(uid) {
    if (!isOwner) return;
    if (!window.confirm(T('transferOwnership') + '?')) return;
    await supabase.from('conversations').update({ owner_id: uid }).eq('id', conversation.id);
    await supabase.from('conversation_members').update({ role: 'owner' }).match({ conversation_id: conversation.id, user_id: uid });
    await supabase.from('conversation_members').update({ role: 'admin' }).match({ conversation_id: conversation.id, user_id: user.id });
    onUpdated?.();
    toast.success(T('saved'));
  }

  async function kick(uid) {
    if (!window.confirm(T('kick') + '?')) return;
    await supabase.from('conversation_members').delete().match({ conversation_id: conversation.id, user_id: uid });
    onUpdated?.();
  }

  async function toggleMute(uid, curr) {
    await supabase.from('conversation_members').update({ muted: !curr }).match({ conversation_id: conversation.id, user_id: uid });
    onUpdated?.();
  }

  async function leaveGroup() {
    if (!window.confirm(T('leaveGroup') + '?')) return;
    await supabase.from('conversation_members').delete().match({ conversation_id: conversation.id, user_id: user.id });
    onClose();
  }

  async function deleteGroup() {
    if (!window.confirm(T('deleteGroup') + '?')) return;
    await supabase.from('conversations').delete().eq('id', conversation.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#15161A] border border-black/5 dark:border-white/10 p-6 shadow-2xl"
        data-testid="group-settings-modal">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{T('groupInfo')}</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <div className="space-y-3 mb-6">
          <div>
            <label className="text-xs text-zinc-500">{T('groupName')}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!isAdmin} />
          </div>
          <div>
            <label className="text-xs text-zinc-500">{T('groupDescription')}</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={!isAdmin} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.04]">
            <span className="text-sm">{T('onlyAdminsSend')}</span>
            <Switch checked={onlyAdmins} onCheckedChange={setOnlyAdmins} disabled={!isAdmin} />
          </div>
          {isAdmin && (
            <div className="flex gap-2 flex-wrap">
              <label className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-white/10 cursor-pointer text-sm">
                {T('changeAvatar')}
                <input type="file" className="hidden" onChange={changeAvatar} accept="image/*" />
              </label>
              <Button onClick={saveInfo} className="rounded-xl" data-testid="group-save-btn">{T('save')}</Button>
            </div>
          )}
        </div>

        <h3 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-2">{T('members')} ({members.length})</h3>
        <div className="space-y-2">
          {members.map(m => {
            const p = profiles[m.user_id];
            if (!p) return null;
            return (
              <div key={m.user_id} className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/[0.04]">
                <div className="flex items-center gap-3 min-w-0">
                  <FramedAvatar profile={p} size={36} />
                  <div className="min-w-0">
                    <UserBadge profile={p} />
                    <div className="text-xs text-zinc-500">{m.role}</div>
                  </div>
                </div>
                {isAdmin && m.user_id !== user.id && (
                  <div className="flex items-center gap-1">
                    {isOwner && m.role !== 'owner' && (
                      <>
                        {m.role !== 'admin' ? (
                          <Button size="sm" variant="ghost" onClick={() => setMemberRole(m.user_id, 'admin')} title={T('promoteAdmin')}><ShieldCheck size={14} /></Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => setMemberRole(m.user_id, 'member')} title={T('demoteAdmin')}><ShieldCheck size={14} className="opacity-50" /></Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => transferOwner(m.user_id)} title={T('transferOwnership')}><Crown size={14} /></Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => toggleMute(m.user_id, m.muted)}>{m.muted ? <Volume2 size={14}/> : <VolumeX size={14}/>}</Button>
                    <Button size="sm" variant="ghost" onClick={() => kick(m.user_id)} className="text-rose-500"><UserMinus size={14}/></Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-2 justify-end">
          <Button variant="ghost" onClick={leaveGroup} className="text-rose-500"><LogOut size={14} className="me-2"/>{T('leaveGroup')}</Button>
          {(isOwner || isSiteOwner) && (
            <Button variant="destructive" onClick={deleteGroup}>{T('deleteGroup')}</Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
