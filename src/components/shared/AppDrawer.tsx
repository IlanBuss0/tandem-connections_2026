import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, type LucideIcon } from 'lucide-react';

export type AppDrawerItem = { id: string; label: string; icon: LucideIcon };
export type AppDrawerGroup = { title: string; items: AppDrawerItem[]; hideOnMobile?: boolean };

type AppDrawerProps = {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  active: string;
  onNavigate: (id: string) => void;
  groups: AppDrawerGroup[];
  header?: ReactNode;
  footer?: ReactNode;
};

// Drawer lateral con la estetica compartida de TANDEM. Reutilizado por el
// menu de profesional y por el de perteneciente para que tengan la misma
// identidad visual (fondo violeta suave, titulo + grupo de secciones).
export default function AppDrawer({ open, onClose, ariaLabel, active, onNavigate, groups, header, footer }: AppDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            className="flex h-full w-[min(88vw,22rem)] flex-col overflow-y-auto rounded-r-[32px] border-r border-violet-100 bg-[#fbf9ff] p-5 shadow-2xl"
            initial={reduce ? { opacity: 0 } : { x: '-100%' }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { x: '-100%' }}
            transition={{ duration: reduce ? 0.1 : 0.23 }}
            onClick={event => event.stopPropagation()}
          >
            {header}
            <nav className="flex-1 space-y-5">
              {groups.map((group, index) => (
                <AppDrawerNavGroup key={`${group.title}-${index}`} group={group} active={active} onNavigate={onNavigate} />
              ))}
            </nav>
            {footer}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AppDrawerHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h2 className="text-xl font-bold text-primary">{title}</h2>
      <button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <X aria-hidden />
      </button>
    </div>
  );
}

export function AppDrawerNavGroup({ group, active, onNavigate }: { group: AppDrawerGroup; active: string; onNavigate: (id: string) => void }) {
  return (
    <section className={group.hideOnMobile ? 'max-lg:hidden' : undefined}>
      <h3 className="mb-1 px-3 text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">{group.title}</h3>
      <div className="space-y-1">
        {group.items.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            aria-current={active === item.id ? 'page' : undefined}
            className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active === item.id ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-primary/5 hover:text-primary'}`}
          >
            <item.icon size={20} aria-hidden />
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}