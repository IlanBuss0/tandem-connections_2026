import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchAllProfessionals,
  fetchAllTutors,
  fetchAllUsers,
  fetchConversationsForUser,
  fetchMessagesForConversation,
  sendMessage,
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
  markRead: (cid: string, uid: string) => void;
  ensureConversationWith: (selfId: string, otherId: string) => Conversation;
  allContacts: () => ContactPerson[];
  getPersonById: (id: string) => ContactPerson | undefined; //agregue esto
}

const ChatContext = createContext<Ctx | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<ContactPerson[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([fetchAllUsers(), fetchAllTutors(), fetchAllProfessionals()])
      .then(([users, tutors, pros]) => {
        if (!mounted) return;
        const list: ContactPerson[] = [
          ...users.map(u => ({ id: u.id, name: u.name, avatar: u.avatar, role: 'user' as const, subtitle: `Usuario · Nivel ${u.level}` })),
          ...tutors.map(t => ({ id: t.id, name: t.name, avatar: t.avatar, role: 'tutor' as const, subtitle: `Tutor/a · ${t.relation}` })),
          ...pros.map(p => ({ id: p.id, name: p.name, avatar: p.avatar, role: 'profesional' as const, subtitle: p.specialty })),
        ];
        setContacts(list);
      })
      .catch(() => mounted && setContacts([]))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!user) return;
    setLoading(true);
    fetchConversationsForUser(user.id)
      .then(async convs => {
        if (!mounted) return;
        setConversations(convs);
        const byConv = await Promise.all(convs.map(async c => fetchMessagesForConversation(c.id).catch(() => [])));
        if (!mounted) return;
        setMessages(byConv.flat());
      })
      .catch(() => {
        if (!mounted) return;
        setConversations([]);
        setMessages([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [user]);

  const conversationsForUser = useCallback((uid: string) => conversations.filter(c => c.participants.includes(uid)), [conversations]);
  const messagesFor = useCallback((cid: string) => messages.filter(m => m.conversationId === cid), [messages]);

  const send = useCallback(async (cid: string, text: string) => {
    if (!user || !text.trim()) return;
    const sent = await sendMessage(cid, user.id, user.name, text.trim());
    setMessages(prev => [...prev, sent]);
    setConversations(prev => prev.map(c => c.id === cid ? { ...c, lastMessage: sent.text, lastMessageTime: sent.timestamp, unreadCount: 0 } : c));
  }, [user]);

  const markRead = useCallback((cid: string, _uid: string) => {
    setConversations(prev => prev.map(c => c.id === cid ? { ...c, unreadCount: 0 } : c));
    setMessages(prev => prev.map(m => m.conversationId === cid ? { ...m, read: true } : m));
  }, []);

  const ensureConversationWith = useCallback((selfId: string, otherId: string): Conversation => {
    const existing = conversations.find(c => c.participants.length === 2 && c.participants.includes(selfId) && c.participants.includes(otherId));
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
    return conv;
  }, [contacts, conversations]);

  const allContacts = useCallback(() => contacts, [contacts]);
  const getPersonById = useCallback( //agregue esto
  (id: string) => contacts.find(c => c.id === id),
  [contacts]
);
const value = useMemo<Ctx>(() => ({ //agregue esto
  conversations,
  messages,
  loading,
  conversationsForUser,
  messagesFor,
  send,
  markRead,
  ensureConversationWith,
  allContacts,
  getPersonById
}), [
  conversations,
  messages,
  loading,
  conversationsForUser,
  messagesFor,
  send,
  markRead,
  ensureConversationWith,
  allContacts,
  getPersonById
]);
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be inside ChatProvider');
  return ctx;
}
