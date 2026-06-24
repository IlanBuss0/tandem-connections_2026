import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_BASE_URL, AUTH_EXPIRED_EVENT, TOKEN_REFRESHED_EVENT, ApiError } from '@/services/api/client';
import {
  createDirectConversationWith,
  createGroupConversation,
  deleteMessage,
  fetchChatContacts,
  fetchConversationsForUser,
  fetchMessagesForConversation,
  hideConversationForMe,
  markConversationRead,
  sendMessage,
  updateConversationDetails,
  updateMessage,
  uploadChatAvatar,
  Conversation,
  ChatMessage,
} from '@/data/api';

export interface ContactPerson {
  id: string;
  name: string;
  avatar: string;
  role: 'user' | 'tutor' | 'profesional';
  subtitle?: string;
}

interface Ctx {
  conversations: Conversation[];
  messages: ChatMessage[];
  loading: boolean;
  conversationsForUser: (uid: string) => Conversation[];
  messagesFor: (cid: string) => ChatMessage[];
  send: (cid: string, text: string, idArchivos?: number[]) => Promise<void>;
  edit: (messageId: string, text: string) => Promise<void>;
  remove: (messageId: string) => Promise<void>;
  markRead: (cid: string, uid: string) => void;
  ensureConversationWith: (selfId: string, otherId: string) => Conversation;
  createDirect: (otherId: string) => Promise<Conversation>;
  createGroup: (payload: { nombre: string; descripcion?: string; participantIds: string[] }) => Promise<Conversation>;
  updateConversation: (conversationId: string, payload: { nombre?: string; descripcion?: string; participantIds?: string[]; adminIds?: string[] }) => Promise<Conversation>;
  uploadConversationAvatar: (conversationId: string, file: File, onProgress?: (pct: number) => void) => Promise<Conversation>;
  hideConversation: (conversationId: string) => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
  typingUsersFor: (conversationId: string) => string[];
  allContacts: () => ContactPerson[];
  getPersonById: (id: string) => ContactPerson | undefined;
}

const ChatContext = createContext<Ctx | null>(null);

function isNumericId(value: string) {
  return /^\d+$/.test(value);
}

function sameId(a: string | number | null | undefined, b: string | number | null | undefined) {
  return String(a ?? '') === String(b ?? '');
}

function logRealtime(message: string, payload?: unknown) {
  if ((import.meta as any).env?.MODE === 'production') return;
  if (payload === undefined) {
    console.info(`[chat realtime] ${message}`);
    return;
  }
  console.info(`[chat realtime] ${message}`, payload);
}

