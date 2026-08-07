import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Accessibility, FileText, Info, LogOut, UserRound, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import HeaderUserAvatar from '@/components/HeaderUserAvatar';

type Props = { open: boolean; name: string; avatar?: string | null; onClose: () => void; onNavigate: (tab: string) => void; onLogout: () => void };

export default function ProfessionalAccountPanel({ open, name, avatar, onClose, onNavigate, onLogout }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', close);
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus());
    return () => document.removeEventListener('keydown', close);
  }, [open, onClose]);
  const go = (tab: string) => { onClose(); onNavigate(tab); };
  const sections = [
    { title: 'Mi perfil', items: [{ label: 'Perfil profesional', icon: UserRound, tab: 'profile' }] },
    { title: 'Preferencias', items: [{ label: 'Accesibilidad', icon: Accessibility, tab: 'accessibility' }] },
    { title: 'Tándem', items: [{ label: 'Documentos', icon: FileText, tab: 'documents' }, { label: 'Acerca de TÁNDEM', icon: Info, tab: 'about' }] },
  ];
  return <AnimatePresence>{open && <div className="fixed inset-0 z-[70]" role="presentation">
    <motion.button aria-label="Cerrar Perfil y cuenta" className="absolute inset-0 h-full w-full bg-slate-950/15 backdrop-blur-[2px]" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
    <motion.div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="professional-account-title" className="absolute right-0 top-0 flex h-full w-[min(92vw,28rem)] flex-col overflow-y-auto rounded-l-[30px] bg-[#fbf9ff] p-5 shadow-2xl" initial={reduceMotion ? { opacity: 0 } : { x: '100%' }} animate={{ x: 0, opacity: 1 }} exit={reduceMotion ? { opacity: 0 } : { x: '100%' }} transition={{ duration: reduceMotion ? 0.1 : 0.22, ease: 'easeOut' }}>
      <div className="flex items-center justify-between"><h2 id="professional-account-title" className="text-xl font-bold text-[#3f2c55]">Perfil y cuenta</h2><button type="button" onClick={onClose} aria-label="Cerrar" className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-[#eee5f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]"><X aria-hidden /></button></div>
      <div className="mt-4 flex items-center gap-3 rounded-3xl border border-[#e8ddf5] bg-white p-3"><HeaderUserAvatar avatar={avatar} name={name} /><div className="min-w-0"><p className="truncate font-bold text-[#3f2c55]">{name}</p><p className="text-xs text-[#756a82]">Profesional</p></div></div>
      <div className="mt-5 space-y-5">{sections.map(section => <section key={section.title}><h3 className="mb-1 px-2 text-xs font-bold uppercase tracking-[0.16em] text-[#806a95]">{section.title}</h3><div className="space-y-1">{section.items.map(item => <button key={item.tab} type="button" onClick={() => go(item.tab)} className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-semibold text-[#49385c] hover:bg-[#eee5f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]"><item.icon size={19} className="text-[#7650a2]" aria-hidden />{item.label}</button>)}</div></section>)}</div>
      <button type="button" onClick={onLogout} className="mt-auto flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-semibold text-[#7c3aed] hover:bg-[#eee5f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]"><LogOut size={19} aria-hidden />Cerrar sesión</button>
    </motion.div>
  </div>}</AnimatePresence>;
}
