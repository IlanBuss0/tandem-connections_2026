import { X, type LucideIcon } from 'lucide-react';

type NavItem<TTab extends string> = { id: TTab; label: string; icon: LucideIcon };

export function RoleNavSection<TTab extends string>({ title, items, active, onNavigate, hideOnMobile = false, variant }: {
  title: string;
  items: ReadonlyArray<NavItem<TTab>>;
  active?: TTab;
  onNavigate: (tab: TTab) => void;
  hideOnMobile?: boolean;
  variant: 'tutor' | 'professional';
}) {
  return (
    <section className={hideOnMobile ? 'max-lg:hidden' : undefined}>
      <h3 className="mb-1 px-3 text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">{title}</h3>
      <div className="space-y-1">
        {items.map(item => (
          <button key={item.id} type="button" onClick={() => onNavigate(item.id)}
            aria-current={active === item.id ? 'page' : undefined}
            className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active === item.id ? 'bg-primary/10 text-primary' : variant === 'tutor' ? 'hover:bg-primary/5' : 'text-foreground hover:bg-primary/5 hover:text-primary'}`}>
            <item.icon size={20} className="text-primary" aria-hidden />{item.label}
          </button>
        ))}
      </div>
    </section>
  );
}

export function RoleQuickActionGrid<TAction extends string>({ actions, onAction, variant }: {
  actions: ReadonlyArray<NavItem<TAction>>;
  onAction: (action: TAction) => void;
  variant: 'tutor' | 'professional';
}) {
  return actions.map(action => (
    <button key={action.id} type="button" onClick={() => onAction(action.id)}
      className={`flex min-h-16 items-center gap-2 rounded-[22px] border border-white bg-white/90 px-3 text-left text-xs font-bold shadow-[0_7px_20px_rgba(77,45,112,.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${variant === 'tutor' ? 'text-foreground backdrop-blur-xl' : ''}`}>
      <action.icon size={20} className="text-primary" aria-hidden />{action.label}
    </button>
  ));
}

export function RoleCloseButton({ onClick, label }: { onClick: () => void; label: string }) {
  return <button type="button" onClick={onClick} aria-label={label} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X aria-hidden /></button>;
}
