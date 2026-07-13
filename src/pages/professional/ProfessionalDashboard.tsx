import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchActivitiesForUser, fetchAllProfessionals, fetchLinkedPertenecientesForSupportUser, getEmotionsForUser, getObjectivesForUser, getRecommendationsForUser, joinProfessionalInviteByCode, type Activity, type CalendarEvent, type Professional, type User } from '@/data/api';
import { LogOut, CheckCircle2, Heart, Calendar, Target, Users, FileText, BarChart3, TrendingUp, ClipboardPlus, MessageSquare, Sparkles, MessageCircle, Bell, X, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnimatePresence, motion } from 'framer-motion';
import ActivityManager from '@/components/ActivityManager';
import AdvancedStats from '@/components/AdvancedStats';
import ChatScreen from '@/components/ChatScreen';
import { ChatProvider } from '@/contexts/ChatContext';
import AppHeader from '@/components/AppHeader';
import HeaderUserAvatar from '@/components/HeaderUserAvatar';
import NotificationBellButton, { useUnreadNotifications } from '@/components/NotificationBellButton';
import ProfessionalAgenda from '@/components/ProfessionalAgenda';
import UserNotifications from '@/pages/user/UserNotifications';
import { isPermissionEnabled, PROFESIONAL_PERMISSIONS, usePermissionContext } from '@/hooks/usePermissions';
import PermissionBlocked from '@/components/PermissionBlocked';
import AiPictogramStudio from '@/components/AiPictogramStudio';
import { useToast } from '@/components/ui/use-toast';
import { useCalendar } from '@/contexts/CalendarContext';
import { useSyncMobileMenuOpen } from '@/contexts/MobileMenuState';

function professionalEventPatientId(description?: string) {
  return description?.match(/\[paciente:([^\]]+)\]/)?.[1] || '';
}

function nextTherapySessionForPatient(events: CalendarEvent[], patientId: string) {
  const now = new Date().toISOString().split('T')[0];
  return events
    .filter(event =>
      event.type === 'terapia'
      && event.date >= now
      && professionalEventPatientId(event.description) === patientId,
    )
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0];
}

