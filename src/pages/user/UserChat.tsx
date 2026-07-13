import ChatScreen from '@/components/ChatScreen';
import { ChatProvider } from '@/contexts/ChatContext';

type UserChatProps = {
  initialSelectedId?: string;
};

export default function UserChat({ initialSelectedId }: UserChatProps) {
  return (
    <ChatProvider>
      <ChatScreen key={initialSelectedId ? `chat-${initialSelectedId}` : 'chat'} defaultSelectedId={initialSelectedId} />
    </ChatProvider>
  );
}
