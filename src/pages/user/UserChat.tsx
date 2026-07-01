import ChatScreen from '@/components/ChatScreen';

type UserChatProps = {
  initialSelectedId?: string;
};

export default function UserChat({ initialSelectedId }: UserChatProps) {
  return <ChatScreen key={initialSelectedId ? `chat-${initialSelectedId}` : 'chat'} defaultSelectedId={initialSelectedId} />;
}
