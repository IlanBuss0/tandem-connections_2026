import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { ContactPerson, useChat } from '@/contexts/ChatContext';
import { ChatMessage, Conversation, fetchConversationsForUser, fetchMessagesForConversationAsUser, fetchPermissionContext } from '@/data/api';
import { ArrowLeft, Send, Plus, Search, X, MessageCircle, Pencil, Trash2, Check, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const quickReplies = [
  '👍 ¡Dale!', '✅ Llegué bien', '🙋 Necesito ayuda', '⏰ Ya salgo', '😊 Estoy bien', '🔄 Hubo un cambio'
];

const MESSAGE_PREVIEW_LIMIT = 220;

export type ChatViewProfile = {
  id: string;
  name: string;
  avatar?: string;
  label?: string;
};

function sameId(a: string | number | null | undefined, b: string | number | null | undefined) {
  return String(a ?? '') === String(b ?? '');
}

function dedupeDirectConversations(conversations: Conversation[], viewerId: string) {
  const seen = new Set<string>();
  return conversations.filter(conversation => {
    const isDirect = conversation.type !== 'grupo' && conversation.participants.length === 2;
    if (!isDirect) return true;
    const otherId = conversation.participants.find(participant => !sameId(participant, viewerId)) || '';
    const key = [viewerId, otherId].map(String).sort().join(':');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function participantLabel(conversation: Conversation, participantId: string, getPersonById: (id: string) => ContactPerson | undefined) {
  const contact = getPersonById(participantId);
  const fallbackName = conversation.participantNames[conversation.participants.indexOf(participantId)];
  return `${contact?.name || fallbackName || 'Usuario'} ID ${participantId}`;
}

function participantsSummary(conversation: Conversation, getPersonById: (id: string) => ContactPerson | undefined) {
  return conversation.participants
    .map(participantId => participantLabel(conversation, participantId, getPersonById))
    .join(' | ');
}

export default function ChatScreen({
  profiles,
  defaultProfileId,
}: {
  profiles?: ChatViewProfile[];
  defaultProfileId?: string;
}) {
  const { user } = useAuth();
  const { conversationsForUser, messagesFor, send, edit, remove, markRead, createDirect, createGroup, updateConversation, hideConversation, allContacts, getPersonById } = useChat();
  const [activeProfileId, setActiveProfileId] = useState(defaultProfileId || '');
  const [profileConvs, setProfileConvs] = useState<Conversation[]>([]);
  const [profileMessages, setProfileMessages] = useState<ChatMessage[]>([]);
  const [loadingProfileChats, setLoadingProfileChats] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newMode, setNewMode] = useState<'direct' | 'group'>('direct');
  const [newSearch, setNewSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'tutor' | 'profesional'>('all');
  const [groupTitle, setGroupTitle] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupParticipantIds, setGroupParticipantIds] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [expandedMessageIds, setExpandedMessageIds] = useState<Set<string>>(new Set());
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showManage, setShowManage] = useState(false);
  const [manageTitle, setManageTitle] = useState('');
  const [manageDescription, setManageDescription] = useState('');
  const [manageParticipantIds, setManageParticipantIds] = useState<string[]>([]);
  const [manageAdminIds, setManageAdminIds] = useState<string[]>([]);
  const [showAddParticipants, setShowAddParticipants] = useState(false);
  const [savingManage, setSavingManage] = useState(false);
  const [canSendMessages, setCanSendMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const resolvedProfileId = activeProfileId || user?.id || '';
  const activeProfile = useMemo(() => (
    profiles?.find(profile => sameId(profile.id, resolvedProfileId)) ||
    (user ? { id: String(user.id), name: user.name, avatar: (user as any).avatar, label: 'Tutor' } : undefined)
  ), [profiles, resolvedProfileId, user]);
  const isOwnView = Boolean(user && sameId(resolvedProfileId, user.id));

  useEffect(() => {
    if (!user) return;
    setActiveProfileId(defaultProfileId || String(user.id));
  }, [defaultProfileId, user?.id]);

  useEffect(() => {
    let mounted = true;

    if (!user || user.role !== 'user') {
      setCanSendMessages(true);
      return;
    }

    fetchPermissionContext()
      .then(context => {
        if (!mounted) return;
        const allowed = context.perteneciente?.permisos_efectivos?.permisos?.EnviarMensajes?.habilitado;
        setCanSendMessages(allowed !== false);
      })
      .catch(() => {
        if (mounted) setCanSendMessages(true);
      });

    return () => {
      mounted = false;
    };
  }, [user?.id, user?.role]);

  useEffect(() => {
    setSelectedId(null);
  }, [resolvedProfileId]);

  useEffect(() => {
    let mounted = true;
    if (!user || !resolvedProfileId || isOwnView) {
      setProfileConvs([]);
      setProfileMessages([]);
      return;
    }

    setLoadingProfileChats(true);
    fetchConversationsForUser(resolvedProfileId)
      .then(async conversations => {
        const byConv = await Promise.all(conversations.map(conversation => (
          fetchMessagesForConversationAsUser(conversation.id, resolvedProfileId).catch(() => [])
        )));
        if (!mounted) return;
        setProfileConvs(conversations);
        setProfileMessages(byConv.flat());
      })
      .catch(() => {
        if (!mounted) return;
        setProfileConvs([]);
        setProfileMessages([]);
      })
      .finally(() => {
        if (mounted) setLoadingProfileChats(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOwnView, resolvedProfileId, user]);

  const rawConvs = useMemo(
    () => user ? (isOwnView ? conversationsForUser(user.id) : profileConvs) : [],
    [conversationsForUser, isOwnView, profileConvs, user]
  );
  const myConvs = useMemo(
    () => dedupeDirectConversations(rawConvs, resolvedProfileId),
    [rawConvs, resolvedProfileId]
  );
  const selectedConv: Conversation | null = useMemo(
    () => myConvs.find(c => c.id === selectedId) || null,
    [myConvs, selectedId]
  );
  const selectedMessages = useMemo(
    () => selectedConv ? (isOwnView ? messagesFor(selectedConv.id) : profileMessages.filter(message => sameId(message.conversationId, selectedConv.id))) : [],
    [isOwnView, messagesFor, profileMessages, selectedConv]
  );

  useEffect(() => {
    if (!selectedConv) return;
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
    });
  }, [selectedConv, selectedMessages.length]);

  useEffect(() => {
    if (!selectedConv || !showManage) return;
    setManageTitle(selectedConv.title || '');
    setManageDescription(selectedConv.description || '');
    setManageParticipantIds(selectedConv.participants);
    setManageAdminIds(selectedConv.adminIds || []);
    setShowAddParticipants(false);
  }, [selectedConv, showManage]);

  if (!user) return null;

  const handleSelect = (c: Conversation) => {
    setSelectedId(c.id);
    if (c.participants.some(participant => sameId(participant, user.id))) {
      markRead(c.id, user.id);
    }
  };

  const startWith = async (otherId: string) => {
    setShowNew(false);
    setNewSearch('');

    try {
      const conv = await createDirect(otherId);
      setSelectedId(conv.id);
    } catch {
      setSelectedId(null);
    }
  };

  const toggleGroupParticipant = (contactId: string) => {
    setGroupParticipantIds(prev => (
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    ));
  };

  const createGroupNow = async () => {
    if (!groupTitle.trim() || groupParticipantIds.length < 2) return;

    setCreatingGroup(true);
    try {
      const conv = await createGroup({
        nombre: groupTitle.trim(),
        descripcion: groupDescription.trim(),
        participantIds: groupParticipantIds,
      });
      setShowNew(false);
      setNewSearch('');
      setGroupTitle('');
      setGroupDescription('');
      setGroupParticipantIds([]);
      setSelectedId(conv.id);
    } finally {
      setCreatingGroup(false);
    }
  };

  const sendNow = (txt?: string) => {
    const text = txt ?? draft;
    if (!text.trim() || !selectedConv || !canSendMessages) return;
    send(selectedConv.id, text);
    setDraft('');
  };

  const toggleManageParticipant = (contactId: string) => {
    if (contactId === user.id) return;
    setManageParticipantIds(prev => (
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    ));
    setManageAdminIds(prev => prev.filter(id => id !== contactId));
  };

  const toggleManageAdmin = (contactId: string) => {
    if (!manageParticipantIds.includes(contactId)) return;
    setManageAdminIds(prev => (
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    ));
  };

  const saveManage = async () => {
    if (!selectedConv) return;
    setSavingManage(true);
    try {
      const participantIds = Array.from(new Set([user.id, ...manageParticipantIds]));
      const adminIds = Array.from(new Set([user.id, ...manageAdminIds])).filter(id => participantIds.includes(id));
      const updated = await updateConversation(selectedConv.id, {
        nombre: manageTitle.trim(),
        descripcion: manageDescription.trim(),
        participantIds,
        adminIds,
      });
      setSelectedId(updated.id);
      setShowManage(false);
    } finally {
      setSavingManage(false);
    }
  };

  const hideSelectedConversation = async () => {
    if (!selectedConv) return;
    await hideConversation(selectedConv.id);
    setShowManage(false);
    setSelectedId(null);
  };

  const startEdit = (messageId: string, text: string) => {
    setEditingMessageId(messageId);
    setEditingText(text);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const saveEdit = async () => {
    if (!editingMessageId || !editingText.trim()) return;
    await edit(editingMessageId, editingText);
    cancelEdit();
  };

  const removeMessage = async (messageId: string) => {
    await remove(messageId);
    if (editingMessageId === messageId) cancelEdit();
  };

  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessageIds(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const contacts = allContacts().filter(c => c.id !== user.id);
  const filteredContacts = contacts.filter(c => {
    if (filterRole !== 'all' && c.role !== filterRole) return false;
    const q = newSearch.toLowerCase().trim();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || (c.subtitle || '').toLowerCase().includes(q);
  });

  // === Vista de conversación ===
  if (selectedConv) {
    const isGroup = selectedConv.type === 'grupo' || selectedConv.participants.length > 2;
    const isCurrentUserAdmin = Boolean(selectedConv.adminIds?.includes(user.id));
    const canActAsCurrentUser = selectedConv.participants.some(participant => sameId(participant, user.id));
    const otherId = selectedConv.participants.find(p => !sameId(p, resolvedProfileId)) || '';
    const other = getPersonById(otherId);
    const chatTitle = isGroup ? selectedConv.title || 'Grupo' : other?.name || 'Contacto';
    const chatSubtitle = isGroup
      ? `Chat ID ${selectedConv.id} | ${selectedConv.participants.length} participantes | ${participantsSummary(selectedConv, getPersonById)}${selectedConv.description ? ` | ${selectedConv.description}` : ''}`
      : `Chat ID ${selectedConv.id} | ${other?.role === 'profesional' ? 'Profesional' : other?.role === 'tutor' ? 'Tutor/a' : 'Usuario'} ID ${otherId}${other?.subtitle ? ` | ${other.subtitle}` : ''}`;
    const msgs = selectedMessages;

    return (
      <div className="flex flex-col h-[calc(100vh-9rem)] lg:h-[calc(100vh-3rem)]">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <button onClick={() => setSelectedId(null)} className="text-muted-foreground hover:text-foreground" aria-label="Volver"><ArrowLeft size={20} /></button>
          <span className="text-2xl">{isGroup ? 'G' : other?.avatar || selectedConv.avatar}</span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-foreground truncate">{chatTitle}</p>
            <p className="text-[10px] text-muted-foreground truncate">{chatSubtitle}</p>
          </div>
          {canActAsCurrentUser && isGroup && isCurrentUserAdmin && (
            <button type="button" onClick={() => setShowManage(true)} className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Administrar grupo">
              <Users size={17} />
            </button>
          )}
          {canActAsCurrentUser && (
            <button type="button" onClick={hideSelectedConversation} className="p-2 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={isGroup ? 'Salir del grupo' : 'Eliminar chat para mi'}>
              <Trash2 size={17} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {msgs.length === 0 && (
            <p className="text-center text-xs text-muted-foreground mt-8">Empezá la conversación 👋</p>
          )}
          {msgs.map(msg => {
            const sender = getPersonById(msg.senderId);
            const isMine = sameId(msg.senderId, resolvedProfileId);
            const isEditing = editingMessageId === msg.id;
            const isLong = msg.text.length > MESSAGE_PREVIEW_LIMIT;
            const isExpanded = expandedMessageIds.has(msg.id);
            const visibleText = isLong && !isExpanded ? `${msg.text.slice(0, MESSAGE_PREVIEW_LIMIT).trimEnd()}...` : msg.text;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex w-full ${isMine ? 'justify-end pl-10' : 'justify-start pr-10'}`}
              >
                <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${msg.type === 'activity' ? 'bg-amber-50 text-amber-800 border border-amber-200 rounded-xl' : isMine ? 'gradient-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground border border-border rounded-bl-md'}`}>
                  {!isMine && (
                    <p className="mb-1 text-[10px] font-semibold text-muted-foreground">
                      {sender?.name || other?.name || msg.senderName || 'Contacto'}
                    </p>
                  )}
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={editingText}
                        onChange={e => setEditingText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="h-9 bg-background text-foreground"
                        autoFocus
                      />
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={cancelEdit} className="h-7 px-2 rounded-md bg-background/80 text-foreground text-xs">Cancelar</button>
                        <button type="button" onClick={saveEdit} className="h-7 px-2 rounded-md bg-background text-primary text-xs font-semibold inline-flex items-center gap-1">
                          <Check size={12} /> Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{visibleText}</p>
                  )}
                  {!isEditing && isLong && (
                    <button
                      type="button"
                      onClick={() => toggleMessageExpansion(msg.id)}
                      className={`mt-1 text-xs font-bold underline-offset-2 hover:underline ${isMine ? 'text-yellow-200 hover:text-yellow-100' : 'text-sky-600 hover:text-sky-700'}`}
                    >
                      {isExpanded ? 'Ver Menos' : 'Leer Más'}
                    </button>
                  )}
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className={`text-[10px] ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{msg.timestamp}</p>
                    {canActAsCurrentUser && sameId(msg.senderId, user.id) && !isEditing && /^\d+$/.test(msg.id) && (
                      <div className="flex items-center gap-1 opacity-80">
                        <button type="button" onClick={() => startEdit(msg.id, msg.text)} className="p-1 rounded hover:bg-background/20" aria-label="Editar mensaje">
                          <Pencil size={12} />
                        </button>
                        <button type="button" onClick={() => removeMessage(msg.id)} className="p-1 rounded hover:bg-background/20" aria-label="Eliminar mensaje">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {canActAsCurrentUser && canSendMessages && (
        <>
        <div className="flex gap-1.5 overflow-x-auto py-2 -mx-1 px-1">
          {quickReplies.map(qr => (
            <button key={qr} onClick={() => sendNow(qr)} className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] bg-muted text-muted-foreground border border-border hover:border-primary/30">{qr}</button>
          ))}
        </div>

        <div className="flex gap-2 pt-2 border-t border-border">
          <Input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendNow()} placeholder="Escribí un mensaje..." className="flex-1" />
          <button onClick={() => sendNow()} className="w-10 h-10 rounded-full gradient-primary text-primary-foreground flex items-center justify-center shrink-0" aria-label="Enviar"><Send size={16} /></button>
        </div>
        </>
        )}
        {canActAsCurrentUser && !canSendMessages && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center text-xs font-medium text-amber-800">
            Mensajes deshabilitados por tu tutor.
          </div>
        )}
        {!canActAsCurrentUser && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-center text-xs text-muted-foreground">
            Vista de solo lectura: estas viendo los chats de {activeProfile?.name || 'este perfil'}.
          </div>
        )}

        <AnimatePresence>
          {showManage && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-foreground/30 backdrop-blur-sm flex items-end sm:items-stretch sm:justify-end justify-center p-0"
              onClick={() => setShowManage(false)}
            >
              <motion.div
                initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
                className="bg-card rounded-t-2xl sm:rounded-none sm:rounded-l-2xl border border-border w-full sm:w-[520px] lg:w-[620px] max-h-[92vh] sm:max-h-none flex flex-col shadow-xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h3 className="font-heading font-bold text-foreground">Administrar chat</h3>
                  <button onClick={() => setShowManage(false)} className="p-1.5 hover:bg-muted rounded-md" aria-label="Cerrar"><X size={18} /></button>
                </div>
                <div className="p-4 space-y-3 border-b border-border">
                  <Input value={manageTitle} onChange={e => setManageTitle(e.target.value)} placeholder="Nombre del chat" />
                  <Input value={manageDescription} onChange={e => setManageDescription(e.target.value)} placeholder="Descripcion" />
                  <p className="text-[11px] text-muted-foreground">Participantes: {manageParticipantIds.join(', ')}</p>
                  <p className="text-[11px] text-muted-foreground">Admins: {manageAdminIds.join(', ') || user.id}</p>
                </div>
                <div className="overflow-y-auto p-3 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground">Personas en el grupo</p>
                      <Button type="button" size="sm" onClick={() => setShowAddParticipants(prev => !prev)} className="h-8">
                        <Plus size={13} className="mr-1" /> Agregar participante
                      </Button>
                    </div>
                    {manageParticipantIds.map(participantId => {
                      const c = getPersonById(participantId);
                      const label = c?.name || selectedConv.participantNames[selectedConv.participants.indexOf(participantId)] || `Usuario ${participantId}`;
                      return (
                        <div key={participantId} className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border text-left">
                          <span className="text-2xl">{c?.avatar || selectedConv.avatar}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{label}</p>
                            <p className="text-[11px] text-muted-foreground truncate">ID {participantId}</p>
                          </div>
                          <button type="button" onClick={() => toggleManageAdmin(participantId)} className={`h-7 px-2 rounded-md border text-[10px] font-semibold ${manageAdminIds.includes(participantId) ? 'bg-amber-100 text-amber-800 border-amber-200' : 'text-muted-foreground border-border'}`}>
                            Admin
                          </button>
                          {participantId !== user.id && (
                            <button type="button" onClick={() => toggleManageParticipant(participantId)} className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Quitar participante">
                              <X size={15} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {showAddParticipants && (
                    <div className="space-y-2 border-t border-border pt-4">
                      <p className="text-xs font-semibold text-foreground">Agregar participantes</p>
                      {contacts.filter(c => !manageParticipantIds.includes(c.id)).map(c => (
                        <button key={c.id} type="button" onClick={() => toggleManageParticipant(c.id)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left">
                          <span className="text-2xl">{c.avatar}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{c.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">ID {c.id}{c.subtitle ? ` | ${c.subtitle}` : ''}</p>
                          </div>
                          <Plus size={16} className="text-muted-foreground" />
                        </button>
                      ))}
                      {contacts.filter(c => !manageParticipantIds.includes(c.id)).length === 0 && (
                        <p className="text-xs text-muted-foreground py-3 text-center">No hay contactos disponibles para agregar</p>
                      )}
                    </div>
                  )}

                  {false && contacts.map(c => (
                    <div key={c.id} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left">
                      <button type="button" onClick={() => toggleManageParticipant(c.id)} className={`w-5 h-5 rounded border flex items-center justify-center text-[10px] ${manageParticipantIds.includes(c.id) ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`} aria-label="Cambiar participante">
                        {manageParticipantIds.includes(c.id) ? '✓' : ''}
                      </button>
                      <span className="text-2xl">{c.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{c.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">ID {c.id}{c.subtitle ? ` | ${c.subtitle}` : ''}</p>
                      </div>
                      <button type="button" onClick={() => toggleManageAdmin(c.id)} disabled={!manageParticipantIds.includes(c.id)} className={`h-7 px-2 rounded-md border text-[10px] font-semibold ${manageAdminIds.includes(c.id) ? 'bg-amber-100 text-amber-800 border-amber-200' : 'text-muted-foreground border-border disabled:opacity-40'}`}>
                        Admin
                      </button>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-border space-y-2">
                  <Button type="button" onClick={saveManage} disabled={savingManage || manageParticipantIds.length < 3} className="w-full gradient-primary text-primary-foreground">
                    Guardar cambios
                  </Button>
                  <button type="button" onClick={hideSelectedConversation} className="w-full h-10 rounded-md border border-destructive/30 text-sm font-semibold text-destructive hover:bg-destructive/10">
                    {isGroup ? 'Salir del grupo' : 'Eliminar chat para mi'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // === Lista de conversaciones ===
  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-2xl font-heading font-bold text-foreground">Chat</h2>
          <p className="text-muted-foreground text-sm">Tus conversaciones</p>
        </div>
        <div className="flex items-center gap-2">
          {profiles && profiles.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-right">
              <span className="hidden sm:inline text-xs text-muted-foreground">Viendo</span>
              <select
                value={resolvedProfileId}
                onChange={event => setActiveProfileId(event.target.value)}
                className="max-w-[190px] bg-transparent text-sm font-semibold text-foreground outline-none"
                aria-label="Perfil de chats"
              >
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>
                    {profile.label ? `${profile.label}: ` : ''}{profile.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {isOwnView && (
            <Button size="sm" onClick={() => setShowNew(true)} className="gradient-primary text-primary-foreground shrink-0">
              <Plus size={14} className="mr-1" /> Nuevo chat
            </Button>
          )}
        </div>
      </div>

      {loadingProfileChats && (
        <div className="bg-card border border-border rounded-xl p-4 text-sm text-muted-foreground">
          Cargando chats de {activeProfile?.name || 'este perfil'}...
        </div>
      )}

      {myConvs.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <MessageCircle size={32} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-foreground font-medium">Todavía no tenés conversaciones</p>
          <p className="text-xs text-muted-foreground mt-1">Tocá "Nuevo chat" para empezar</p>
        </div>
      )}

      <div className="space-y-2">
        {myConvs.map(conv => {
          const isGroup = conv.type === 'grupo' || conv.participants.length > 2;
          const otherId = conv.participants.find(p => !sameId(p, resolvedProfileId)) || '';
          const other = getPersonById(otherId);
          const title = isGroup ? conv.title || 'Grupo' : other?.name || conv.participantNames.find(n => n !== user.name) || 'Chat';
          return (
            <motion.button key={conv.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} onClick={() => handleSelect(conv)} className="w-full flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all text-left">
              <span className="text-3xl">{isGroup ? 'G' : other?.avatar || conv.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{title}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${isGroup ? 'bg-amber-100 text-amber-700' : other?.role === 'profesional' ? 'bg-purple-100 text-purple-700' : other?.role === 'tutor' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {isGroup ? 'Grupo' : other?.role === 'profesional' ? 'Profesional' : other?.role === 'tutor' ? 'Tutor' : 'Usuario'}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{conv.lastMessageTime}</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  Chat ID {conv.id} | Participantes: {conv.participants.join(', ')}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
              </div>
              {conv.unreadCount > 0 && <span className="w-5 h-5 rounded-full gradient-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{conv.unreadCount}</span>}
            </motion.button>
          );
        })}
      </div>

      {/* Modal nuevo chat */}
      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-foreground/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowNew(false)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
              className="bg-card rounded-t-2xl sm:rounded-2xl border border-border w-full max-w-md max-h-[85vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-heading font-bold text-foreground">Nuevo chat</h3>
                <button onClick={() => setShowNew(false)} className="p-1.5 hover:bg-muted rounded-md" aria-label="Cerrar"><X size={18} /></button>
              </div>
              <div className="p-4 space-y-3 border-b border-border">
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                  <button type="button" onClick={() => setNewMode('direct')} className={`h-9 rounded-md text-xs font-semibold ${newMode === 'direct' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                    Persona
                  </button>
                  <button type="button" onClick={() => setNewMode('group')} className={`h-9 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1 ${newMode === 'group' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                    <Users size={13} /> Grupo
                  </button>
                </div>
                {newMode === 'group' && (
                  <div className="space-y-2">
                    <Input value={groupTitle} onChange={e => setGroupTitle(e.target.value)} placeholder="Titulo del grupo" />
                    <Input value={groupDescription} onChange={e => setGroupDescription(e.target.value)} placeholder="Descripcion opcional" />
                  </div>
                )}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={newSearch} onChange={e => setNewSearch(e.target.value)} placeholder="Buscar persona..." className="pl-9" />
                </div>
                <div className="flex gap-1.5 overflow-x-auto">
                  {(['all','user','tutor','profesional'] as const).map(r => (
                    <button key={r} onClick={() => setFilterRole(r)} className={`px-3 py-1 rounded-full text-[11px] whitespace-nowrap border transition-colors ${filterRole === r ? 'gradient-primary text-primary-foreground border-transparent' : 'bg-card text-muted-foreground border-border'}`}>
                      {r === 'all' ? 'Todos' : r === 'user' ? 'Usuarios' : r === 'tutor' ? 'Tutores' : 'Profesionales'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-y-auto p-2">
                {filteredContacts.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-6">Sin resultados</p>
                )}
                {filteredContacts.map(c => (
                  <button key={c.id} onClick={() => newMode === 'group' ? toggleGroupParticipant(c.id) : startWith(c.id)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left">
                    {newMode === 'group' && (
                      <span className={`w-5 h-5 rounded border flex items-center justify-center text-[10px] ${groupParticipantIds.includes(c.id) ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>
                        {groupParticipantIds.includes(c.id) ? '✓' : ''}
                      </span>
                    )}
                    <span className="text-2xl">{c.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">ID {c.id}{c.subtitle ? ` | ${c.subtitle}` : ''}</p>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${c.role === 'profesional' ? 'bg-purple-100 text-purple-700' : c.role === 'tutor' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {c.role === 'profesional' ? 'Profesional' : c.role === 'tutor' ? 'Tutor' : 'Usuario'}
                    </span>
                  </button>
                ))}
              </div>
              {newMode === 'group' && (
                <div className="p-4 border-t border-border">
                  <Button
                    type="button"
                    onClick={createGroupNow}
                    disabled={!groupTitle.trim() || groupParticipantIds.length < 2 || creatingGroup}
                    className="w-full gradient-primary text-primary-foreground"
                  >
                    Crear grupo ({groupParticipantIds.length + 1})
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
