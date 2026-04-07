import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getConversationsForUser, getMessagesForConversation, Conversation, ChatMessage } from '@/data/mockData';
import { Send, ArrowLeft, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';

const quickReplies = [
  '👍 ¡Dale!', '✅ Llegué bien', '🙋 Necesito ayuda', '⏰ Ya salgo', '😊 Estoy bien', '🔄 Hubo un cambio de plan'
];

export default function UserChat() {
  const { user } = useAuth();
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [extraMessages, setExtraMessages] = useState<ChatMessage[]>([]);

  if (!user) return null;
  const convos = getConversationsForUser(user.id);

  const sendMessage = (text?: string) => {
    const msg = text || newMessage;
    if (!msg.trim() || !selectedConv) return;
    const m: ChatMessage = { id: `msg-${Date.now()}`, conversationId: selectedConv.id, senderId: user.id, senderName: user.name, text: msg, timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }), read: true };
    setExtraMessages(prev => [...prev, m]);
    setNewMessage('');
  };

  if (selectedConv) {
    const messages = [...getMessagesForConversation(selectedConv.id), ...extraMessages.filter(m => m.conversationId === selectedConv.id)];
    const otherName = selectedConv.participantNames.find(n => n !== user.name) || '';

    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-2rem)]">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <button onClick={() => setSelectedConv(null)} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={20} /></button>
          <span className="text-2xl">{selectedConv.avatar}</span>
          <div>
            <p className="font-semibold text-sm text-foreground">{otherName}</p>
            <p className="text-[10px] text-muted-foreground">{selectedConv.type === 'profesional' ? '👩‍⚕️ Profesional' : '👩 Tutor/a'}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {messages.map(msg => {
            const isMine = msg.senderId === user.id;
            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${msg.type === 'activity' ? 'bg-amber-50 text-amber-800 border border-amber-200 rounded-xl' : isMine ? 'gradient-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}>
                  <p>{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{msg.timestamp}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
        {/* Quick replies */}
        <div className="flex gap-1.5 overflow-x-auto py-2 -mx-1 px-1">
          {quickReplies.map(qr => (
            <button key={qr} onClick={() => sendMessage(qr)} className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] bg-muted text-muted-foreground border border-border hover:border-primary/30">{qr}</button>
          ))}
        </div>
        <div className="flex gap-2 pt-2 border-t border-border">
          <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Escribí un mensaje..." className="flex-1" />
          <button onClick={() => sendMessage()} className="w-10 h-10 rounded-full gradient-primary text-primary-foreground flex items-center justify-center shrink-0"><Send size={16} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Chat</h2>
        <p className="text-muted-foreground text-sm">Tus conversaciones</p>
      </div>
      <div className="space-y-2">
        {convos.map(conv => {
          const otherName = conv.participantNames.find(n => n !== user.name) || '';
          return (
            <motion.button key={conv.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} onClick={() => setSelectedConv(conv)} className="w-full flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all text-left">
              <span className="text-3xl">{conv.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground">{otherName}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${conv.type === 'profesional' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{conv.type === 'profesional' ? 'Profesional' : 'Tutor'}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{conv.lastMessageTime}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
              </div>
              {conv.unreadCount > 0 && <span className="w-5 h-5 rounded-full gradient-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{conv.unreadCount}</span>}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
