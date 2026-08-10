import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BarChart3, CalendarDays, CheckCircle2, FileText, Image, Info, Link2, LogOut, MessageCircle, Plus, Sparkles, UserRound, Users, X } from 'lucide-react';
import HeaderUserAvatar from '@/components/HeaderUserAvatar';

export type TutorTab = 'home' | 'calendar' | 'activities' | 'chat' | 'notifications' | 'reports' | 'professionals' | 'pictograms' | 'pictogramCatalog' | 'connections' | 'profile' | 'about' | 'detail';

const navGroups = [
  { title: 'Principal', items: [
    { id: 'home' as const, label: 'Inicio', icon: BarChart3 },
    { id: 'calendar' as const, label: 'Calendario', icon: CalendarDays },
    { id: 'activities' as const, label: 'Actividades', icon: CheckCircle2 },
    { id: 'chat' as const, label: 'Chats', icon: MessageCircle },
  ] },
  { title: 'Seguimiento y herramientas', items: [
    { id: 'reports' as const, label: 'Reportes', icon: FileText },
    { id: 'connections' as const, label: 'Personas vinculadas', icon: Users },
    { id: 'professionals' as const, label: 'Profesionales', icon: UserRound },
    { id: 'pictograms' as const, label: 'Pictogramas IA', icon: Sparkles },
    { id: 'pictogramCatalog' as const, label: 'Pictogramas', icon: Image },
  ] },
];

type DrawerProps = { open: boolean; active: TutorTab; onClose: () => void; onNavigate: (tab: TutorTab) => void; onLogout: () => void };

