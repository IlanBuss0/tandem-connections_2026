import type { LucideIcon } from 'lucide-react';

export type RoleNavItem = { id: string; label: string; icon: LucideIcon };

type Props = {
  activeTab: string;
  items: RoleNavItem[];
  onNavigate: (tab: string) => void;
};

/** Mobile role navigation using the exact glass treatment of the belonging shell. */
export default function RoleMobileBottomNav({ activeTab, items, onNavigate }: Props) {
  return (
    <nav aria-label="Navegación principal" className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="mx-auto flex h-[74px] w-full max-w-2xl items-center gap-0.5 rounded-[30px] border border-white/75 bg-white/80 px-1.5 shadow-[0_8px_28px_rgba(77,45,112,0.18)] backdrop-blur-xl backdrop-saturate-150">
        {items.map(item => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-[3px] rounded-2xl px-1 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2 ${active ? 'bg-[#efe6fb] text-[#6b3faf]' : 'text-[#756a82] hover:bg-white/55 hover:text-[#6b3faf]'}`}
            >
              <item.icon size={20} aria-hidden />
              <span className="max-w-full truncate text-[10px] leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
