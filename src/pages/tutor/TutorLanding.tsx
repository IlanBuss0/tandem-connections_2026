import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, ChevronLeft, ChevronRight, Clock, Copy, Check, FileText, Loader2, LogOut, Menu, MessageCircle, Plus, QrCode, Sparkles, Stethoscope, UserRound, Users, X } from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import { fetchPermissionContext, generateTutorInvite, type TutorInvite, type TutorPermissionContextPerteneciente } from '@/data/api';
import { toast } from '@/hooks/ui/use-toast';

type TutorLandingProps = {
  onSelectPerteneciente: (userId: number) => void;
  onNavigateTo: (tab: string) => void;
};

function fullName(user?: { nombre?: string; apellido?: string; nombre_usuario?: string }) {
  return [user?.nombre, user?.apellido].filter(Boolean).join(' ') || user?.nombre_usuario || 'Usuario';
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

const avatarColors = [
  'bg-gradient-to-br from-[#7C3AED] to-[#A78BFA]',
  'bg-gradient-to-br from-[#EC4899] to-[#F472B6]',
  'bg-gradient-to-br from-[#F59E0B] to-[#FBBF24]',
  'bg-gradient-to-br from-[#10B981] to-[#34D399]',
  'bg-gradient-to-br from-[#3B82F6] to-[#60A5FA]',
  'bg-gradient-to-br from-[#EF4444] to-[#F87171]',
  'bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA]',
  'bg-gradient-to-br from-[#14B8A6] to-[#2DD4BF]',
];

function getAvatarColor(index: number): string {
  return avatarColors[index % avatarColors.length];
}

export default function TutorLanding({ onSelectPerteneciente, onNavigateTo }: TutorLandingProps) {
  const { user, logout } = useAuth();
  const [pertenecientes, setPertenecientes] = useState<TutorPermissionContextPerteneciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [invite, setInvite] = useState<TutorInvite | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPanel, setMenuPanel] = useState<'main' | 'pertenecientes'>('main');
  const [yoOpen, setYoOpen] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const ctx = await fetchPermissionContext();
      setPertenecientes(ctx.pertenecientes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleGenerateInvite = async () => {
    setGeneratingInvite(true);
    try {
      const nextInvite = await generateTutorInvite({ horas_validez: 1 });
      setInvite(nextInvite);
      setCopiedCode(false);
      toast({ title: 'Invitación creada', description: 'El código y el QR ya están listos para compartir.' });
    } catch (err) {
      toast({ title: 'No se pudo generar', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
    } finally {
      setGeneratingInvite(false);
    }
  };

  useEffect(() => {
    if (!invite) {
      setQrDataUrl('');
      return;
    }
    const inviteUrl = `${window.location.origin}/vincular/${invite.token}`;
    let cancelled = false;
    QRCode.toDataURL(inviteUrl, {
      margin: 1,
      width: 200,
      color: { dark: '#1f2937', light: '#ffffff' },
    })
      .then(url => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(''); });
    return () => { cancelled = true; };
  }, [invite]);

  const copyCode = async () => {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(invite.codigo);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast({ title: 'Código copiado' });
    } catch {
      toast({ title: 'No se pudo copiar', description: 'Seleccioná y copiá el código manualmente.', variant: 'destructive' });
    }
  };

  const handleSelect = (p: TutorPermissionContextPerteneciente) => {
    onSelectPerteneciente(p.perteneciente.id_usuario);
  };

  const tutorTabs = [
    { id: 'agenda', label: 'Mi Agenda', icon: Clock },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'pictograms', label: 'Pictogramas IA', icon: Sparkles },
    { id: 'directory', label: 'Profesionales', icon: Stethoscope },
    { id: 'reportes', label: 'Reportes', icon: FileText },
  ];

  const tutorQuickActions = [
    { id: 'agenda', label: 'Mi Agenda', icon: Clock, desc: 'Turnos y eventos personales' },
    { id: 'chat', label: 'Chat', icon: MessageCircle, desc: 'Mensajes con la red de apoyo' },
    { id: 'notifications', label: 'Notificaciones', icon: Bell, desc: 'Alertas y novedades' },
    { id: 'pictograms', label: 'Pictogramas IA', icon: Sparkles, desc: 'Crear imágenes personalizadas con IA' },
    { id: 'directory', label: 'Profesionales', icon: Stethoscope, desc: 'Encontrar profesionales validados' },
    { id: 'reportes', label: 'Reportes', icon: FileText, desc: 'Resúmenes de progreso de tus profesionales' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7FF] via-[#FAF7FF] to-white">
      <AppHeader
        onMenuClick={() => { setMenuPanel('main'); setMenuOpen(true); }}
        rightSlot={
          <>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
              {user?.name?.[0]?.toUpperCase() || 'T'}
            </div>
          </>
        }
      />

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setMenuOpen(false)}
          >
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.26, ease: 'easeOut' }}
              className="relative h-full w-[85%] max-w-sm bg-white rounded-r-3xl shadow-2xl shadow-black/10 p-6 flex flex-col overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <p className="font-heading font-bold text-gradient text-xl">TÁNDEM</p>
                <button onClick={() => setMenuOpen(false)} className="p-2 rounded-xl hover:bg-muted transition-colors" aria-label="Cerrar menú">
                  <X size={20} />
                </button>
              </div>
              {menuPanel === 'main' ? (
                <nav className="flex-1 space-y-4">
                  <div className="rounded-2xl border border-border bg-background/70 p-2">
                    <button type="button" onClick={() => setYoOpen(prev => !prev)} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold text-foreground hover:bg-[#C9A7EB]/35">
                      <span className="flex items-center gap-3"><UserRound size={18} className="text-primary" />Yo</span>
                      <ChevronRight size={17} className={`transition-transform ${yoOpen ? 'rotate-90' : ''}`} />
                    </button>
                    {yoOpen && (
                      <div className="mt-1 space-y-1">
                        {tutorTabs.map(item => (
                          <button key={item.id} onClick={() => { onNavigateTo(item.id); setMenuOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-colors text-muted-foreground hover:bg-[#C9A7EB]/50 hover:text-[#7C3AED]`}>
                            <item.icon size={18} className="shrink-0" />{item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => setMenuPanel('pertenecientes')} className="flex w-full items-center justify-between rounded-2xl border border-border bg-background/70 px-5 py-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5">
                    <span><span className="flex items-center gap-3 text-sm font-semibold text-foreground"><Users size={18} className="text-primary" />Pertenecientes</span><span className="mt-1 block text-xs text-muted-foreground">Elegir perfil o vincular nuevo usuario</span></span>
                    <ChevronRight size={18} className="text-muted-foreground" />
                  </button>
                </nav>
              ) : (
                <nav className="flex-1 space-y-4">
                  <button type="button" onClick={() => setMenuPanel('main')} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronLeft size={17} />Volver</button>
                  <div className="grid grid-cols-2 gap-3">
                    {pertenecientes.map(p => (
                      <button key={p.id} type="button" onClick={() => { onSelectPerteneciente(p.perteneciente.id_usuario); setMenuOpen(false); }} className="group min-h-[150px] rounded-2xl border border-border bg-background p-3 text-center transition hover:border-primary/50 hover:bg-primary/5">
                        <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-sm transition group-hover:scale-105 ${getAvatarColor(pertenecientes.indexOf(p))}`}>{initials(fullName(p.usuario))}</span>
                        <span className="mt-3 block truncate text-sm font-semibold text-foreground">{fullName(p.usuario)}</span>
                        <span className="mt-1 block truncate text-[11px] text-muted-foreground">{p.perteneciente.puede_autogestionarse ? 'Autogestión' : 'Asistido'}</span>
                      </button>
                    ))}
                    <button type="button" onClick={() => { setInviteModalOpen(true); setMenuOpen(false); }} className="min-h-[150px] rounded-2xl border border-dashed border-primary/45 bg-primary/5 p-3 text-center text-primary transition hover:bg-primary/10">
                      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-primary shadow-sm"><Plus size={28} /></span>
                      <span className="mt-3 block text-sm font-semibold">Vincular nuevo usuario</span>
                    </button>
                  </div>
                  {pertenecientes.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">No hay pertenecientes vinculados.</p>}
                </nav>
              )}
              <div className="mt-auto pt-4 border-t border-border">
                <button onClick={logout} className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm text-[#7C3AED] hover:bg-[#C9A7EB]/40 transition-colors">
                  <LogOut size={18} />
                  Cerrar sesion
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-16">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              ¡Hola, {user?.name?.split(' ')[0] || 'Tutor'}!
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gestioná tus vinculados y accedé a tus herramientas
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary" />
            <span className="ml-3 text-sm text-muted-foreground">Cargando tus vinculados...</span>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
            <p className="font-semibold text-destructive">{error}</p>
            <button onClick={load} className="mt-3 text-sm font-medium text-primary hover:underline">
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Section 1: Disney+ style profile selector */}
            <section className="mb-12">
              <h2 className="mb-2 font-heading text-xl font-bold text-foreground">
                ¿A quién querés ayudar hoy?
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Seleccioná un perfil para ver su progreso o vincular un nuevo usuario
              </p>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {pertenecientes.map((p, index) => (
                  <motion.button
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    className="group flex flex-col items-center gap-3 rounded-2xl p-4 transition-all hover:bg-card hover:shadow-lg hover:shadow-primary/5"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div
                      className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-md transition-all group-hover:shadow-lg group-hover:ring-4 group-hover:ring-primary/20 sm:h-24 sm:w-24 sm:text-3xl ${getAvatarColor(index)}`}
                    >
                      {initials(fullName(p.usuario))}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground truncate max-w-[120px]">
                        {fullName(p.usuario)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.perteneciente.puede_autogestionarse ? 'Autogestión' : 'Asistido'}
                      </p>
                    </div>
                  </motion.button>
                ))}

                <motion.button
                  onClick={() => setInviteModalOpen(true)}
                  className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 p-4 transition-all hover:border-primary/80 hover:bg-primary/5"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary transition-all group-hover:bg-primary/20 sm:h-24 sm:w-24">
                    <Plus size={36} strokeWidth={2.5} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-primary">Vincular</p>
                    <p className="text-[11px] text-muted-foreground">Nuevo usuario</p>
                  </div>
                </motion.button>
              </div>

              {pertenecientes.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
                  <UserRound size={40} className="mx-auto text-muted-foreground/60" />
                  <p className="mt-3 font-semibold text-foreground">No tenés vinculados todavía</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Generá una invitación para vincular un nuevo usuario
                  </p>
                  <button
                    onClick={() => setInviteModalOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                  >
                    <Plus size={18} />
                    Vincular usuario
                  </button>
                </div>
              )}
            </section>

            {/* Section 2: También puedes */}
            <section>
              <h2 className="mb-2 font-heading text-xl font-bold text-foreground">
                También puedes...
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Accedé a tus herramientas personales como tutor
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                {tutorQuickActions.map(action => (
                  <motion.button
                    key={action.id}
                    onClick={() => onNavigateTo(action.id)}
                    className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <action.icon size={24} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.desc}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {inviteModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInviteModalOpen(false)}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-heading text-lg font-bold text-foreground">Vincular usuario</h3>
                <button onClick={() => setInviteModalOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                  <X size={20} />
                </button>
              </div>

              {!invite ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Generá un código de invitación para compartir con la persona que querés vincular.
                  </p>
                  <button
                    onClick={handleGenerateInvite}
                    disabled={generatingInvite}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
                  >
                    {generatingInvite ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Plus size={18} />
                    )}
                    Generar invitación
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-xl bg-muted/50 p-4 text-center">
                    <p className="mb-1 text-xs text-muted-foreground">Código de invitación</p>
                    <p className="font-mono text-3xl font-bold tracking-[0.25em] text-foreground">
                      {invite.codigo}
                    </p>
                    <button
                      onClick={copyCode}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                      {copiedCode ? 'Copiado' : 'Copiar código'}
                    </button>
                  </div>

                  {qrDataUrl && (
                    <div className="flex justify-center">
                      <img src={qrDataUrl} alt="QR de invitación" className="h-40 w-40 rounded-xl border border-border" />
                    </div>
                  )}

                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-xs text-amber-800">
                      <strong>Válido hasta:</strong>{' '}
                      {new Date(invite.fecha_expiracion).toLocaleString('es-AR')}
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateInvite}
                    disabled={generatingInvite}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
                  >
                    {generatingInvite ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Plus size={16} />
                    )}
                    Generar nuevo código
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
