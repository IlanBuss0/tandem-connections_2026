import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  conversations as seedConvs,
  chatMessages as seedMsgs,
  users,
  tutors,
  professionals,
  Conversation,
  ChatMessage,
} from '@/data/mockData';

const KEY_C = 'tandem:chat:conversations:v1';
const KEY_M = 'tandem:chat:messages:v1';

function load<T>(k: string, fallback: T): T {
  try { const raw = localStorage.getItem(k); if (raw) return JSON.parse(raw); } catch { /* noop */ }
  return fallback;
}
function save<T>(k: string, v: T) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* noop */ }
}

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
  conversationsForUser: (uid: string) => Conversation[];
  messagesFor: (cid: string) => ChatMessage[];
  send: (cid: string, text: string) => void;
  markRead: (cid: string, uid: string) => void;
  ensureConversationWith: (selfId: string, otherId: string) => Conversation;
  allContacts: () => ContactPerson[];
}

const ChatContext = createContext<Ctx | null>(null);

function nowTime() {
  return new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function getPersonById(id: string): ContactPerson | null {
  const u = users.find(x => x.id === id);
  if (u) return { id: u.id, name: u.name, avatar: u.avatar, role: 'user', subtitle: `Usuario · Nivel ${u.level}` };
  const t = tutors.find(x => x.id === id);
  if (t) return { id: t.id, name: t.name, avatar: t.avatar, role: 'tutor', subtitle: `Tutor/a · ${t.relation}` };
  const p = professionals.find(x => x.id === id);
  if (p) return { id: p.id, name: p.name, avatar: p.avatar, role: 'profesional', subtitle: p.specialty };
  return null;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>(() => load(KEY_C, seedConvs));
  const [messages, setMessages] = useState<ChatMessage[]>(() => load(KEY_M, seedMsgs));

  useEffect(() => { save(KEY_C, conversations); }, [conversations]);
  useEffect(() => { save(KEY_M, messages); }, [messages]);

  const conversationsForUser = useCallback(
    (uid: string) => conversations.filter(c => c.participants.includes(uid)),
    [conversations]
  );

  const messagesFor = useCallback(
    (cid: string) => messages.filter(m => m.conversationId === cid),
    [messages]
  );

  const send = useCallback((cid: string, text: string) => {
    if (!user || !text.trim()) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      conversationId: cid,
      senderId: user.id,
      senderName: user.name,
      text: text.trim(),
      timestamp: nowTime(),
      read: true,
      type: 'text',
    };
    setMessages(prev => [...prev, msg]);
    setConversations(prev => prev.map(c =>
      c.id === cid
        ? { ...c, lastMessage: text.trim(), lastMessageTime: msg.timestamp, unreadCount: 0 }
        : c
    ));
  }, [user]);

  const markRead = useCallback((cid: string, _uid: string) => {
    setConversations(prev => prev.map(c => c.id === cid ? { ...c, unreadCount: 0 } : c));
    setMessages(prev => prev.map(m => m.conversationId === cid ? { ...m, read: true } : m));
  }, []);

  const ensureConversationWith = useCallback((selfId: string, otherId: string): Conversation => {
    const existing = conversations.find(c =>
      c.participants.length === 2 &&
      c.participants.includes(selfId) &&
      c.participants.includes(otherId)
    );
    if (existing) return existing;

    const self = getPersonById(selfId);
    const other = getPersonById(otherId);
    const type: Conversation['type'] = other?.role === 'profesional' ? 'profesional' : 'tutor';
    const conv: Conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      participants: [selfId, otherId],
      participantNames: [self?.name || 'Yo', other?.name || 'Contacto'],
      lastMessage: 'Conversación iniciada',
      lastMessageTime: nowTime(),
      unreadCount: 0,
      avatar: other?.avatar || '💬',
      type,
    };
    setConversations(prev => [conv, ...prev]);
    return conv;
  }, [conversations]);

  const allContacts = useCallback((): ContactPerson[] => {
    const list: ContactPerson[] = [];
    users.forEach(u => list.push({ id: u.id, name: u.name, avatar: u.avatar, role: 'user', subtitle: `Usuario · Nivel ${u.level}` }));
    tutors.forEach(t => list.push({ id: t.id, name: t.name, avatar: t.avatar, role: 'tutor', subtitle: `Tutor/a · ${t.relation}` }));
    professionals.forEach(p => list.push({ id: p.id, name: p.name, avatar: p.avatar, role: 'profesional', subtitle: p.specialty }));
    return list;
  }, []);

  const value = useMemo<Ctx>(() => ({
    conversations, messages, conversationsForUser, messagesFor, send, markRead, ensureConversationWith, allContacts,
  }), [conversations, messages, conversationsForUser, messagesFor, send, markRead, ensureConversationWith, allContacts]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be inside ChatProvider');
  return ctx;
}

export { getPersonById };