function socketMessageToChatMessage(message: any): ChatMessage {
  const date = new Date(message.fecha_envio);
  const fileData = message.archivos;
  const hasArchivos = Array.isArray(fileData) && fileData.length > 0;
  const firstUrl = hasArchivos ? (fileData[0]?.url || '') : '';
  const isImage = hasArchivos && fileData.some((a: any) => a?.content_type?.startsWith('image/') || /\.(png|jpe?g|gif|webp)(\?|$)/i.test(a?.url || firstUrl));
  return {
    id: String(message.id),
    conversationId: String(message.id_chat),
    senderId: String(message.id_usuario_emisor),
    senderName: '',
    text: message.contenido || '',
    timestamp: Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    read: true,
    type: hasArchivos ? (isImage ? 'image' : 'file') : 'text',
    archivos: hasArchivos ? fileData.map((a: any) => ({ id: a.id, url: a.url, nombre_archivo: a.nombre_archivo, content_type: a.content_type, peso_bytes: a.peso_bytes })) : undefined,
  };
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typingByConversation, setTypingByConversation] = useState<Record<string, string[]>>({});
  const conversationsRef = useRef<Conversation[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const joinedChatIdsRef = useRef<Set<string>>(new Set());
  const joiningChatIdsRef = useRef<Set<string>>(new Set());
  const loadedMessageConversationIdsRef = useRef<Set<string>>(new Set());
  const activeConversationIdRef = useRef<string | null>(null);
  const readAckRef = useRef<Record<string, string>>({});
  const readInFlightRef = useRef<Set<string>>(new Set());
  const typingTimeoutsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    joinedChatIdsRef.current.clear();
    joiningChatIdsRef.current.clear();
    loadedMessageConversationIdsRef.current.clear();
    conversationsRef.current = [];
    messagesRef.current = [];
    activeConversationIdRef.current = null;
    readAckRef.current = {};
    readInFlightRef.current.clear();
    setConversations([]);
    setMessages([]);
    setTypingByConversation({});
  }, [user?.id]);

  const reloadChats = useCallback(async () => {
    if (!user) return;

    const convs = await fetchConversationsForUser(user.id);
    setConversations(convs);
  }, [user]);

  const loadMessagesForConversation = useCallback(async (conversationId: string) => {
    if (!conversationId || loadedMessageConversationIdsRef.current.has(conversationId)) return;

    const loadedMessages = await fetchMessagesForConversation(conversationId);
    loadedMessageConversationIdsRef.current.add(conversationId);

    setMessages(prev => {
      const existingForConversation = prev.filter(message => message.conversationId === conversationId);
      const loadedIds = new Set(loadedMessages.map(message => message.id));
      const merged = [
        ...loadedMessages,
        ...existingForConversation.filter(message => !loadedIds.has(message.id)),
      ].sort((a, b) => {
        const left = Number(a.id);
        const right = Number(b.id);
        if (Number.isFinite(left) && Number.isFinite(right)) return left - right;
        return 0;
      });

      return [
        ...prev.filter(message => message.conversationId !== conversationId),
        ...merged,
      ];
    });
  }, []);

  const upsertMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => {
      if (prev.some(existing => existing.id === message.id)) return prev;
      return [...prev, message];
    });

    setConversations(prev => prev.map(conversation => (
      conversation.id === message.conversationId
        ? {
            ...conversation,
            lastMessage: message.text,
            lastMessageTime: message.timestamp,
            unreadCount: sameId(message.senderId, user?.id) || activeConversationIdRef.current === message.conversationId
              ? 0
              : conversation.unreadCount + 1,
          }
        : conversation
    )));
  }, [user?.id]);

  const removeMessageFromState = useCallback((messageId: string) => {
    setMessages(prev => {
      const removed = prev.find(message => message.id === messageId);
      const next = prev.filter(message => message.id !== messageId);

      if (removed) {
        const lastForConversation = next.filter(message => message.conversationId === removed.conversationId).at(-1);
        setConversations(conversations => conversations.map(conversation => (
          conversation.id === removed.conversationId
            ? {
                ...conversation,
                lastMessage: lastForConversation?.text || 'Sin mensajes todavía',
                lastMessageTime: lastForConversation?.timestamp || '',
              }
            : conversation
        )));
      }

      return next;
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetchChatContacts()
      .then((list) => {
        if (mounted) setContacts(list);
      })
      .catch(() => {
        if (mounted) setContacts([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!user) return;

    setLoading(true);
    reloadChats()
      .then(() => {
        if (!mounted) return;
      })
      .catch(() => {
        if (!mounted) return;
        setConversations([]);
        setMessages([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [reloadChats, user]);

  useEffect(() => {
    if (!user || socketConnected) return;

    const intervalId = window.setInterval(() => {
      reloadChats().catch(() => undefined);
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [reloadChats, socketConnected, user]);

  useEffect(() => {
    if (!user) return;

    const nextSocket = io(API_BASE_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    nextSocket.on('connect', () => {
      setSocketConnected(true);
      joinedChatIdsRef.current.clear();
      joiningChatIdsRef.current.clear();
      logRealtime('socket conectado', { socketId: nextSocket.id, userId: user.id, apiBaseUrl: API_BASE_URL });
      reloadChats().catch(() => undefined);
    });

    nextSocket.on('connect_error', (error) => {
      setSocketConnected(false);
      logRealtime('socket rechazo/fallo conexion', { message: error.message, apiBaseUrl: API_BASE_URL });
    });

    nextSocket.on('disconnect', (reason) => {
      setSocketConnected(false);
      logRealtime('socket desconectado', { reason });
    });

    nextSocket.on('message:new', (message) => {
      logRealtime('message:new recibido', message);
      const chatMessage = socketMessageToChatMessage(message);
      const knownConversation = conversationsRef.current.some(conversation => conversation.id === chatMessage.conversationId);

      upsertMessage(chatMessage);

      if (!knownConversation) {
        logRealtime('message:new en chat no cargado; sincronizando conversaciones', {
          id_chat: chatMessage.conversationId,
          userId: user.id,
        });
        reloadChats().catch(() => undefined);
      }
    });

    nextSocket.on('chat:new', () => {
      logRealtime('chat:new recibido');
      reloadChats().catch(() => undefined);
    });

    nextSocket.on('chat:updated', () => {
      logRealtime('chat:updated recibido');
      reloadChats().catch(() => undefined);
    });

    nextSocket.on('message:updated', (message) => {
      const updated = socketMessageToChatMessage(message);
      setMessages(prev => prev.map(item => item.id === updated.id ? updated : item));
      setConversations(prev => prev.map(conversation => (
        conversation.id === updated.conversationId
          ? { ...conversation, lastMessage: updated.text, lastMessageTime: updated.timestamp }
          : conversation
      )));
    });

    nextSocket.on('message:deleted', (payload) => {
      const deletedId = String(payload?.id ?? '');
      removeMessageFromState(deletedId);
    });

    nextSocket.on('message:typing', (payload) => {
      const conversationId = String(payload?.id_chat ?? '');
      const typingUserId = String(payload?.id_usuario ?? '');
      if (!conversationId || !typingUserId || sameId(typingUserId, user.id)) return;

      const timeoutKey = `${conversationId}:${typingUserId}`;
      const currentTimeout = typingTimeoutsRef.current[timeoutKey];
      if (currentTimeout) {
        window.clearTimeout(currentTimeout);
        delete typingTimeoutsRef.current[timeoutKey];
      }

      setTypingByConversation(prev => {
        const current = prev[conversationId] || [];
        const nextUsers = payload?.escribiendo === false
          ? current.filter(id => id !== typingUserId)
          : Array.from(new Set([...current, typingUserId]));
        return { ...prev, [conversationId]: nextUsers };
      });

      if (payload?.escribiendo !== false) {
        typingTimeoutsRef.current[timeoutKey] = window.setTimeout(() => {
          setTypingByConversation(prev => ({
            ...prev,
            [conversationId]: (prev[conversationId] || []).filter(id => id !== typingUserId),
          }));
          delete typingTimeoutsRef.current[timeoutKey];
        }, 3500);
      }
    });

    nextSocket.on('permisos:updated', (payload) => {
      logRealtime('permisos:updated recibido', payload);
      window.dispatchEvent(new CustomEvent('permisos:updated', { detail: payload }));
    });

    setSocket(nextSocket);

    const handleAuthExpired = () => {
      nextSocket.disconnect();
    };

    const handleTokenRefreshed = () => {
      if (nextSocket.connected) {
        nextSocket.disconnect().connect();
      }
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    window.addEventListener(TOKEN_REFRESHED_EVENT, handleTokenRefreshed);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
      window.removeEventListener(TOKEN_REFRESHED_EVENT, handleTokenRefreshed);
      Object.values(typingTimeoutsRef.current).forEach(window.clearTimeout);
      typingTimeoutsRef.current = {};
      nextSocket.disconnect();
      setSocketConnected(false);
      setSocket(null);
    };
  }, [reloadChats, removeMessageFromState, upsertMessage, user]);

  useEffect(() => {
    if (!socket) return;

    const joinConversations = () => {
      conversations.forEach((conversation) => {
        if (!isNumericId(conversation.id)) return;
        if (!user?.id || !conversation.participants.includes(user.id)) return;
        if (joinedChatIdsRef.current.has(conversation.id) || joiningChatIdsRef.current.has(conversation.id)) return;

        joiningChatIdsRef.current.add(conversation.id);
        socket.timeout(5000).emit('chat:join', { id_chat: Number(conversation.id) }, (error: unknown, response: any) => {
          joiningChatIdsRef.current.delete(conversation.id);

          if (error) {
            logRealtime('chat:join sin respuesta', { id_chat: conversation.id, error });
            return;
          }

          if (!response?.ok) {
            logRealtime('chat:join rechazado', { id_chat: conversation.id, response });
            return;
          }

          joinedChatIdsRef.current.add(conversation.id);
          logRealtime('chat:join OK', { id_chat: conversation.id });
        });
      });
    };

    if (socket.connected) {
      joinConversations();
    }

    socket.on('connect', joinConversations);

    return () => {
      socket.off('connect', joinConversations);
    };
  }, [conversations, socket, user?.id]);

  const conversationsForUser = useCallback(
    (uid: string) => conversations.filter(c => c.participants.includes(uid)),
    [conversations],
  );

  const messagesFor = useCallback(
    (cid: string) => messages.filter(m => m.conversationId === cid),
    [messages],
  );

  const send = useCallback(async (cid: string, text: string, idArchivos?: number[]) => {
    if (!user || (!text.trim() && (!idArchivos || idArchivos.length === 0))) return;

    const conversation = conversationsRef.current.find(item => item.id === cid);
    if (conversation && !conversation.participants.includes(user.id)) {
      logRealtime('envio bloqueado: usuario no participa en el chat', {
        id_chat: cid,
        userId: user.id,
        participants: conversation.participants,
      });
      throw new Error(`El usuario ${user.id} no participa en el chat ${cid}.`);
    }

    const messageText = text.trim();
    let sent: ChatMessage;

    try {
      sent = await sendMessage(cid, user.id, user.name, messageText, idArchivos);
    } catch (error) {
      if (isNumericId(cid) || (error instanceof ApiError && (error.status === 401 || error.status === 403))) {
        throw error;
      }
      sent = {
        id: `local-msg-${Date.now()}`,
        conversationId: cid,
        senderId: user.id,
        senderName: user.name,
        text: messageText,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        read: true,
        type: idArchivos && idArchivos.length > 0 ? 'image' : 'text',
        archivos: idArchivos?.map(id => ({ id, url: '', nombre_archivo: '' })),
      };
    }

    upsertMessage(sent);
    setConversations(prev => prev.map(c => c.id === cid ? {
      ...c,
      lastMessage: sent.text,
      lastMessageTime: sent.timestamp,
      unreadCount: 0,
    } : c));
  }, [upsertMessage, user]);

  const markRead = useCallback((cid: string, _uid: string) => {
    const lastMessage = messagesRef.current.filter(m => m.conversationId === cid).at(-1);
    const lastMessageId = lastMessage?.id || '__none__';
    const requestKey = `${cid}:${lastMessageId}`;

    if (readAckRef.current[cid] !== lastMessageId && !readInFlightRef.current.has(requestKey)) {
      readInFlightRef.current.add(requestKey);
      markConversationRead(cid, lastMessage?.id)
        .then(() => {
          const currentLastMessage = messagesRef.current.filter(m => m.conversationId === cid).at(-1);
          const currentLastMessageId = currentLastMessage?.id || '__none__';
          if (currentLastMessageId === lastMessageId) {
            readAckRef.current[cid] = lastMessageId;
          }
        })
        .catch(() => undefined)
        .finally(() => {
          readInFlightRef.current.delete(requestKey);
        });
    }

    setConversations(prev => {
      let changed = false;
      const next = prev.map(c => {
        if (c.id !== cid || c.unreadCount === 0) return c;
        changed = true;
        return { ...c, unreadCount: 0 };
      });
      return changed ? next : prev;
    });

    setMessages(prev => {
      let changed = false;
      const next = prev.map(m => {
        if (m.conversationId !== cid || m.read) return m;
        changed = true;
        return { ...m, read: true };
      });
      return changed ? next : prev;
    });
  }, []);

  const edit = useCallback(async (messageId: string, text: string) => {
    const messageText = text.trim();
    if (!messageText) return;

    await updateMessage(messageId, messageText);
    setMessages(prev => prev.map(message => (
      message.id === messageId ? { ...message, text: messageText } : message
    )));
  }, []);

  const remove = useCallback(async (messageId: string) => {
    await deleteMessage(messageId);
    removeMessageFromState(messageId);
  }, [removeMessageFromState]);

  const ensureConversationWith = useCallback((selfId: string, otherId: string): Conversation => {
    const existing = conversations.find(c => (
      c.participants.length === 2 &&
      c.participants.includes(selfId) &&
      c.participants.includes(otherId)
    ));
    if (existing) return existing;

    const other = contacts.find(c => c.id === otherId);
    const conv: Conversation = {
      id: `local-${Date.now()}`,
      participants: [selfId, otherId],
      participantNames: ['Yo', other?.name || 'Contacto'],
      lastMessage: 'Conversación iniciada',
      lastMessageTime: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      unreadCount: 0,
      avatar: other?.avatar || '💬',
      type: other?.role === 'profesional' ? 'profesional' : 'tutor',
    };

    setConversations(prev => [conv, ...prev]);

    createDirectConversationWith(selfId, otherId)
      .then((backendConv) => {
        setConversations(prev => prev.map(item => item.id === conv.id ? backendConv : item));
      })
      .catch(() => undefined);

    return conv;
  }, [contacts, conversations]);

  const createDirect = useCallback(async (otherId: string) => {
    if (!user) throw new Error('No hay usuario autenticado.');

    const existing = conversations.find(c => (
      c.participants.length === 2 &&
      c.participants.includes(user.id) &&
      c.participants.includes(otherId)
    ));
    if (existing && isNumericId(existing.id)) return existing;

    const backendConv = await createDirectConversationWith(user.id, otherId);
    setConversations(prev => [backendConv, ...prev.filter(item => item.id !== backendConv.id)]);

    if (socket && isNumericId(backendConv.id)) {
      socket.emit('chat:join', { id_chat: Number(backendConv.id) });
      joinedChatIdsRef.current.add(backendConv.id);
    }

    return backendConv;
  }, [conversations, socket, user]);

  const createGroup = useCallback(async (payload: { nombre: string; descripcion?: string; participantIds: string[] }) => {
    if (!user) throw new Error('No hay usuario autenticado.');

    const backendConv = await createGroupConversation(user.id, payload);
    setConversations(prev => [backendConv, ...prev.filter(item => item.id !== backendConv.id)]);

    if (socket && isNumericId(backendConv.id)) {
      socket.emit('chat:join', { id_chat: Number(backendConv.id) });
    }

    return backendConv;
  }, [socket, user]);

  const updateConversation = useCallback(async (conversationId: string, payload: { nombre?: string; descripcion?: string; participantIds?: string[]; adminIds?: string[] }) => {
    const updated = await updateConversationDetails(conversationId, payload);
    setConversations(prev => prev.map(item => item.id === conversationId ? updated : item));
    await reloadChats().catch(() => undefined);
    return updated;
  }, [reloadChats]);

  const uploadConversationAvatar = useCallback(async (conversationId: string, file: File, onProgress?: (pct: number) => void) => {
    const updated = await uploadChatAvatar(conversationId, file, onProgress);
    setConversations(prev => prev.map(item => item.id === conversationId ? updated : item));
    await reloadChats().catch(() => undefined);
    return updated;
  }, [reloadChats]);

  const hideConversation = useCallback(async (conversationId: string) => {
    await hideConversationForMe(conversationId);
    setConversations(prev => prev.filter(item => item.id !== conversationId));
    setMessages(prev => prev.filter(item => item.conversationId !== conversationId));
  }, []);

  const setActiveConversation = useCallback((conversationId: string | null) => {
    activeConversationIdRef.current = conversationId;
    if (conversationId && isNumericId(conversationId)) {
      loadMessagesForConversation(conversationId).catch(() => undefined);
    }
  }, [loadMessagesForConversation]);

  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    if (!socket || !socket.connected || !isNumericId(conversationId)) return;
    socket.emit('message:typing', {
      id_chat: Number(conversationId),
      escribiendo: isTyping,
    });
  }, [socket]);

  const typingUsersFor = useCallback(
    (conversationId: string) => typingByConversation[conversationId] || [],
    [typingByConversation],
  );

  const allContacts = useCallback(() => contacts, [contacts]);
  const getPersonById = useCallback((id: string) => contacts.find(c => c.id === id), [contacts]);

  const value = useMemo<Ctx>(() => ({
    conversations,
    messages,
    loading,
    conversationsForUser,
    messagesFor,
    send,
    edit,
    remove,
    markRead,
    ensureConversationWith,
    createDirect,
    createGroup,
    updateConversation,
    uploadConversationAvatar,
    hideConversation,
    setActiveConversation,
    sendTyping,
    typingUsersFor,
    allContacts,
    getPersonById,
  }), [
    conversations,
    messages,
    loading,
    conversationsForUser,
    messagesFor,
    send,
    edit,
    remove,
    markRead,
    ensureConversationWith,
    createDirect,
    createGroup,
    updateConversation,
    uploadConversationAvatar,
    hideConversation,
    setActiveConversation,
    sendTyping,
    typingUsersFor,
    allContacts,
    getPersonById,
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be inside ChatProvider');
  return ctx;
}
