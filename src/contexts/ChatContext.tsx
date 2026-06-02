import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '@/services/api/client';
import {
  createDirectConversationWith,
  createGroupConversation,
  deleteMessage,
  fetchChatContacts,
  fetchConversationsForUser,
  fetchMessagesForConversation,
  getStoredAuthToken,
  markConversationRead,
  sendMessage,
  updateMessage,
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
  send: (cid: string, text: string) => Promise<void>;
  edit: (messageId: string, text: string) => Promise<void>;
  remove: (messageId: string) => Promise<void>;
  markRead: (cid: string, uid: string) => void;
  ensureConversationWith: (selfId: string, otherId: string) => Conversation;
  createGroup: (payload: { nombre: string; descripcion?: string; participantIds: string[] }) => Promise<Conversation>;
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

function socketMessageToChatMessage(message: any): ChatMessage {
  const date = new Date(message.fecha_envio);
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
    type: 'text',
  };
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const reloadChats = useCallback(async () => {
    if (!user) return;

    const convs = await fetchConversationsForUser(user.id);
    setConversations(convs);
    const byConv = await Promise.all(convs.map(async conversation => (
      fetchMessagesForConversation(conversation.id).catch(() => [])
    )));
    setMessages(byConv.flat());
  }, [user]);

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
            unreadCount: sameId(message.senderId, user?.id) ? conversation.unreadCount : conversation.unreadCount + 1,
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
                lastMessage: lastForConversation?.text || 'Sin mensajes todavia',
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
    const token = getStoredAuthToken();
    if (!user || !token) return;

    const nextSocket = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    nextSocket.on('message:new', (message) => {
      const chatMessage = socketMessageToChatMessage(message);
      const knownConversation = conversationsRef.current.some(conversation => conversation.id === chatMessage.conversationId);

      if (knownConversation) {
        upsertMessage(chatMessage);
      } else {
        reloadChats().catch(() => upsertMessage(chatMessage));
      }
    });

    nextSocket.on('chat:new', () => {
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

    setSocket(nextSocket);

    return () => {
      nextSocket.disconnect();
      setSocket(null);
    };
  }, [reloadChats, removeMessageFromState, upsertMessage, user]);

  useEffect(() => {
    if (!socket) return;

    conversations.forEach((conversation) => {
      if (isNumericId(conversation.id)) {
        socket.emit('chat:join', { id_chat: Number(conversation.id) });
      }
    });
  }, [conversations, socket]);

  const conversationsForUser = useCallback(
    (uid: string) => conversations.filter(c => c.participants.includes(uid)),
    [conversations],
  );

  const messagesFor = useCallback(
    (cid: string) => messages.filter(m => m.conversationId === cid),
    [messages],
  );

  const send = useCallback(async (cid: string, text: string) => {
    if (!user || !text.trim()) return;

    const messageText = text.trim();
    let sent: ChatMessage;

    try {
      sent = await sendMessage(cid, user.id, user.name, messageText);
    } catch {
      sent = {
        id: `local-msg-${Date.now()}`,
        conversationId: cid,
        senderId: user.id,
        senderName: user.name,
        text: messageText,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        read: true,
        type: 'text',
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
    const lastMessage = messages.filter(m => m.conversationId === cid).at(-1);
    markConversationRead(cid, lastMessage?.id).catch(() => undefined);
    setConversations(prev => prev.map(c => c.id === cid ? { ...c, unreadCount: 0 } : c));
    setMessages(prev => prev.map(m => m.conversationId === cid ? { ...m, read: true } : m));
  }, [messages]);

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
      lastMessage: 'Conversacion iniciada',
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

  const createGroup = useCallback(async (payload: { nombre: string; descripcion?: string; participantIds: string[] }) => {
    if (!user) throw new Error('No hay usuario autenticado.');

    const backendConv = await createGroupConversation(user.id, payload);
    setConversations(prev => [backendConv, ...prev.filter(item => item.id !== backendConv.id)]);

    if (socket && isNumericId(backendConv.id)) {
      socket.emit('chat:join', { id_chat: Number(backendConv.id) });
    }

    return backendConv;
  }, [socket, user]);

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
    createGroup,
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
    createGroup,
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