export default function ProfessionalDashboard() {
  const { user, logout } = useAuth();
  const { context: permissionContext, refetch: refetchPermissionContext } = usePermissionContext();
  const { events: professionalCalendarEvents } = useCalendar();
  const { toast } = useToast();
  const [tab, setTab] = useState('patients');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [patientTab, setPatientTab] = useState<'overview' | 'stats'>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  useSyncMobileMenuOpen(menuOpen);
  const [linkedUsers, setLinkedUsers] = useState<User[]>([]);
  const [activitiesByUser, setActivitiesByUser] = useState<Record<string, Activity[]>>({});
  const [allProfessionals, setAllProfessionals] = useState<Professional[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [professionalInviteCode, setProfessionalInviteCode] = useState('');
  const [joiningProfessionalInvite, setJoiningProfessionalInvite] = useState(false);
  const [selectedNotificationChatId, setSelectedNotificationChatId] = useState<string | undefined>();
  const { unreadCount, setUnreadCount } = useUnreadNotifications(
    user && user.role === 'professional' ? { id: String(user.id) } : null
  );

  useEffect(() => {
    if (!user || user.role !== 'professional') return;
    let cancelled = false;
    setLoadingPatients(true);
    Promise.all([
      fetchLinkedPertenecientesForSupportUser(user.id, 'professional'),
      fetchAllProfessionals().catch(() => []),
    ])
      .then(([patients, professionals]) => {
        if (cancelled) return;
        setLinkedUsers(patients);
        setAllProfessionals(professionals);
        Promise.all(
          patients.map(patient =>
            fetchActivitiesForUser(patient.id)
              .then(activities => [patient.id, activities] as const)
              .catch(() => [patient.id, []] as const)
          )
        ).then(entries => {
          if (!cancelled) setActivitiesByUser(Object.fromEntries(entries));
        });
      })
      .finally(() => {
        if (!cancelled) setLoadingPatients(false);
    });
    return () => { cancelled = true; };
  }, [user]);

  const reloadPatients = async () => {
    if (!user || user.role !== 'professional') return;
    setLoadingPatients(true);
    try {
      const patients = await fetchLinkedPertenecientesForSupportUser(user.id, 'professional');
      setLinkedUsers(patients);
      const entries = await Promise.all(
        patients.map(patient =>
          fetchActivitiesForUser(patient.id)
            .then(activities => [patient.id, activities] as const)
            .catch(() => [patient.id, []] as const)
        )
      );
      setActivitiesByUser(Object.fromEntries(entries));
    } finally {
      setLoadingPatients(false);
    }
  };

  const acceptProfessionalInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = professionalInviteCode.trim();
    if (!code) return;

    setJoiningProfessionalInvite(true);
    try {
      await joinProfessionalInviteByCode(code);
      setProfessionalInviteCode('');
      await refetchPermissionContext();
      await reloadPatients();
      toast({ title: 'Perteneciente vinculado', description: 'El nuevo vinculo ya aparece en tus pacientes.' });
    } catch (err) {
      toast({ title: 'No se pudo vincular', description: err instanceof Error ? err.message : 'Codigo invalido o expirado.', variant: 'destructive' });
    } finally {
      setJoiningProfessionalInvite(false);
    }
  };

  if (!user || user.role !== 'professional') return null;

  const vinculosByUsuarioPerteneciente = new Map(
    (permissionContext?.vinculos || []).map(item => [String(item.perteneciente.usuario.id), item])
  );
  const professionalLinks = permissionContext?.vinculos || [];
  const hasProfessionalPermission = (permission: string, fallback = false) =>
    professionalLinks.some(item =>
      item.permisos_efectivos.vinculo_aprobado
      && isPermissionEnabled(item.permisos_efectivos.permisos, permission, fallback)
    );
  const canAssignActivities = hasProfessionalPermission(PROFESIONAL_PERMISSIONS.ASIGNAR_ACTIVIDADES, true);
  const canCreateCustomActivities = hasProfessionalPermission(PROFESIONAL_PERMISSIONS.CREAR_ACTIVIDADES_PERSONALIZADAS, true);
  const canScheduleSessions = hasProfessionalPermission(PROFESIONAL_PERMISSIONS.AGENDAR_SESIONES, true);
  const canSendMessages = hasProfessionalPermission(PROFESIONAL_PERMISSIONS.ENVIAR_MENSAJES, false);

  const tabs = [
    { id: 'patients', label: 'Pacientes', icon: Users },
    ...(canScheduleSessions ? [{ id: 'agenda', label: 'Agenda', icon: Calendar }] : []),
    ...(canAssignActivities || canCreateCustomActivities ? [{ id: 'create', label: 'Crear actividad', icon: Sparkles }] : []),
    ...(canSendMessages ? [{ id: 'chat', label: 'Chat', icon: MessageCircle }] : []),
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'pictograms', label: 'Pictogramas IA', icon: Sparkles },
    { id: 'tools', label: 'Herramientas', icon: ClipboardPlus },
    { id: 'directory', label: 'Directorio', icon: FileText },
  ];

  const patientDetail = selectedPatient ? linkedUsers.find(u => u.id === selectedPatient) : null;

  const navigateFromNotification = (nextTab: string, params?: Record<string, any>) => {
    const sourceUserId = params?.sourceUserId ? String(params.sourceUserId) : null;
    const linkedPatient = sourceUserId && linkedUsers.some(item => String(item.id) === sourceUserId)
      ? sourceUserId
      : null;

    if (nextTab === 'chat' && canSendMessages) {
      setSelectedNotificationChatId(params?.chatId ? String(params.chatId) : undefined);
      setSelectedPatient(null);
      setTab('chat');
      return;
    }

    if (linkedPatient) {
      setSelectedPatient(linkedPatient);
      setPatientTab(nextTab === 'activities' ? 'stats' : 'overview');
      setTab('patients');
      return;
    }

    if (nextTab === 'calendar' && canScheduleSessions) {
      setSelectedPatient(null);
      setTab('agenda');
      return;
    }

    setSelectedPatient(null);
    setTab('patients');
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        onMenuClick={() => setMenuOpen(true)}
        rightSlot={
          <>
            <HeaderUserAvatar avatar={user.avatar} name={user.name} />
            <NotificationBellButton count={unreadCount} onClick={() => { setTab('notifications'); setSelectedPatient(null); }} />
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
            className="relative h-full w-[85%] max-w-sm bg-white rounded-r-3xl shadow-2xl shadow-black/10 p-6 flex flex-col overflow-y-auto"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.26, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <img className="h-8 object-contain" src="/tandem-logo.png" alt="Tandem" />
              <button onClick={() => setMenuOpen(false)} className="p-2 rounded-xl hover:bg-muted transition-colors" aria-label="Cerrar menú">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {tabs.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id);
                    setSelectedPatient(null);
                    setMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors text-left ${
                    tab === item.id ? 'text-[#7C3AED] font-semibold' : 'text-muted-foreground'
                  } hover:bg-[#C9A7EB]/60 hover:text-[#7C3AED]`}
                >
                  <item.icon size={18} className="shrink-0" />
                  {item.label}
                </button>
              ))}
            </nav>
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



      <div className="flex gap-2 overflow-x-auto p-4 border-b border-border">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSelectedPatient(null); }} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${tab === t.id ? 'gradient-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {tab === 'chat' && canSendMessages && (
          <ChatProvider>
            <ChatScreen
              key={selectedNotificationChatId ? `chat-${selectedNotificationChatId}` : 'chat'}
              defaultSelectedId={selectedNotificationChatId}
            />
          </ChatProvider>
        )}
        {tab === 'notifications' && (
          <UserNotifications onUnreadCountChange={setUnreadCount} onNavigate={navigateFromNotification} />
        )}
        {tab === 'patients' && !selectedPatient && (
          <>
            <h2 className="font-heading font-bold text-xl text-foreground">Mis pacientes ({linkedUsers.length})</h2>
            {loadingPatients && (
              <div className="bg-card rounded-xl border border-border p-6 text-sm text-muted-foreground">
                Cargando pertenecientes vinculados...
              </div>
            )}
            {!loadingPatients && linkedUsers.length === 0 && (
              <div className="bg-card rounded-xl border border-border p-6 text-sm text-muted-foreground">
                No hay pertenecientes vinculados a este profesional.
              </div>
            )}
            {linkedUsers.map(u => {
              const acts = activitiesByUser[u.id] || [];
              const completed = acts.filter(a => a.status === 'completada').length;
              const adherence = acts.length > 0 ? Math.round((completed / acts.length) * 100) : 0;
              const emotions = getEmotionsForUser(u.id);
              const objs = getObjectivesForUser(u.id).filter(o => o.status === 'activo');
              const nextSession = nextTherapySessionForPatient(professionalCalendarEvents, u.id);
              const linkPermissions = vinculosByUsuarioPerteneciente.get(String(u.id))?.permisos_efectivos;
              const canViewPatientHistory = Boolean(permissionContext) && isPermissionEnabled(linkPermissions?.permisos, PROFESIONAL_PERMISSIONS.VER_HISTORIAL, false);

              return (
                <motion.button key={u.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} onClick={() => { setSelectedPatient(u.id); setPatientTab('stats'); }} className="w-full bg-card rounded-xl border border-border overflow-hidden text-left hover:border-primary/30 transition-all">
                  <div className="p-4 flex items-center gap-4">
                    <span className="text-4xl">{u.avatar}</span>
                    <div className="flex-1">
                      <p className="font-heading font-bold text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.age ? `${u.age} años · ` : ''}Nivel {u.level} · Racha {u.streak} días</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${canViewPatientHistory ? adherence >= 70 ? 'text-success' : adherence >= 40 ? 'text-amber-500' : 'text-destructive' : 'text-muted-foreground'}`}>{canViewPatientHistory ? `${adherence}%` : '-'}</p>
                      <p className="text-[10px] text-muted-foreground">{canViewPatientHistory ? 'adherencia' : 'sin historial'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 px-4 pb-4">
                    <div className="bg-muted/50 rounded-lg p-2 text-center"><p className="text-xs text-muted-foreground">Actividades</p><p className="font-bold text-foreground">{completed}/{acts.length}</p></div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center"><p className="text-xs text-muted-foreground">Emociones</p><p className="font-bold text-foreground">{emotions.length}</p></div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center"><p className="text-xs text-muted-foreground">Objetivos</p><p className="font-bold text-foreground">{objs.length}</p></div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center"><p className="text-xs text-muted-foreground">Próx. sesión</p><p className="font-bold text-foreground text-xs">{nextSession ? nextSession.date.slice(5) : '-'}</p></div>
                  </div>
                  <div className="px-4 pb-3 flex gap-1">
                    {emotions.slice(0, 5).map(em => <span key={em.id} className="text-lg">{em.emoji}</span>)}
                  </div>
                </motion.button>
              );
            })}
          </>
        )}

        {tab === 'patients' && selectedPatient && patientDetail && (() => {
          const acts = activitiesByUser[patientDetail.id] || [];
          const completed = acts.filter(a => a.status === 'completada').length;
          const adherence = acts.length > 0 ? Math.round((completed / acts.length) * 100) : 0;
          const emotions = getEmotionsForUser(patientDetail.id);
          const objs = getObjectivesForUser(patientDetail.id).filter(o => o.status === 'activo');
          const recs = getRecommendationsForUser(patientDetail.id);
          const patientPermissions = vinculosByUsuarioPerteneciente.get(String(patientDetail.id))?.permisos_efectivos?.permisos;
          const canViewPatientHistory = Boolean(permissionContext) && isPermissionEnabled(patientPermissions, PROFESIONAL_PERMISSIONS.VER_HISTORIAL, false);
          const canMessagePatient = isPermissionEnabled(patientPermissions, PROFESIONAL_PERMISSIONS.ENVIAR_MENSAJES, false);
          const canSchedulePatient = isPermissionEnabled(patientPermissions, PROFESIONAL_PERMISSIONS.AGENDAR_SESIONES, true);
          return (
            <div className="space-y-4">
              <button onClick={() => { setSelectedPatient(null); setPatientTab('overview'); }} className="text-sm text-primary font-medium">← Volver a pacientes</button>
              {!canViewPatientHistory && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  El tutor deshabilito ver historial para este perteneciente.
                </div>
              )}
              <div className="flex gap-2 overflow-x-auto">
                {([
                  { id: 'overview', label: 'Resumen', icon: BarChart3 },
                  { id: 'stats', label: 'Estadísticas', icon: TrendingUp },
                ] as const).map(t => (
                  <button key={t.id} onClick={() => setPatientTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${patientTab === t.id ? 'gradient-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
                    <t.icon size={14} /> {t.label}
                  </button>
                ))}
              </div>

              {patientTab === 'stats' && canViewPatientHistory && <AdvancedStats user={patientDetail} activities={acts} />}
              {patientTab === 'overview' && canViewPatientHistory && (<>
              <div className="bg-card rounded-xl p-5 border border-border">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl">{patientDetail.avatar}</span>
                  <div>
                    <h3 className="font-heading font-bold text-xl text-foreground">{patientDetail.name}</h3>
                    <p className="text-sm text-muted-foreground">{patientDetail.age} años · {patientDetail.bio}</p>
                    <p className="text-xs text-muted-foreground mt-1">Nivel {patientDetail.level} · {patientDetail.points} pts · Racha {patientDetail.streak} días</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-2xl font-bold text-foreground">{adherence}%</p><p className="text-xs text-muted-foreground">Adherencia</p></div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-2xl font-bold text-foreground">{completed}</p><p className="text-xs text-muted-foreground">Completadas</p></div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-2xl font-bold text-foreground">{emotions.length}</p><p className="text-xs text-muted-foreground">Registros emoc.</p></div>
                </div>
              </div>

              <div className="bg-card rounded-xl p-4 border border-border">
                <h4 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-primary" /> Evolución emocional</h4>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {emotions.slice(0, 10).map(em => (
                    <div key={em.id} className="flex flex-col items-center min-w-[48px]">
                      <span className="text-2xl">{em.emoji}</span>
                      <span className="text-[8px] text-muted-foreground">{em.date.slice(5)}</span>
                      <div className="flex gap-0.5 mt-0.5">{Array.from({length:5}).map((_,i)=><span key={i} className={`w-1 h-1 rounded-full ${i<em.intensity?'bg-primary':'bg-muted'}`}/>)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-xl p-4 border border-border">
                <h4 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2"><Target size={16} className="text-primary" /> Objetivos terapéuticos</h4>
                {objs.map(obj => (
                  <div key={obj.id} className="mb-3">
                    <div className="flex justify-between text-sm"><span className="text-foreground">{obj.title}</span><span className="text-muted-foreground">{Math.round((obj.progress/obj.target)*100)}%</span></div>
                    <div className="w-full bg-muted rounded-full h-2 mt-1"><div className="bg-primary h-2 rounded-full" style={{width:`${(obj.progress/obj.target)*100}%`}}/></div>
                  </div>
                ))}
              </div>

              <div className="bg-card rounded-xl p-4 border border-border">
                <h4 className="font-heading font-semibold text-foreground mb-3">📝 Observaciones y recomendaciones</h4>
                {recs.filter(r=>r.source==='profesional').slice(0,5).map(r => (
                  <div key={r.id} className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${r.priority==='alta'?'bg-red-100 text-red-700':r.priority==='media'?'bg-amber-100 text-amber-700':'bg-green-100 text-green-700'}`}>{r.priority}</span>
                    <div><p className="text-sm text-foreground">{r.title}</p><p className="text-xs text-muted-foreground">{r.description}</p></div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                {canMessagePatient && <Button className="flex-1 gradient-primary text-primary-foreground"><MessageSquare size={14} className="mr-1" /> Enviar mensaje</Button>}
                {canSchedulePatient && <Button variant="outline" className="flex-1"><Calendar size={14} className="mr-1" /> Proponer sesión</Button>}
              </div>
              </>)}
            </div>
          );
        })()}

        {tab === 'create' && (canAssignActivities || canCreateCustomActivities) && <ActivityManager />}
        {tab === 'create' && !(canAssignActivities || canCreateCustomActivities) && (
          <PermissionBlocked
            title="Creacion de actividades deshabilitada"
            description="El tutor no habilito la creacion o asignacion de actividades para tus vinculos activos."
          />
        )}

        {tab === 'agenda' && canScheduleSessions && <ProfessionalAgenda patients={linkedUsers} />}
        {tab === 'pictograms' && <AiPictogramStudio />}

        {tab === 'tools' && (
          <div className="space-y-4">
            <h2 className="font-heading font-bold text-xl text-foreground">Herramientas profesionales</h2>
            <form onSubmit={acceptProfessionalInvite} className="bg-card rounded-xl p-4 border border-border">
              <h3 className="font-heading font-semibold text-foreground mb-2 flex items-center gap-2">
                <KeyRound size={16} className="text-primary" />
                Vincular perteneciente con codigo
              </h3>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={professionalInviteCode}
                  onChange={event => setProfessionalInviteCode(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                  placeholder="ABCD-1234"
                  className="font-mono font-semibold tracking-[0.12em]"
                  maxLength={9}
                  autoComplete="one-time-code"
                />
                <Button type="submit" disabled={joiningProfessionalInvite || !professionalInviteCode.trim()} className="gap-2">
                  {joiningProfessionalInvite ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Vincular
                </Button>
              </div>
            </form>
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="font-heading font-semibold text-foreground mb-2">📊 Métricas globales</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-xl font-bold text-foreground">{linkedUsers.length}</p><p className="text-xs text-muted-foreground">Pacientes activos</p></div>
                <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-xl font-bold text-foreground">{linkedUsers.length ? Math.round(linkedUsers.reduce((sum,u) => { const a=activitiesByUser[u.id] || []; return sum + (a.length>0?a.filter(x=>x.status==='completada').length/a.length:0); },0)/linkedUsers.length*100) : 0}%</p><p className="text-xs text-muted-foreground">Adherencia promedio</p></div>
              </div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="font-heading font-semibold text-foreground mb-3">🛠️ Acciones rápidas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    if (canAssignActivities || canCreateCustomActivities) {
                      setTab('create');
                      return;
                    }
                    toast({
                      title: 'Creacion deshabilitada',
                      description: 'El tutor no habilito la creacion o asignacion de actividades para tus vinculos activos.',
                      variant: 'destructive',
                    });
                  }}
                >
                  <ClipboardPlus size={14} className="mr-2" /> Crear actividad personalizada
                </Button>
                <Button variant="outline" className="justify-start"><Calendar size={14} className="mr-2" /> Planificación semanal</Button>
                <Button variant="outline" className="justify-start"><FileText size={14} className="mr-2" /> Notas internas</Button>
                <Button variant="outline" className="justify-start"><BarChart3 size={14} className="mr-2" /> Registro de intervenciones</Button>
              </div>
            </div>
          </div>
        )}

        {tab === 'directory' && (
          <>
            <h2 className="font-heading font-bold text-xl text-foreground">Directorio de profesionales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allProfessionals.map(p => (
                <div key={p.id} className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{p.avatar}</span>
                    <div><p className="font-semibold text-sm text-foreground">{p.name}</p><p className="text-xs text-primary">{p.specialty}</p></div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{p.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3"><span>📍 {p.modality}</span><span>🕐 {p.availability}</span></div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs">Contactar</Button>
                    <Button size="sm" className="flex-1 text-xs gradient-primary text-primary-foreground">Sesión de prueba</Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
