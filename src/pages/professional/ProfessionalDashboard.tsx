import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { deleteProfessionalSession, fetchActivitiesForUser, fetchEmotionRecordsForUser, fetchLinkedPertenecientesForSupportUser, fetchProfessionalSessions, joinProfessionalInviteByCode, updateProfessionalSession, type Activity, type EmotionalRecord, type ProfessionalSession, type User } from '@/data/api';
import { LogOut, CheckCircle2, Heart, Calendar, Target, Users, FileText, BarChart3, TrendingUp, ClipboardPlus, Sparkles, MessageCircle, Bell, X, KeyRound, Loader2, FolderOpen, CalendarClock, Download } from 'lucide-react';
import { buildSessionHistoryCsv } from '@/lib/sessionCsv';
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
import ProfessionalReportsPanel from '@/components/ProfessionalReportsPanel';
import ProfessionalPrivateNote from '@/components/ProfessionalPrivateNote';
import SessionCard from '@/components/SessionCard';
import DriveExplorer from '@/components/DriveExplorer';
import ProfessionalCalendar from '@/components/ProfessionalCalendar';
import ProfessionalProfileSettings from '@/components/ProfessionalProfileSettings';
import UserNotifications from '@/pages/user/UserNotifications';
import { isPermissionEnabled, PROFESIONAL_PERMISSIONS, usePermissionContext } from '@/hooks/usePermissions';
import PermissionBlocked from '@/components/PermissionBlocked';
import AiPictogramStudio from '@/components/AiPictogramStudio';
import { useToast } from '@/components/ui/use-toast';
import { useSyncMobileMenuOpen } from '@/contexts/MobileMenuState';

function nextSessionForPatient(sessions: ProfessionalSession[], pertenecienteId: number | undefined) {
  if (!pertenecienteId) return undefined;
  const now = Date.now();
  return sessions
    .filter(session =>
      Number(session.id_perteneciente) === pertenecienteId
      && session.estado === 'programada'
      && new Date(session.fecha_sesion).getTime() >= now,
    )
    .sort((a, b) => a.fecha_sesion.localeCompare(b.fecha_sesion))[0];
}

