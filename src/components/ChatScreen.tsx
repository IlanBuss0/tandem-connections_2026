import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useChat, ContactPerson, getPersonById } from '@/contexts/ChatContext';
import { Conversation } from '@/data/api';
import { ArrowLeft, Send, Plus, Search, X, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const quickReplies = [
  '👍 ¡Dale!', '✅ Llegué bien', '🙋 Necesito ayuda', '⏰ Ya salgo', '😊 Estoy bien', '🔄 Hubo un cambio'
];

export default function ChatScreen() {
  const { user } = useAuth();
  const { conversationsForUser, messagesFor, send, markRead, ensureConversationWith, allContacts } = useChat();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newSearch, setNewSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'tutor' | 'profesional'>('all');

  if (!user) return null;
  const myConvs = conversationsForUser(user.id);
  const selectedConv: Conversation | null = useMemo(
    () => myConvs.find(c => c.id === selectedId) || null,
    [myConvs, selectedId]
  );

  const handleSelect = (c: Conversation) => {
    setSelectedId(c.id);
    markRead(c.id, user.id);
  };

  const startWith = (otherId: string) => {
    const conv = ensureConversationWith(user.id, otherId);
    setShowNew(false);
    setNewSearch('');
    setSelectedId(conv.id);
  };

  const sendNow = (txt?: string) => {
    const text = txt ?? draft;
    if (!text.trim() || !selectedConv) return;
    send(selectedConv.id, text);
    setDraft('');
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
    const otherId = selectedConv.participants.find(p => p !== user.id) || '';
    const other = getPersonById(otherId);
    const msgs = messagesFor(selectedConv.id);

    return (
      <div className="flex flex-col h-[calc(100vh-9rem)] lg:h-[calc(100vh-3rem)]">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <button onClick={() => setSelectedId(null)} className="text-muted-foreground hover:text-foreground" aria-label="Volver"><ArrowLeft size={20} /></button>
          <span className="text-2xl">{other?.avatar || selectedConv.avatar}</span>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{other?.name || 'Contacto'}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {other?.role === 'profesional' ? '👩‍⚕️ Profesional' : other?.role === 'tutor' ? '👩 Tutor/a' : '🧒 Usuario'}
              {other?.subtitle ? ` · ${other.subtitle}` : ''}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {msgs.length === 0 && (
            <p className="text-center text-xs text-muted-foreground mt-8">Empezá la conversación 👋</p>
          )}
          {msgs.map(msg => {
            const isMine = msg.senderId === user.id;
            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${msg.type === 'activity' ? 'bg-amber-50 text-amber-800 border border-amber-200 rounded-xl' : isMine ? 'gradient-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}>
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{msg.timestamp}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex gap-1.5 overflow-x-auto py-2 -mx-1 px-1">
          {quickReplies.map(qr => (
            <button key={qr} onClick={() => sendNow(qr)} className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] bg-muted text-muted-foreground border border-border hover:border-primary/30">{qr}</button>
          ))}
        </div>

        <div className="flex gap-2 pt-2 border-t border-border">
          <Input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendNow()} placeholder="Escribí un mensaje..." className="flex-1" />
          <button onClick={() => sendNow()} className="w-10 h-10 rounded-full gradient-primary text-primary-foreground flex items-center justify-center shrink-0" aria-label="Enviar"><Send size={16} /></button>
        </div>
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
        <Button size="sm" onClick={() => setShowNew(true)} className="gradient-primary text-primary-foreground shrink-0">
          <Plus size={14} className="mr-1" /> Nuevo chat
        </Button>
      </div>

      {myConvs.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <MessageCircle size={32} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-foreground font-medium">Todavía no tenés conversaciones</p>
          <p className="text-xs text-muted-foreground mt-1">Tocá "Nuevo chat" para empezar</p>
        </div>
      )}

      <div className="space-y-2">
        {myConvs.map(conv => {
          const otherId = conv.participants.find(p => p !== user.id) || '';
          const other = getPersonById(otherId);
          return (
            <motion.button key={conv.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} onClick={() => handleSelect(conv)} className="w-full flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all text-left">
              <span className="text-3xl">{other?.avatar || conv.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{other?.name || conv.participantNames.find(n => n !== user.name) || 'Chat'}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${other?.role === 'profesional' ? 'bg-purple-100 text-purple-700' : other?.role === 'tutor' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {other?.role === 'profesional' ? 'Profesional' : other?.role === 'tutor' ? 'Tutor' : 'Usuario'}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{conv.lastMessageTime}</span>
                </div>
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
                  <button key={c.id} onClick={() => startWith(c.id)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left">
                    <span className="text-2xl">{c.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{c.subtitle}</p>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${c.role === 'profesional' ? 'bg-purple-100 text-purple-700' : c.role === 'tutor' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {c.role === 'profesional' ? 'Profesional' : c.role === 'tutor' ? 'Tutor' : 'Usuario'}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