export function TutorDrawer({ open, active, onClose, onNavigate, onLogout }: DrawerProps) {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  useEscapeClose(open, onClose);
  return <AnimatePresence>{open && <motion.div className="fixed inset-0 z-[70] bg-slate-950/35 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}><motion.aside ref={ref} aria-label="Navegación del Tutor" className="flex h-full w-[min(88vw,22rem)] flex-col overflow-y-auto rounded-r-[32px] bg-[#fbf9ff] p-5 shadow-2xl" initial={reduceMotion ? { opacity: 0 } : { x: '-100%' }} animate={{ x: 0, opacity: 1 }} exit={reduceMotion ? { opacity: 0 } : { x: '-100%' }} transition={{ duration: reduceMotion ? .1 : .23, ease: 'easeOut' }} onClick={event => event.stopPropagation()}>
    <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">Menú</h2><CloseButton onClick={onClose} label="Cerrar menú" /></div>
    <nav className="space-y-6">{navGroups.map(group => <NavSection key={group.title} title={group.title} items={group.items} active={active} onNavigate={onNavigate} />)}</nav>
    <div className="mt-auto border-t border-border pt-4"><button type="button" onClick={() => onNavigate('about')} className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold hover:bg-primary/5"><Info size={19} aria-hidden />Acerca de TÁNDEM</button><button type="button" onClick={onLogout} className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-primary hover:bg-primary/5"><LogOut size={19} aria-hidden />Cerrar sesión</button></div>
  </motion.aside></motion.div>}</AnimatePresence>;
}

export function TutorProfileDrawer({ open, user, onClose, onNavigate, onLogout }: Omit<DrawerProps, 'active'> & { user: { name: string; avatar?: string | null } }) {
  const reduceMotion = useReducedMotion();
  useEscapeClose(open, onClose);
  const sections = [
    { title: 'Cuenta', items: [{ id: 'profile' as const, label: 'Perfil y configuración', icon: UserRound }] },
    { title: 'Red de apoyo', items: [{ id: 'connections' as const, label: 'Personas vinculadas', icon: Users }, { id: 'professionals' as const, label: 'Profesionales', icon: Link2 }] },
    { title: 'Seguimiento y herramientas', items: [{ id: 'reports' as const, label: 'Reportes', icon: FileText }, { id: 'pictograms' as const, label: 'Pictogramas y herramientas visuales', icon: Image }] },
    { title: 'TÁNDEM', items: [{ id: 'about' as const, label: 'Acerca de TÁNDEM', icon: Info }] },
  ];
  return <AnimatePresence>{open && <div className="fixed inset-0 z-[75]"><motion.button type="button" aria-label="Cerrar perfil" onClick={onClose} className="absolute inset-0 h-full w-full bg-slate-950/20 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /><motion.aside role="dialog" aria-modal="true" aria-labelledby="tutor-profile-title" className="absolute right-0 top-0 flex h-full w-[min(92vw,27rem)] flex-col overflow-y-auto rounded-l-[32px] bg-[#fbf9ff] p-5 shadow-2xl" initial={reduceMotion ? { opacity: 0 } : { x: '100%' }} animate={{ x: 0, opacity: 1 }} exit={reduceMotion ? { opacity: 0 } : { x: '100%' }} transition={{ duration: reduceMotion ? .1 : .22, ease: 'easeOut' }}>
    <div className="flex items-center justify-between"><h2 id="tutor-profile-title" className="text-xl font-bold">Perfil y cuenta</h2><CloseButton onClick={onClose} label="Cerrar" /></div>
    <div className="mt-4 flex items-center gap-3 rounded-3xl border border-border bg-card p-4"><HeaderUserAvatar avatar={user.avatar} name={user.name} /><div><p className="font-bold">{user.name}</p><p className="text-xs text-muted-foreground">Tutor</p></div></div>
    <nav className="mt-5 space-y-5">{sections.map(section => <NavSection key={section.title} title={section.title} items={section.items} onNavigate={onNavigate} />)}</nav>
    <button type="button" onClick={onLogout} className="mt-auto flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-primary hover:bg-primary/5"><LogOut size={20} aria-hidden />Cerrar sesión</button>
  </motion.aside></div>}</AnimatePresence>;
}

export function TutorQuickMenu({ open, onOpenChange, compactProgress, onAction }: { open: boolean; onOpenChange: (value: boolean) => void; compactProgress: number; onAction: (action: 'activity' | 'event' | 'link' | 'pictogram') => void }) {
  const reduceMotion = useReducedMotion();
  const actions = [{ id: 'activity' as const, label: 'Asignar actividad', icon: CheckCircle2 }, { id: 'event' as const, label: 'Agregar evento', icon: CalendarDays }, { id: 'link' as const, label: 'Vincular', icon: Link2 }, { id: 'pictogram' as const, label: 'Crear pictograma', icon: Sparkles }];
  return <><AnimatePresence>{open && <><motion.button type="button" aria-label="Cerrar acciones" className="fixed inset-0 z-40 h-full w-full bg-white/10 backdrop-blur-[1px] lg:hidden" onClick={() => onOpenChange(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /><motion.div role="dialog" aria-label="Acciones del Tutor" className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-0 right-0 z-[55] mx-auto grid w-[min(calc(100vw-3rem),23rem)] grid-cols-2 gap-2 lg:hidden" initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .97 }} transition={{ duration: reduceMotion ? .1 : .2 }}>{actions.map(action => <button key={action.id} type="button" onClick={() => { onOpenChange(false); onAction(action.id); }} className="flex min-h-16 items-center gap-2 rounded-[22px] border border-white bg-white/90 px-3 text-left text-xs font-bold text-foreground shadow-[0_7px_20px_rgba(77,45,112,.14)] backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><action.icon size={20} className="text-primary" aria-hidden />{action.label}</button>)}</motion.div></>}</AnimatePresence><button type="button" onClick={() => onOpenChange(!open)} aria-label={open ? 'Cerrar acciones rápidas' : 'Abrir acciones rápidas'} aria-expanded={open} className="relative z-[60] inline-flex items-center justify-center rounded-full border-4 border-white bg-[#7447ac] text-white shadow-[0_7px_18px_rgba(92,52,139,.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" style={{ width: 60 - compactProgress * 12, height: 60 - compactProgress * 12, transform: `translateY(${-8 + compactProgress * 4}px)` }}>{open ? <X size={25} aria-hidden /> : <img src="/tandem-mark.png" alt="" className="h-10 w-10 rounded-full object-cover" />}</button></>;
}

function NavSection({ title, items, active, onNavigate }: { title: string; items: ReadonlyArray<{ id: TutorTab; label: string; icon: typeof UserRound }>; active?: TutorTab; onNavigate: (tab: TutorTab) => void }) {
  return <section><h3 className="mb-1 px-3 text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">{title}</h3><div className="space-y-1">{items.map(item => <button key={item.id} type="button" onClick={() => onNavigate(item.id)} aria-current={active === item.id ? 'page' : undefined} className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active === item.id ? 'bg-primary/10 text-primary' : 'hover:bg-primary/5'}`}><item.icon size={20} className="text-primary" aria-hidden />{item.label}</button>)}</div></section>;
}

function CloseButton({ onClick, label }: { onClick: () => void; label: string }) { return <button type="button" onClick={onClick} aria-label={label} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X aria-hidden /></button>; }
function useEscapeClose(open: boolean, onClose: () => void) { useEffect(() => { if (!open) return; const key = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); }; document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key); }, [open, onClose]); }