export default function ProfessionalDashboard() {
  const { user, logout } = useAuth();
  const { context: permissionContext, refetch: refetchPermissionContext } = usePermissionContext();
  const { toast } = useToast();
  const [tab, setTab] = useState('patients');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [patientTab, setPatientTab] = useState<'overview' | 'stats' | 'sessions'>('overview');
  const [patientNoteSession, setPatientNoteSession] = useState<ProfessionalSession | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useSyncMobileMenuOpen(menuOpen);
  const [linkedUsers, setLinkedUsers] = useState<User[]>([]);
  const [activitiesByUser, setActivitiesByUser] = useState<Record<string, Activity[]>>({});
  const [emotionsByUser, setEmotionsByUser] = useState<Record<string, EmotionalRecord[]>>({});
  const [sessions, setSessions] = useState<ProfessionalSession[]>([]);
  const [patientsError, setPatientsError] = useState<string | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [professionalInviteCode, setProfessionalInviteCode] = useState('');
  const [joiningProfessionalInvite, setJoiningProfessionalInvite] = useState(false);
  const [selectedNotificationChatId, setSelectedNotificationChatId] = useState<string | undefined>();
  const [agendaInitialPatientId, setAgendaInitialPatientId] = useState<number | undefined>();
  const { unreadCount, setUnreadCount } = useUnreadNotifications(
    user && user.role === 'professional' ? { id: String(user.id) } : null
  );

  useEffect(() => {
    if (!user || user.role !== 'professional') return;
    let cancelled = false;
    setLoadingPatients(true);
    fetchProfessionalSessions().then(rows => { if (!cancelled) setSessions(rows); }).catch(() => {});
    Promise.all([
      fetchLinkedPertenecientesForSupportUser(user.id, 'professional'),
    ])
      .then(([patients]) => {
        if (cancelled) return;
        setLinkedUsers(patients);
        Promise.all(
          patients.map(patient =>
            fetchActivitiesForUser(patient.id)
              .then(activities => [patient.id, activities] as const)
              .catch(() => [patient.id, []] as const)
          )
        ).then(entries => {
          if (!cancelled) setActivitiesByUser(Object.fromEntries(entries));
        });
        Promise.all(patients.map(patient => fetchEmotionRecordsForUser(patient.id).then(rows => [patient.id, rows] as const).catch(() => [patient.id, []] as const)))
          .then(entries => { if (!cancelled) setEmotionsByUser(Object.fromEntries(entries)); });
      })
      .catch(() => { if (!cancelled) setPatientsError('No pudimos cargar tus pacientes vinculados.'); })
      .finally(() => {
        if (!cancelled) setLoadingPatients(false);
    });
    return () => { cancelled = true; };
  }, [user]);

  const reloadPatients = async () => {
    if (!user || user.role !== 'professional') return;
    setLoadingPatients(true);
    setPatientsError(null);
    try {
      fetchProfessionalSessions().then(setSessions).catch(() => {});
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
      const emotions = await Promise.all(patients.map(patient => fetchEmotionRecordsForUser(patient.id).then(rows => [patient.id, rows] as const).catch(() => [patient.id, []] as const)));
      setEmotionsByUser(Object.fromEntries(emotions));
    } finally {
      setLoadingPatients(false);
    }
  };

  const reloadSessions = () => fetchProfessionalSessions().then(setSessions).catch(() => {});

  const markSessionCompleted = async (session: ProfessionalSession) => {
    try {
      await updateProfessionalSession(session.id, {
        id_perteneciente: session.id_perteneciente,
        titulo: session.titulo,
        fecha_sesion: session.fecha_sesion,
        duracion_minutos: session.duracion_minutos,
        estado: 'completada',
        motivo_cancelacion: null,
        recordatorios: session.recordatorios,
      });
      await reloadSessions();
      toast({ title: 'Sesion marcada como completada' });
    } catch (err) {
      toast({ title: 'No se pudo actualizar la sesion', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    }
  };

  const deletePatientSession = async (session: ProfessionalSession) => {
    if (!window.confirm('¿Eliminar esta sesion?')) return;
    try {
      await deleteProfessionalSession(session.id);
      await reloadSessions();
    } catch (err) {
      toast({ title: 'No se pudo eliminar la sesion', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
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
    ...(canScheduleSessions ? [{ id: 'calendar', label: 'Calendario', icon: Calendar }] : []),
    { id: 'documents', label: 'Documentos', icon: FolderOpen },
    ...(canAssignActivities || canCreateCustomActivities ? [{ id: 'create', label: 'Crear actividad', icon: Sparkles }] : []),
    ...(canSendMessages ? [{ id: 'chat', label: 'Chat', icon: MessageCircle }] : []),
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'pictograms', label: 'Pictogramas IA', icon: Sparkles },
    { id: 'tools', label: 'Herramientas', icon: ClipboardPlus },
    { id: 'profile', label: 'Mi perfil', icon: FileText },
  ];

  const patientDetail = selectedPatient ? linkedUsers.find(u => u.id === selectedPatient) : null;
  const linkForUser = (userId: string) => vinculosByUsuarioPerteneciente.get(String(userId));
  const patientHasPermission = (userId: string, permission: string, fallback = false) => {
    const link = linkForUser(userId);
    return Boolean(link?.permisos_efectivos.vinculo_aprobado)
      && isPermissionEnabled(link?.permisos_efectivos.permisos, permission, fallback);
  };
  const agendaPatients = linkedUsers
    .filter(patient => patientHasPermission(patient.id, PROFESIONAL_PERMISSIONS.AGENDAR_SESIONES, true))
    .map(patient => ({ ...patient, pertenecienteId: Number(linkForUser(patient.id)?.perteneciente.id) }));
  const activityPatients = linkedUsers.filter(patient => patientHasPermission(patient.id, PROFESIONAL_PERMISSIONS.ASIGNAR_ACTIVIDADES, true));

  const now = Date.now();
  const weekAhead = now + 7 * 24 * 60 * 60 * 1000;
  const sessionsThisWeek = sessions.filter(session => {
    if (session.estado === 'cancelada') return false;
    const time = new Date(session.fecha_sesion).getTime();
    return time >= now && time <= weekAhead;
  }).length;
  const globalCompletadas = sessions.filter(s => s.estado === 'completada').length;
  const globalAusentes = sessions.filter(s => s.estado === 'ausente').length;
  const globalAsistencia = globalCompletadas + globalAusentes > 0
    ? Math.round((globalCompletadas / (globalCompletadas + globalAusentes)) * 100)
    : null;
  const patientsWithoutNextSession = agendaPatients.filter(
    patient => !nextSessionForPatient(sessions, patient.pertenecienteId),
  );
  const pendingCompletionSessions = sessions
    .filter(session => session.estado === 'programada' && new Date(session.fecha_sesion).getTime() < now)
    .sort((a, b) => a.fecha_sesion.localeCompare(b.fecha_sesion));
  const patientByPertenecienteId = new Map(agendaPatients.map(p => [p.pertenecienteId, p]));

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

    setSelectedPatient(null);
    setTab(nextTab === 'calendar' && canScheduleSessions ? 'calendar' : 'patients');
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
            {patientsError && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">{patientsError}</div>}
            {linkedUsers.map(u => {
              const acts = activitiesByUser[u.id] || [];
              const completed = acts.filter(a => a.status === 'completada').length;
              const adherence = acts.length > 0 ? Math.round((completed / acts.length) * 100) : 0;
              const emotions = emotionsByUser[u.id] || [];
              const nextSession = nextSessionForPatient(sessions, Number(linkForUser(u.id)?.perteneciente.id));
              const linkPermissions = vinculosByUsuarioPerteneciente.get(String(u.id))?.permisos_efectivos;
              const canViewPatientHistory = Boolean(permissionContext) && isPermissionEnabled(linkPermissions?.permisos, PROFESIONAL_PERMISSIONS.VER_HISTORIAL, false);

              return (
                <motion.button key={u.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} onClick={() => { setSelectedPatient(u.id); setPatientTab('overview'); }} className="w-full bg-card rounded-xl border border-border overflow-hidden text-left hover:border-primary/30 transition-all">
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
                    <div className="bg-muted/50 rounded-lg p-2 text-center"><p className="text-xs text-muted-foreground">Actividades</p><p className="font-bold text-foreground">{canViewPatientHistory ? `${completed}/${acts.length}` : '-'}</p></div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center"><p className="text-xs text-muted-foreground">Emociones</p><p className="font-bold text-foreground">{canViewPatientHistory ? emotions.length : '-'}</p></div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center"><p className="text-xs text-muted-foreground">Historial</p><p className="font-bold text-foreground text-xs">{canViewPatientHistory ? 'Habilitado' : 'Privado'}</p></div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center"><p className="text-xs text-muted-foreground">Próx. sesión</p><p className="font-bold text-foreground text-xs">{nextSession ? nextSession.fecha_sesion.slice(5, 10) : '-'}</p></div>
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
          const emotions = emotionsByUser[patientDetail.id] || [];
          const patientPermissions = vinculosByUsuarioPerteneciente.get(String(patientDetail.id))?.permisos_efectivos?.permisos;
          const canViewPatientHistory = Boolean(permissionContext) && isPermissionEnabled(patientPermissions, PROFESIONAL_PERMISSIONS.VER_HISTORIAL, false);
          const canSchedulePatient = isPermissionEnabled(patientPermissions, PROFESIONAL_PERMISSIONS.AGENDAR_SESIONES, true);
          const pertenecienteId = Number(linkForUser(patientDetail.id)?.perteneciente.id);
          const patientSessions = sessions
            .filter(session => Number(session.id_perteneciente) === pertenecienteId)
            .sort((a, b) => b.fecha_sesion.localeCompare(a.fecha_sesion));
          const patientCompletadas = patientSessions.filter(s => s.estado === 'completada').length;
          const patientAusentes = patientSessions.filter(s => s.estado === 'ausente').length;
          const patientAsistencia = patientCompletadas + patientAusentes > 0
            ? Math.round((patientCompletadas / (patientCompletadas + patientAusentes)) * 100)
            : null;
          return (
            <div className="space-y-4">
              <button onClick={() => { setSelectedPatient(null); setPatientTab('overview'); setPatientNoteSession(null); }} className="text-sm text-primary font-medium">← Volver a pacientes</button>
              {!canViewPatientHistory && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  El tutor deshabilito ver historial para este perteneciente.
                </div>
              )}
              <div className="flex gap-2 overflow-x-auto">
                {([
                  { id: 'overview', label: 'Resumen', icon: BarChart3 },
                  { id: 'stats', label: 'Estadísticas', icon: TrendingUp },
                  { id: 'sessions', label: 'Sesiones', icon: CalendarClock },
                ] as const).map(t => (
                  <button key={t.id} onClick={() => { setPatientTab(t.id); setPatientNoteSession(null); }} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${patientTab === t.id ? 'gradient-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
                    <t.icon size={14} /> {t.label}
                  </button>
                ))}
              </div>

              {patientTab === 'sessions' && (
                patientNoteSession ? (
                  <div className="space-y-4">
                    <Button variant="ghost" onClick={() => setPatientNoteSession(null)}>← Volver a sesiones</Button>
                    <ProfessionalPrivateNote session={patientNoteSession} patientName={patientDetail.name} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patientSessions.length > 0 && (
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const blob = new Blob([buildSessionHistoryCsv(patientSessions)], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `sesiones-${patientDetail.name.replace(/\s+/g, '-').toLowerCase()}.csv`;
                            link.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <Download size={13} className="mr-1" /> Exportar CSV
                        </Button>
                      </div>
                    )}
                    {patientAsistencia !== null && (
                      <div className="rounded-xl border bg-muted/30 p-3 text-center">
                        <p className="text-lg font-bold">{patientAsistencia}%</p>
                        <p className="text-xs text-muted-foreground">Asistencia ({patientCompletadas} completadas / {patientAusentes} ausencias)</p>
                      </div>
                    )}
                    {patientSessions.length === 0 && (
                      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                        Todavia no hay sesiones agendadas con este paciente.
                      </div>
                    )}
                    {patientSessions.map(session => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        patientName={patientDetail.name}
                        onOpenNote={() => setPatientNoteSession(session)}
                        onEdit={() => {
                          setAgendaInitialPatientId(pertenecienteId || undefined);
                          setSelectedPatient(null);
                          setTab('agenda');
                        }}
                        onDelete={() => deletePatientSession(session)}
                      />
                    ))}
                  </div>
                )
              )}

              {patientTab === 'stats' && canViewPatientHistory && <AdvancedStats user={patientDetail} activities={acts} emotions={emotions} />}
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

              <div className="flex gap-2">
                {canSchedulePatient && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setAgendaInitialPatientId(Number(linkForUser(patientDetail.id)?.perteneciente.id) || undefined);
                      setSelectedPatient(null);
                      setTab('agenda');
                    }}
                  >
                    <Calendar size={14} className="mr-1" /> Proponer sesión
                  </Button>
                )}
              </div>
              </>)}
            </div>
          );
        })()}

        {tab === 'create' && (canAssignActivities || canCreateCustomActivities) && <ActivityManager assignableUsers={activityPatients} />}
        {tab === 'create' && !(canAssignActivities || canCreateCustomActivities) && (
          <PermissionBlocked
            title="Creacion de actividades deshabilitada"
            description="El tutor no habilito la creacion o asignacion de actividades para tus vinculos activos."
          />
        )}

        {tab === 'agenda' && canScheduleSessions && (
          <ProfessionalAgenda patients={agendaPatients} initialPatientId={agendaInitialPatientId} />
        )}
        {tab === 'calendar' && canScheduleSessions && (
          <ProfessionalCalendar patients={agendaPatients} onOpenAgenda={() => setTab('agenda')} />
        )}
        {tab === 'documents' && <DriveExplorer />}
        {tab === 'pictograms' && <AiPictogramStudio />}
        {tab === 'profile' && <ProfessionalProfileSettings />}

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
                <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-xl font-bold text-foreground">{sessionsThisWeek}</p><p className="text-xs text-muted-foreground">Sesiones esta semana</p></div>
                <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-xl font-bold text-foreground">{globalAsistencia !== null ? `${globalAsistencia}%` : '-'}</p><p className="text-xs text-muted-foreground">Asistencia global</p></div>
              </div>
            </div>

            {patientsWithoutNextSession.length > 0 && (
              <div className="bg-card rounded-xl p-4 border border-border">
                <h3 className="font-heading font-semibold text-foreground mb-3">📅 Pacientes sin próxima sesión ({patientsWithoutNextSession.length})</h3>
                <div className="space-y-2">
                  {patientsWithoutNextSession.map(patient => (
                    <div key={patient.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 p-2">
                      <span className="text-sm font-medium truncate">{patient.name}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAgendaInitialPatientId(patient.pertenecienteId);
                          setTab('agenda');
                        }}
                      >
                        <Calendar size={13} className="mr-1" /> Proponer sesión
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingCompletionSessions.length > 0 && (
              <div className="bg-card rounded-xl p-4 border border-border">
                <h3 className="font-heading font-semibold text-foreground mb-3">⏳ Sesiones pasadas sin marcar ({pendingCompletionSessions.length})</h3>
                <div className="space-y-2">
                  {pendingCompletionSessions.map(session => (
                    <div key={session.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 p-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {patientByPertenecienteId.get(Number(session.id_perteneciente))?.name || 'Paciente'}
                        </p>
                        <p className="text-xs text-muted-foreground">{session.titulo} · {session.fecha_sesion.slice(0, 10)}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => markSessionCompleted(session)}>
                        <CheckCircle2 size={13} className="mr-1" /> Marcar completada
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              </div>
            </div>

            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="font-heading font-semibold text-foreground mb-3">📄 Reportes</h3>
              <ProfessionalReportsPanel patients={agendaPatients} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
