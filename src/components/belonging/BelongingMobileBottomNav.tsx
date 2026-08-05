import { Calendar, CheckSquare, Home, MessageCircle } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = {
  activeTab: string;
  onNavigate: (tab: string) => void;
  center: ReactNode;
};

const destinations = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'calendar', label: 'Calendario', icon: Calendar },
  { id: 'activities', label: 'Actividades', icon: CheckSquare },
  { id: 'chat', label: 'Chats', icon: MessageCircle },
] as const;

export default function BelongingMobileBottomNav({ activeTab, onNavigate, center }: Props) {
  const renderDestination = (index: number) => {
    const item = destinations[index];
    const active = activeTab === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onNavigate(item.id)}
        aria-label={`Ir a ${item.label}`}
        aria-current={active ? 'page' : undefined}
        className={`flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2 ${active ? 'bg-[#efe6fb] text-[#6b3faf]' : 'text-[#756a82] hover:bg-white/55 hover:text-[#6b3faf]'}`}
      >
        <item.icon size={20} aria-hidden />
        <span className="max-w-full truncate">{item.label}</span>
      </button>
    );
  };

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div className="mx-auto flex h-[68px] w-full max-w-2xl items-center gap-0.5 rounded-[28px] border border-white/75 bg-white/80 px-1.5 shadow-[0_8px_28px_rgba(77,45,112,0.18)] backdrop-blur-xl backdrop-saturate-150">
        {renderDestination(0)}
        {renderDestination(1)}
        <div className="flex min-w-[58px] flex-1 items-center justify-center">{center}</div>
        {renderDestination(2)}
        {renderDestination(3)}
      </div>
    </nav>
  );
}
