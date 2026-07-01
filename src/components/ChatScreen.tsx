import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { ContactPerson, useChat } from '@/contexts/ChatContext';
import { ChatMessage, Conversation, fetchConversationsForUser, fetchMessagesForConversationAsUser, fetchPermissionContext, type PermissionContext } from '@/data/api';
import { ArrowLeft, Send, Plus, Search, X, MessageCircle, Pencil, Trash2, Check, Users, ImageIcon, FileIcon, Loader2, Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import HeaderUserAvatar from '@/components/HeaderUserAvatar';
import { isPermissionEnabled, PROFESIONAL_PERMISSIONS } from '@/hooks/usePermissions';

const quickReplies = [
  '👍 ¡Dale!', '✅ Llegué bien', '🙋 Necesito ayuda', '⏰ Ya salgo', '😊 Estoy bien', '🔄 Hubo un cambio'
];

const MESSAGE_PREVIEW_LIMIT = 220;
const showLegacyManageContacts = false;

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

function isImageAttachment(archivo: { url?: string; content_type?: string }) {
  return Boolean(
    archivo.content_type?.startsWith('image/') ||
    archivo.url?.match(/\.(png|jpe?g|gif|webp)(\?|$)/i)
  );
}

export default function ChatScreen({
  profiles,
  defaultProfileId,
  defaultSelectedId,
}: {
  profiles?: ChatViewProfile[];
  defaultProfileId?: string;
  defaultSelectedId?: string;
}) {
  const { user } = useAuth();
  const { conversationsForUser, messagesFor, send, edit, remove, markRead, createDirect, createGroup, updateConversation, uploadConversationAvatar, hideConversation, setActiveConversation, sendTyping, typingUsersFor, allContacts, getPersonById, connectionStatus } = useChat();
  const { toast } = useToast();
  const [activeProfileId, setActiveProfileId] = useState(defaultProfileId || '');
  const [profileConvs, setProfileConvs] = useState<Conversation[]>([]);
  const [profileMessages, setProfileMessages] = useState<ChatMessage[]>([]);
  const [loadingProfileChats, setLoadingProfileChats] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(defaultSelectedId || null);
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
  const [permissionContext, setPermissionContext] = useState<PermissionContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [pendingFileId, setPendingFileId] = useState<number | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);
  const typingStopTimeoutRef = useRef<number | null>(null);

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

    if (!user) {
      setCanSendMessages(true);
      return;
    }

    fetchPermissionContext()
      .then(context => {
        if (!mounted) return;
        setPermissionContext(context);
        if (user.role === 'user') {
          const allowed = context.perteneciente?.permisos_efectivos?.permisos?.EnviarMensajes?.habilitado;
          setCanSendMessages(allowed !== false);
        } else {
          setCanSendMessages(true);
        }
      })
      .catch(() => {
        if (mounted) {
          setPermissionContext(null);
          setCanSendMessages(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [user?.id, user?.role]);

  useEffect(() => {
    setSelectedId(defaultSelectedId || null);
  }, [defaultSelectedId, resolvedProfileId]);

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
  const canSendInSelectedConversation = useMemo(() => {
    if (!user || !selectedConv) return canSendMessages;
    if (user.role === 'user') return canSendMessages;
    if (user.role !== 'professional') return true;
    if (selectedConv.type === 'grupo' || selectedConv.participants.length > 2) return true;

    const otherParticipantId = selectedConv.participants.find(participant => !sameId(participant, user.id));
    const link = permissionContext?.vinculos?.find(item => sameId(item.perteneciente.usuario.id, otherParticipantId));
    if (!link) return true;

    return isPermissionEnabled(
      link.permisos_efectivos?.permisos,
      PROFESIONAL_PERMISSIONS.ENVIAR_MENSAJES,
      true,
    );
  }, [canSendMessages, permissionContext?.vinculos, selectedConv, user]);
  const canActAsCurrentUser = useMemo(
    () => Boolean(user && selectedConv?.participants.some(participant => sameId(participant, user.id))),
    [selectedConv, user],
  );
  const selectedConversationId = selectedConv?.id || null;
  const currentUserId = user?.id || null;
  const currentUserParticipatesInSelected = useMemo(
    () => Boolean(currentUserId && selectedConv?.participants.some(participant => sameId(participant, currentUserId))),
    [currentUserId, selectedConv],
  );
  const lastSelectedMessageId = selectedMessages.at(-1)?.id;

  useEffect(() => {
    if (!selectedConv) return;
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
    });
  }, [selectedConv, selectedMessages.length]);

  useEffect(() => {
    setActiveConversation(selectedConv?.id || null);
    return () => setActiveConversation(null);
  }, [selectedConv?.id, setActiveConversation]);

  useEffect(() => {
    if (!selectedConversationId || !currentUserId || !currentUserParticipatesInSelected) return;
    markRead(selectedConversationId, currentUserId);
  }, [currentUserId, currentUserParticipatesInSelected, lastSelectedMessageId, markRead, selectedConversationId]);

  useEffect(() => {
    if (!selectedConv || !showManage) return;
    setManageTitle(selectedConv.title || '');
    setManageDescription(selectedConv.description || '');
    setManageParticipantIds(selectedConv.participants);
    setManageAdminIds(selectedConv.adminIds || []);
    setShowAddParticipants(false);
  }, [selectedConv, showManage]);

  useEffect(() => () => {
    if (typingStopTimeoutRef.current) {
      window.clearTimeout(typingStopTimeoutRef.current);
    }
  }, []);

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

  const sendNow = async (txt?: string, fileId?: number | null) => {
    const text = txt ?? draft;
    const hasFile = fileId ?? pendingFileId;
    if (!text.trim() && !hasFile) return;
    if (!selectedConv) return;
    if (!canSendInSelectedConversation) {
      toast({
        title: 'Mensajes deshabilitados',
        description: user.role === 'professional'
          ? 'El tutor no permite enviar mensajes a este perteneciente desde este vinculo.'
          : 'Tu tutor deshabilito temporalmente el envio de mensajes.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const idArchivos = hasFile ? [hasFile] : undefined;
      await send(selectedConv.id, text, idArchivos);
      sendTyping(selectedConv.id, false);
      setDraft('');
      setPendingFileId(null);
      setPendingFileName(null);
      setUploadPreview(null);
    } catch (error) {
      toast({
        title: 'No se pudo enviar',
        description: error instanceof Error ? error.message : 'El permiso para enviar mensajes esta deshabilitado.',
        variant: 'destructive',
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConv) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Archivo demasiado grande', description: 'El maximo es 10MB.', variant: 'destructive' });
      return;
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setUploadPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }

    setUploading(true);
    setUploadProgress(0);
    setPendingFileName(file.name);

    try {
      const { apiUploadFile } = await import('../services/api/client');
      const formData = new FormData();
      formData.append('file', file);
      const data = await apiUploadFile<{ id: number; url: string; nombre_archivo: string; content_type: string; peso_bytes: number }>(
        '/api/archivos/upload',
        formData,
        setUploadProgress,
      );
      setPendingFileId(data.id);
      setPendingFileName(data.nombre_archivo || file.name);
      toast({ title: 'Archivo subido', description: 'Envia el mensaje para compartirlo.' });
    } catch (error) {
      toast({ title: 'Error al subir archivo', description: 'Intenta de nuevo.', variant: 'destructive' });
      setUploadPreview(null);
      setPendingFileId(null);
      setPendingFileName(null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
    if (manageAdminIds.length < 1) {
      toast({
        title: 'El grupo necesita un admin',
        description: 'Selecciona al menos un administrador antes de guardar.',
        variant: 'destructive',
      });
      return;
    }
    setSavingManage(true);
    try {
      const participantIds = Array.from(new Set([user.id, ...manageParticipantIds]));
      const adminIds = Array.from(new Set(manageAdminIds)).filter(id => participantIds.includes(id));
      const updated = await updateConversation(selectedConv.id, {
        nombre: manageTitle.trim(),
        descripcion: manageDescription.trim(),
        participantIds,
        adminIds,
      });
      setSelectedId(updated.id);
      setShowManage(false);
    } catch (error) {
      toast({
        title: 'No se pudo guardar',
        description: error instanceof Error ? error.message : 'Revisa que el grupo conserve al menos un administrador.',
        variant: 'destructive',
      });
    } finally {
      setSavingManage(false);
    }
  };

  const hideSelectedConversation = async () => {
    if (!selectedConv) return;
    const selectedIsGroup = selectedConv.type === 'grupo' || selectedConv.participants.length > 2;
    try {
      await hideConversation(selectedConv.id);
      setShowManage(false);
      setSelectedId(null);
    } catch (error) {
      toast({
        title: selectedIsGroup ? 'No podes salir del grupo' : 'No se pudo eliminar el chat',
        description: error instanceof Error ? error.message : 'Intenta de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConv) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Imagen no valida', description: 'La foto del chat debe ser una imagen.', variant: 'destructive' });
      return;
    }

    setAvatarUploading(true);
    setAvatarUploadProgress(0);
    try {
      const updated = await uploadConversationAvatar(selectedConv.id, file, setAvatarUploadProgress);
      setSelectedId(updated.id);
      toast({ title: 'Foto del chat actualizada' });
    } catch (error) {
      toast({
        title: 'No se pudo cambiar la foto',
        description: error instanceof Error ? error.message : 'Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setAvatarUploading(false);
      setAvatarUploadProgress(0);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
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

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (!selectedConv || !canActAsCurrentUser || !canSendInSelectedConversation) return;

    sendTyping(selectedConv.id, value.trim().length > 0);
    if (typingStopTimeoutRef.current) {
      window.clearTimeout(typingStopTimeoutRef.current);
    }
    typingStopTimeoutRef.current = window.setTimeout(() => {
      sendTyping(selectedConv.id, false);
      typingStopTimeoutRef.current = null;
    }, 1800);
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
    const otherId = selectedConv.participants.find(p => !sameId(p, resolvedProfileId)) || '';
    const other = getPersonById(otherId);
    const chatTitle = isGroup ? selectedConv.title || 'Grupo' : other?.name || 'Contacto';
    const chatSubtitle = isGroup
      ? `${selectedConv.participants.length} participantes${selectedConv.description ? ` | ${selectedConv.description}` : ''}`
      : `${other?.role === 'profesional' ? 'Profesional' : other?.role === 'tutor' ? 'Tutor/a' : 'Usuario'}${other?.subtitle ? ` | ${other.subtitle.replace(/\s*·?\s*ID\s+\d+$/i, '')}` : ''}`;
    const msgs = selectedMessages;
    const typingUsers = typingUsersFor(selectedConv.id)
      .map(id => getPersonById(id)?.name || selectedConv.participantNames[selectedConv.participants.indexOf(id)] || 'Contacto')
      .filter(Boolean);

    return (
      <div className="flex flex-col h-[calc(100vh-9rem)] lg:h-[calc(100vh-3rem)]">
        <div className="flex items-center gap-3 pb-3 border-b border-[#f0e8f8]">
          <button onClick={() => setSelectedId(null)} className="text-[#8b7aa0] hover:text-[#6b4c9a]" aria-label="Volver"><ArrowLeft size={20} /></button>
          <HeaderUserAvatar avatar={isGroup ? selectedConv.avatar : (other?.avatar || selectedConv.avatar)} name={chatTitle} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-[#6b4c9a] truncate">{chatTitle}</p>
            <p className="text-[10px] text-[#8b7aa0] truncate">{chatSubtitle}</p>
          </div>
          <span className="hidden sm:inline-flex h-7 items-center rounded-md border border-[#ede4f8] px-2 text-[10px] font-semibold text-[#8b7aa0]">
            {connectionStatus === 'connected' ? 'conectado' : connectionStatus === 'syncing' ? 'sincronizando' : connectionStatus === 'reconnecting' ? 'reconectando' : 'sin conexion'}
          </span>
          {canActAsCurrentUser && isGroup && isCurrentUserAdmin && (
            <button type="button" onClick={() => setShowManage(true)} className="p-2 rounded-md text-[#8b7aa0] hover:bg-[#ede4f8] hover:text-[#6b4c9a]" aria-label="Administrar grupo">
              <Users size={17} />
            </button>
          )}
          {canActAsCurrentUser && (
            <button type="button" onClick={hideSelectedConversation} className="p-2 rounded-md text-[#8b7aa0] hover:bg-red-50 hover:text-red-600" aria-label={isGroup ? 'Salir del grupo' : 'Eliminar chat para mi'}>
              <Trash2 size={17} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {msgs.length === 0 && (
            <p className="text-center text-xs text-[#8b7aa0] mt-8">Empezá la conversación 👋</p>
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
                className={`flex w-full ${isMine ? 'justify-end pl-10' : 'justify-start gap-2 pr-4'}`}
              >
                {!isMine && (
                  <div className="mt-auto mb-1 shrink-0">
                    <HeaderUserAvatar avatar={sender?.avatar || other?.avatar} name={sender?.name || other?.name} />
                  </div>
                )}
                <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${msg.type === 'activity' ? 'bg-amber-50 text-amber-800 border border-amber-200 rounded-xl' : isMine ? 'bg-[#6b4c9a] text-white rounded-br-md' : 'bg-[#ede4f8] text-[#6b4c9a] border border-[#f0e8f8] rounded-bl-md'}`}>
                  {!isMine && (
                    <p className="mb-1 text-[10px] font-semibold text-[#8b7aa0]">
                      {sender?.name || other?.name || msg.senderName || 'Contacto'}
                    </p>
                  )}
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        value={editingText}
                        onChange={e => setEditingText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="h-9 w-full rounded-lg border border-[#ede4f8] bg-[#faf8ff] px-3 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20 placeholder:text-[#b8b0c8]"
                        autoFocus
                      />
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={cancelEdit} className="h-7 px-2 rounded-md bg-[#faf8ff]/80 text-[#6b4c9a] text-xs">Cancelar</button>
                        <button type="button" onClick={saveEdit} className="h-7 px-2 rounded-md bg-[#faf8ff] text-[#6b4c9a] text-xs font-semibold inline-flex items-center gap-1">
                          <Check size={12} /> Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {(msg.type === 'image' || msg.type === 'file') && msg.archivos && msg.archivos.length > 0 && (
                        <div className="space-y-1.5 mb-2">
                          {msg.archivos.map((archivo, idx) => (
                            archivo.url ? (
                              isImageAttachment(archivo) ? (
                                <img
                                  key={idx}
                                  src={archivo.url}
                                  alt={archivo.nombre_archivo}
                                  className="max-w-full rounded-lg border border-border/50 cursor-pointer hover:opacity-90 transition-opacity"
                                  style={{ maxHeight: 240 }}
                                  onClick={() => setLightboxUrl(archivo.url)}
                                />
                              ) : (
                                <a key={idx} href={archivo.url} target="_blank" rel="noopener noreferrer">
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border/30 text-xs">
                                    <FileIcon size={14} />
                                    <span className="truncate">{archivo.nombre_archivo}</span>
                                  </div>
                                </a>
                              )
                            ) : null
                          ))}
                        </div>
                      )}
                      {msg.text && <p className="whitespace-pre-wrap break-words">{visibleText}</p>}
                    </>
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
                    <p className={`text-[10px] ${isMine ? 'text-white/60' : 'text-[#8b7aa0]'}`}>
                      {msg.timestamp}{msg.editedAt ? ' · editado' : ''}
                    </p>
                    {canActAsCurrentUser && sameId(msg.senderId, user.id) && !isEditing && /^\d+$/.test(msg.id) && (
                      <div className="flex items-center gap-1 opacity-80">
                        <button type="button" onClick={() => startEdit(msg.id, msg.text)} className="p-1 rounded hover:bg-[#faf8ff]/20" aria-label="Editar mensaje">
                          <Pencil size={12} />
                        </button>
                        <button type="button" onClick={() => removeMessage(msg.id)} className="p-1 rounded hover:bg-[#faf8ff]/20" aria-label="Eliminar mensaje">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
          {typingUsers.length > 0 && (
            <div className="flex justify-start pr-4">
              <div className="rounded-2xl rounded-bl-md border border-[#f0e8f8] bg-[#ede4f8] px-4 py-2 text-xs font-medium text-[#8b7aa0]">
                {typingUsers.length === 1 ? `${typingUsers[0]} está escribiendo...` : 'Están escribiendo...'}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {canActAsCurrentUser && canSendInSelectedConversation && (
        <>
        <div className="flex gap-1.5 overflow-x-auto py-2 -mx-1 px-1">
          {quickReplies.map(qr => (
            <button key={qr} onClick={() => sendNow(qr)} className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] bg-[#ede4f8] text-[#8b7aa0] border border-[#f0e8f8] hover:border-[#6b4c9a]/30">{qr}</button>
          ))}
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          {(uploadPreview || pendingFileId || pendingFileName) && (
            <div className="flex items-center gap-2 px-1">
              <div className="relative">
                {uploadPreview ? (
                  <img src={uploadPreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-border" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                    <FileIcon size={18} />
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin text-white" />
                  </div>
                )}
                <button type="button" onClick={() => { setUploadPreview(null); setPendingFileId(null); setPendingFileName(null); }} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center" aria-label="Quitar"><X size={10} /></button>
              </div>
              {uploading && <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} /></div>}
              {!uploading && pendingFileName && (
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground">{pendingFileName}</span>
              )}
              {!uploading && pendingFileId && (
                <button type="button" onClick={() => sendNow(undefined, pendingFileId)} className="text-xs font-semibold text-primary hover:underline">Enviar con el mensaje</button>
              )}
            </div>
          )}
          <div className="flex gap-2 items-center">
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,application/pdf" className="hidden" onChange={handleFileSelect} />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0 transition-colors" aria-label="Adjuntar archivo">
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
            </button>
            <Input value={draft} onChange={e => handleDraftChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && !uploading && sendNow(undefined, pendingFileId)} placeholder="Escribí un mensaje..." className="flex-1" />
            <button onClick={() => sendNow(undefined, pendingFileId)} disabled={uploading} className="w-10 h-10 rounded-full gradient-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-50" aria-label="Enviar"><Send size={16} /></button>
          </div>
        </div>
        </>
        )}
        {canActAsCurrentUser && !canSendInSelectedConversation && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center text-xs font-medium text-amber-800">
            {user.role === 'professional'
              ? 'Mensajes deshabilitados por el tutor para este vinculo.'
              : 'Mensajes deshabilitados por tu tutor.'}
          </div>
        )}
        {!canActAsCurrentUser && (
          <div className="rounded-lg border border-[#f0e8f8] bg-[#ede4f8]/40 p-3 text-center text-xs text-[#8b7aa0]">
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
                className="bg-white rounded-t-2xl sm:rounded-none sm:rounded-l-2xl border border-[#f0e8f8] w-full sm:w-[520px] lg:w-[620px] max-h-[92vh] sm:max-h-none flex flex-col shadow-xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b border-[#f0e8f8]">
                  <h3 className="font-heading font-bold text-[#6b4c9a]">Administrar chat</h3>
                  <button onClick={() => setShowManage(false)} className="p-1.5 hover:bg-[#ede4f8] rounded-md" aria-label="Cerrar"><X size={18} /></button>
                </div>
                <div className="p-4 space-y-3 border-b border-[#f0e8f8]">
                  <div className="flex items-center gap-3 rounded-xl border border-[#ede4f8] bg-[#faf8ff] p-3">
                    <HeaderUserAvatar avatar={selectedConv.avatar} name={chatTitle} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#6b4c9a] truncate">Foto del chat</p>
                      {avatarUploading ? (
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white">
                          <div className="h-full bg-[#6b4c9a] transition-all" style={{ width: `${avatarUploadProgress}%` }} />
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#8b7aa0] truncate">Solo admins pueden cambiarla</p>
                      )}
                    </div>
                    <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" className="hidden" onChange={handleAvatarSelect} />
                    <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading} className="h-9 w-9 shrink-0 rounded-full bg-white text-[#6b4c9a] border border-[#ede4f8] inline-flex items-center justify-center hover:bg-[#ede4f8] disabled:opacity-50" aria-label="Cambiar foto del chat">
                      {avatarUploading ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
                    </button>
                  </div>
                  <input value={manageTitle} onChange={e => setManageTitle(e.target.value)} placeholder="Nombre del chat" className="w-full rounded-2xl border border-[#ede4f8] bg-[#faf8ff] px-4 py-3 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20 placeholder:text-[#b8b0c8]" />
                  <input value={manageDescription} onChange={e => setManageDescription(e.target.value)} placeholder="Descripcion" className="w-full rounded-2xl border border-[#ede4f8] bg-[#faf8ff] px-4 py-3 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20 placeholder:text-[#b8b0c8]" />
                  <p className="text-[11px] text-[#8b7aa0]">Participantes: {manageParticipantIds.join(', ')}</p>
                  <p className={`text-[11px] ${manageAdminIds.length ? 'text-[#8b7aa0]' : 'text-red-600 font-semibold'}`}>
                    Admins: {manageAdminIds.join(', ') || 'Selecciona al menos uno'}
                  </p>
                </div>
                <div className="overflow-y-auto p-3 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[#6b4c9a]">Personas en el grupo</p>
                      <button type="button" onClick={() => setShowAddParticipants(prev => !prev)} className="h-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6b4c9a] px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95 transition">
                        <Plus size={13} /> Agregar participante
                      </button>
                    </div>
                    {manageParticipantIds.map(participantId => {
                      const c = getPersonById(participantId);
                      const label = c?.name || selectedConv.participantNames[selectedConv.participants.indexOf(participantId)] || `Usuario ${participantId}`;
                      return (
                        <div key={participantId} className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#ede4f8]/30 border border-[#f0e8f8] text-left">
                          <HeaderUserAvatar avatar={c?.avatar || selectedConv.avatar} name={label} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-[#6b4c9a] truncate">{label}</p>
                            <p className="text-[11px] text-[#8b7aa0] truncate">ID {participantId}</p>
                          </div>
                          <button type="button" onClick={() => toggleManageAdmin(participantId)} className={`h-7 px-2 rounded-md border text-[10px] font-semibold ${manageAdminIds.includes(participantId) ? 'bg-amber-100 text-amber-800 border-amber-200' : 'text-[#8b7aa0] border-[#f0e8f8]'}`}>
                            Admin
                          </button>
                          {participantId !== user.id && (
                            <button type="button" onClick={() => toggleManageParticipant(participantId)} className="p-1.5 rounded-md text-[#8b7aa0] hover:bg-red-50 hover:text-red-600" aria-label="Quitar participante">
                              <X size={15} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {showAddParticipants && (
                    <div className="space-y-2 border-t border-[#f0e8f8] pt-4">
                      <p className="text-xs font-semibold text-[#6b4c9a]">Agregar participantes</p>
                      {contacts.filter(c => !manageParticipantIds.includes(c.id)).map(c => (
                        <button key={c.id} type="button" onClick={() => toggleManageParticipant(c.id)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#ede4f8]/50 transition-colors text-left">
                          <HeaderUserAvatar avatar={c.avatar} name={c.name} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-[#6b4c9a] truncate">{c.name}</p>
                            <p className="text-[11px] text-[#8b7aa0] truncate">ID {c.id}{c.subtitle ? ` | ${c.subtitle}` : ''}</p>
                          </div>
                          <Plus size={16} className="text-[#8b7aa0]" />
                        </button>
                      ))}
                      {contacts.filter(c => !manageParticipantIds.includes(c.id)).length === 0 && (
                        <p className="text-xs text-[#8b7aa0] py-3 text-center">No hay contactos disponibles para agregar</p>
                      )}
                    </div>
                  )}

                  {showLegacyManageContacts && contacts.map(c => (
                    <div key={c.id} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#ede4f8]/50 transition-colors text-left">
                      <button type="button" onClick={() => toggleManageParticipant(c.id)} className={`w-5 h-5 rounded border flex items-center justify-center text-[10px] ${manageParticipantIds.includes(c.id) ? 'bg-[#6b4c9a] text-white border-[#6b4c9a]' : 'border-[#f0e8f8]'}`} aria-label="Cambiar participante">
                        {manageParticipantIds.includes(c.id) ? '✓' : ''}
                      </button>
                      <HeaderUserAvatar avatar={c.avatar} name={c.name} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-[#6b4c9a] truncate">{c.name}</p>
                        <p className="text-[11px] text-[#8b7aa0] truncate">ID {c.id}{c.subtitle ? ` | ${c.subtitle}` : ''}</p>
                      </div>
                      <button type="button" onClick={() => toggleManageAdmin(c.id)} disabled={!manageParticipantIds.includes(c.id)} className={`h-7 px-2 rounded-md border text-[10px] font-semibold ${manageAdminIds.includes(c.id) ? 'bg-amber-100 text-amber-800 border-amber-200' : 'text-[#8b7aa0] border-[#f0e8f8] disabled:opacity-40'}`}>
                        Admin
                      </button>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-[#f0e8f8] space-y-2">
                  <button type="button" onClick={saveManage} disabled={savingManage || manageParticipantIds.length < 3 || manageAdminIds.length < 1} className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6b4c9a] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95 transition disabled:opacity-50">
                    Guardar cambios
                  </button>
                  <button type="button" onClick={hideSelectedConversation} className="w-full h-10 rounded-md border border-red-300 text-sm font-semibold text-red-600 hover:bg-red-50">
                    {isGroup ? 'Salir del grupo' : 'Eliminar chat para mi'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lightbox para imágenes */}
        <AnimatePresence>
          {lightboxUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4"
              onClick={() => setLightboxUrl('')}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-[90vw] max-h-[90vh]"
                onClick={e => e.stopPropagation()}
              >
                <img src={lightboxUrl} alt="Imagen ampliada" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
                <button onClick={() => setLightboxUrl('')} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-black shadow-md flex items-center justify-center hover:bg-gray-100 transition">
                  <X size={16} />
                </button>
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
          <h2 className="text-2xl font-heading font-bold text-[#6b4c9a]">Chat</h2>
          <p className="text-[#8b7aa0] text-sm">Tus conversaciones</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex h-9 items-center rounded-xl border border-[#f0e8f8] bg-white px-3 text-[10px] font-semibold text-[#8b7aa0]">
            {connectionStatus === 'connected' ? 'conectado' : connectionStatus === 'syncing' ? 'sincronizando' : connectionStatus === 'reconnecting' ? 'reconectando' : 'sin conexion'}
          </span>
          {profiles && profiles.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-[#f0e8f8] bg-white px-3 py-2 text-right">
              <span className="hidden sm:inline text-xs text-[#8b7aa0]">Viendo</span>
              <select
                value={resolvedProfileId}
                onChange={event => setActiveProfileId(event.target.value)}
                className="max-w-[190px] bg-transparent text-sm font-semibold text-[#6b4c9a] outline-none"
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
            <button onClick={() => setShowNew(true)} className="shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6b4c9a] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95 transition">
              <Plus size={14} /> Nuevo chat
            </button>
          )}
        </div>
      </div>

      {loadingProfileChats && (
        <div className="bg-white border border-[#f0e8f8] rounded-xl p-4 text-sm text-[#8b7aa0]">
          Cargando chats de {activeProfile?.name || 'este perfil'}...
        </div>
      )}

      {myConvs.length === 0 && (
        <div className="bg-white border border-[#f0e8f8] rounded-xl p-6 text-center">
          <MessageCircle size={32} className="mx-auto text-[#8b7aa0] mb-2" />
          <p className="text-sm text-[#6b4c9a] font-medium">Todavía no tenés conversaciones</p>
          <p className="text-xs text-[#8b7aa0] mt-1">Tocá "Nuevo chat" para empezar</p>
        </div>
      )}

      <div className="space-y-2">
        {myConvs.map(conv => {
          const isGroup = conv.type === 'grupo' || conv.participants.length > 2;
          const otherId = conv.participants.find(p => !sameId(p, resolvedProfileId)) || '';
          const other = getPersonById(otherId);
          const title = isGroup ? conv.title || 'Grupo' : other?.name || conv.participantNames.find(n => n !== user.name) || 'Chat';
          return (
            <motion.button key={conv.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} onClick={() => handleSelect(conv)} className="w-full flex items-center gap-3 p-4 rounded-xl bg-white border border-[#f0e8f8] hover:border-[#6b4c9a]/30 transition-all text-left">
              <HeaderUserAvatar avatar={isGroup ? conv.avatar : (other?.avatar || conv.avatar)} name={title} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="font-semibold text-sm text-[#6b4c9a] truncate">{title}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${isGroup ? 'bg-amber-100 text-amber-700' : other?.role === 'profesional' ? 'bg-purple-100 text-purple-700' : other?.role === 'tutor' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {isGroup ? 'Grupo' : other?.role === 'profesional' ? 'Profesional' : other?.role === 'tutor' ? 'Tutor' : 'Usuario'}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8b7aa0] shrink-0">{conv.lastMessageTime}</span>
                </div>
                <p className="text-[10px] text-[#8b7aa0] truncate mt-0.5">
                  {isGroup ? `${conv.participants.length} participantes` : other?.subtitle?.replace(/\s*·?\s*ID\s+\d+$/i, '') || 'Conversación directa'}
                </p>
                <p className="text-xs text-[#8b7aa0] truncate mt-0.5">{conv.lastMessage}</p>
              </div>
              {conv.unreadCount > 0 && <span className="w-5 h-5 rounded-full bg-[#6b4c9a] text-white text-[10px] font-bold flex items-center justify-center">{conv.unreadCount}</span>}
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
              className="bg-white rounded-t-2xl sm:rounded-2xl border border-[#f0e8f8] w-full max-w-md max-h-[85vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-[#f0e8f8]">
                <h3 className="font-heading font-bold text-[#6b4c9a]">Nuevo chat</h3>
                <button onClick={() => setShowNew(false)} className="p-1.5 hover:bg-[#ede4f8] rounded-md" aria-label="Cerrar"><X size={18} /></button>
              </div>
              <div className="p-4 space-y-3 border-b border-[#f0e8f8]">
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#ede4f8] p-1">
                  <button type="button" onClick={() => setNewMode('direct')} className={`h-9 rounded-md text-xs font-semibold ${newMode === 'direct' ? 'bg-white text-[#6b4c9a] shadow-sm' : 'text-[#8b7aa0]'}`}>
                    Persona
                  </button>
                  <button type="button" onClick={() => setNewMode('group')} className={`h-9 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1 ${newMode === 'group' ? 'bg-white text-[#6b4c9a] shadow-sm' : 'text-[#8b7aa0]'}`}>
                    <Users size={13} /> Grupo
                  </button>
                </div>
                {newMode === 'group' && (
                  <div className="space-y-2">
                    <input value={groupTitle} onChange={e => setGroupTitle(e.target.value)} placeholder="Titulo del grupo" className="w-full rounded-2xl border border-[#ede4f8] bg-[#faf8ff] px-4 py-3 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20 placeholder:text-[#b8b0c8]" />
                    <input value={groupDescription} onChange={e => setGroupDescription(e.target.value)} placeholder="Descripcion opcional" className="w-full rounded-2xl border border-[#ede4f8] bg-[#faf8ff] px-4 py-3 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20 placeholder:text-[#b8b0c8]" />
                  </div>
                )}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7aa0]" />
                  <input value={newSearch} onChange={e => setNewSearch(e.target.value)} placeholder="Buscar persona..." className="w-full rounded-2xl border border-[#ede4f8] bg-[#faf8ff] pl-9 pr-4 py-3 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20 placeholder:text-[#b8b0c8]" />
                </div>
                <div className="flex gap-1.5 overflow-x-auto">
                  {(['all','user','tutor','profesional'] as const).map(r => (
                    <button key={r} onClick={() => setFilterRole(r)} className={`px-3 py-1 rounded-full text-[11px] whitespace-nowrap border transition-colors ${filterRole === r ? 'bg-[#6b4c9a] text-white border-transparent' : 'bg-white text-[#8b7aa0] border-[#f0e8f8]'}`}>
                      {r === 'all' ? 'Todos' : r === 'user' ? 'Usuarios' : r === 'tutor' ? 'Tutores' : 'Profesionales'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-y-auto p-2">
                {filteredContacts.length === 0 && (
                  <p className="text-center text-xs text-[#8b7aa0] py-6">Sin resultados</p>
                )}
                {filteredContacts.map(c => (
                  <button key={c.id} onClick={() => newMode === 'group' ? toggleGroupParticipant(c.id) : startWith(c.id)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#ede4f8]/50 transition-colors text-left">
                    {newMode === 'group' && (
                      <span className={`w-5 h-5 rounded border flex items-center justify-center text-[10px] ${groupParticipantIds.includes(c.id) ? 'bg-[#6b4c9a] text-white border-[#6b4c9a]' : 'border-[#f0e8f8]'}`}>
                        {groupParticipantIds.includes(c.id) ? '✓' : ''}
                      </span>
                    )}
                    <HeaderUserAvatar avatar={c.avatar} name={c.name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[#6b4c9a] truncate">{c.name}</p>
                      <p className="text-[11px] text-[#8b7aa0] truncate">ID {c.id}{c.subtitle ? ` | ${c.subtitle}` : ''}</p>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${c.role === 'profesional' ? 'bg-purple-100 text-purple-700' : c.role === 'tutor' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {c.role === 'profesional' ? 'Profesional' : c.role === 'tutor' ? 'Tutor' : 'Usuario'}
                    </span>
                  </button>
                ))}
              </div>
              {newMode === 'group' && (
                <div className="p-4 border-t border-[#f0e8f8]">
                  <button
                    type="button"
                    onClick={createGroupNow}
                    disabled={!groupTitle.trim() || groupParticipantIds.length < 2 || creatingGroup}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6b4c9a] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95 transition disabled:opacity-50"
                  >
                    Crear grupo ({groupParticipantIds.length + 1})
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
