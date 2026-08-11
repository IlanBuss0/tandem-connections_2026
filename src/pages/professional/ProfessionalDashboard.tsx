import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  askAboutPatient, deleteProfessionalSession, downloadPatientHistoryPdf, fetchActivitiesForUser,
  fetchEmotionRecordsForUser, fetchLinkedPertenecientesForSupportUser, fetchPersonalNotesForUser, fetchPrivateProfessionalNote,
  fetchProfessionalSessions, joinProfessionalInviteByCode, prepareSessionSummary, updateProfessionalSession,
  type Activity, type EmotionalRecord, type PersonalNote, type ProfessionalSession, type SessionPrepSummary, type User,
} from '@/data/api';
import { withGoogleToken } from '@/lib/googleAuth';
import { getDocPlainText } from '@/lib/googleDocs';
import { CheckCircle2, Calendar, Home, Target, Users, FileText, BarChart3, TrendingUp, ClipboardPlus, Sparkles, MessageCircle, Bell, KeyRound, Loader2, FolderOpen, CalendarClock, Download, Send, Info, Image, ShieldCheck, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import ActivityManager from '@/components/ActivityManager';
import AdvancedStats from '@/components/AdvancedStats';
import ProfessionalPatientOverview from '@/components/ProfessionalPatientOverview';
import ChatScreen from '@/components/ChatScreen';
import { ChatProvider } from '@/contexts/ChatContext';
import AppHeader from '@/components/AppHeader';
import HeaderUserAvatar from '@/components/HeaderUserAvatar';
import NotificationBellButton, { useUnreadNotifications } from '@/components/NotificationBellButton';
import ProfessionalReportsPanel from '@/components/ProfessionalReportsPanel';
import ProfessionalPrivateNote from '@/components/ProfessionalPrivateNote';
import SessionCard from '@/components/SessionCard';
import SessionSeriesFolder from '@/components/SessionSeriesFolder';
import DriveExplorer from '@/components/DriveExplorer';
import ProfessionalCalendar from '@/components/ProfessionalCalendar';
import ProfessionalHome from '@/components/ProfessionalHome';
import ProfessionalProfileSettings from '@/components/ProfessionalProfileSettings';
import UserNotifications from '@/pages/user/UserNotifications';
import { isPermissionEnabled, PROFESIONAL_PERMISSIONS, usePermissionContext } from '@/hooks/usePermissions';
import PermissionBlocked from '@/components/PermissionBlocked';
import AiPictogramStudio from '@/components/AiPictogramStudio';
import AboutTandem from '@/pages/AboutTandem';
import UserPictograms from '@/pages/user/UserPictograms';
import { useToast } from '@/components/ui/use-toast';
import { useSyncMobileMenuOpen } from '@/contexts/MobileMenuState';
import BelongingMobileBottomNav, { type MobileDestination } from '@/components/belonging/BelongingMobileBottomNav';
import { ProfessionalDrawer, ProfessionalProfileDrawer, ProfessionalQuickMenu, type ProfessionalTab, type ProfessionalQuickAction } from '@/components/professional/ProfessionalNavigation';
import { useProfessionalNavigation } from '@/hooks/useProfessionalNavigation';

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
  const { tab, patientId: routePatientId, chatId: routeChatId, navigate: navigateRoute, goBack } = useProfessionalNavigation();
  const [selectedPatient, setSelectedPatient] = useState<string | null>(routePatientId);
  const [patientTab, setPatientTab] = useState<'overview' | 'stats' | 'sessions'>('overview');
  const [patientNoteSession, setPatientNoteSession] = useState<ProfessionalSession | null>(null);
  const [prepSession, setPrepSession] = useState<ProfessionalSession | null>(null);
  const [prepLoading, setPrepLoading] = useState(false);
  const [prepResult, setPrepResult] = useState<SessionPrepSummary | null>(null);
  const [prepError, setPrepError] = useState<string | null>(null);
  const [downloadingPatientPdf, setDownloadingPatientPdf] = useState(false);
  const [askQuestion, setAskQuestion] = useState('');
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  useSyncMobileMenuOpen(menuOpen || profileOpen || quickOpen);
  useEffect(() => { setSelectedPatient(routePatientId); setSelectedNotificationChatId(routeChatId); }, [routePatientId, routeChatId]);
  const [linkedUsers, setLinkedUsers] = useState<User[]>([]);
  const [activitiesByUser, setActivitiesByUser] = useState<Record<string, Activity[]>>({});
  const [emotionsByUser, setEmotionsByUser] = useState<Record<string, EmotionalRecord[]>>({});
  const [notesByUser, setNotesByUser] = useState<Record<string, PersonalNote[]>>({});
  const [sessions, setSessions] = useState<ProfessionalSession[]>([]);
  const [patientsError, setPatientsError] = useState<string | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [professionalInviteCode, setProfessionalInviteCode] = useState('');
  const [joiningProfessionalInvite, setJoiningProfessionalInvite] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
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
        Promise.all(patients.map(patient => fetchPersonalNotesForUser(patient.id).then(rows => [patient.id, rows] as const).catch(() => [patient.id, []] as const)))
          .then(entries => { if (!cancelled) setNotesByUser(Object.fromEntries(entries)); });
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
      const notes = await Promise.all(patients.map(patient => fetchPersonalNotesForUser(patient.id).then(rows => [patient.id, rows] as const).catch(() => [patient.id, []] as const)));
      setNotesByUser(Object.fromEntries(notes));
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

  const navigationPermissions = { sessions: canScheduleSessions, activities: canAssignActivities || canCreateCustomActivities, chat: canSendMessages };
  const mobileDestinations: readonly MobileDestination[] = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'patients', label: 'Pacientes', icon: Users },
    { id: 'chat', label: 'Chats', icon: MessageCircle },
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
  const visiblePatients = linkedUsers.filter(patient => patient.name.toLocaleLowerCase('es').includes(patientSearch.trim().toLocaleLowerCase('es')));

  const navigateFromNotification = (nextTab: string, params?: Record<string, any>) => {
    const sourceUserId = params?.sourceUserId ? String(params.sourceUserId) : null;
    const linkedPatient = sourceUserId && linkedUsers.some(item => String(item.id) === sourceUserId)
      ? sourceUserId
      : null;

    if (nextTab === 'chat' && canSendMessages) {
      setSelectedNotificationChatId(params?.chatId ? String(params.chatId) : undefined);
      setSelectedPatient(null);
      navigateRoute('chat', params?.chatId ? { chatId: String(params.chatId) } : undefined);
      return;
    }

    if (linkedPatient) {
      setSelectedPatient(linkedPatient);
      setPatientTab(nextTab === 'activities' ? 'stats' : 'overview');
      navigateRoute('patients', { patientId: linkedPatient });
      return;
    }

    setSelectedPatient(null);
    navigateRoute(nextTab === 'calendar' && canScheduleSessions ? 'calendar' : 'patients');
  };

  const navigate = (next: ProfessionalTab) => {
    navigateRoute(next); setSelectedPatient(null); setMenuOpen(false); setProfileOpen(false); setQuickOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  const openPatient = (userId: string) => {
    navigateRoute('patients', { patientId: userId }); setSelectedPatient(userId); setPatientTab('overview'); setMenuOpen(false); setProfileOpen(false); setQuickOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  const professionalPageTitle = selectedPatient && patientDetail ? patientDetail.name : ({ home: 'Inicio', calendar: 'Calendario', patients: 'Pacientes', chat: 'Chats', notifications: 'Notificaciones', documents: 'Documentos y notas', create: 'Actividades', resources: 'Recursos y herramientas', reports: 'Reportes', tools: 'Herramientas', profile: 'Perfil', about: 'Acerca de TÁNDEM', pictograms: 'Pictograma IA', pictogramCatalog: 'Pictogramas' } satisfies Record<ProfessionalTab, string>)[tab];

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[radial-gradient(circle_at_88%_4%,rgba(220,203,245,0.42),transparent_24rem),linear-gradient(180deg,#fbf9ff_0%,#f8f7fc_100%)] pb-24 lg:pb-0">
      <a href="#professional-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Saltar al contenido</a>
      <AppHeader
        onMenuClick={() => setMenuOpen(true)}
        onLogoClick={() => navigate('home')}
        onBack={tab !== 'home' ? () => { if (selectedPatient) { goBack('patients'); } else { goBack('home'); } } : undefined}
        mobileBackOnly
        contextTitle={professionalPageTitle}
        menuButtonClassName="invisible pointer-events-none lg:visible lg:pointer-events-auto"
        rightSlot={
          <div className="flex items-center gap-2"><NotificationBellButton count={unreadCount} onClick={() => navigate('notifications')} className="border-0 bg-transparent" /><button type="button" onClick={() => setProfileOpen(true)} aria-label="Abrir perfil profesional" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><HeaderUserAvatar avatar={user.avatar} name={user.name} /></button></div>
        }
      />

      <ProfessionalDrawer open={menuOpen} active={tab} permissions={navigationPermissions} onClose={() => setMenuOpen(false)} onNavigate={navigate} onLogout={logout} />
      <ProfessionalProfileDrawer open={profileOpen} active={tab} user={user} permissions={navigationPermissions} onClose={() => setProfileOpen(false)} onNavigate={navigate} onLogout={logout} />

      <main id="professional-main" tabIndex={-1} className="mx-auto w-full max-w-[1280px] space-y-5 px-4 py-6 max-lg:pb-28 sm:px-6 lg:px-8 lg:py-9">
        {tab === 'home' && loadingPatients && <ProfessionalHomeSkeleton />}
        {tab === 'home' && !loadingPatients && patientsError && <div role="alert" className="rounded-3xl border border-destructive/20 bg-white p-6 text-sm text-destructive shadow-sm">{patientsError}<Button type="button" variant="outline" className="ml-3" onClick={reloadPatients}>Reintentar</Button></div>}
        {tab === 'home' && !loadingPatients && !patientsError && <ProfessionalHome professionalName={user.name} patients={linkedUsers} sessions={sessions} activitiesByUser={activitiesByUser} emotionsByUser={emotionsByUser} notesByUser={notesByUser} patientPertenecienteIds={Object.fromEntries(linkedUsers.map(patient => [patient.id, Number(linkForUser(patient.id)?.perteneciente.id)]))} onNavigate={navigate} onOpenPatient={openPatient} />}
        {tab === 'chat' && canSendMessages && (
          <ChatProvider>
            <ChatScreen
              key={selectedNotificationChatId ? `chat-${selectedNotificationChatId}` : 'chat'}
              defaultSelectedId={selectedNotificationChatId}
            />
          </ChatProvider>
        )}
        {tab === 'chat' && !canSendMessages && <PermissionBlocked title="Chat deshabilitado" description="No tenés permisos activos para enviar mensajes en tus vínculos profesionales." />}
        {tab === 'notifications' && (
          <UserNotifications onUnreadCountChange={setUnreadCount} onNavigate={navigateFromNotification} />
        )}
        {tab === 'patients' && !selectedPatient && (
          <>
            <header><h1 className="font-heading text-3xl font-bold text-foreground">Pacientes</h1><p className="mt-2 text-sm text-muted-foreground">Consultá tus vínculos sin cambiar el contexto general de la aplicación.</p></header>
            <div className="flex flex-col gap-3 rounded-3xl border border-white/80 bg-white/85 p-4 shadow-sm sm:flex-row sm:items-center"><label htmlFor="professional-patient-search" className="sr-only">Buscar paciente</label><Input id="professional-patient-search" type="search" value={patientSearch} onChange={event => setPatientSearch(event.target.value)} placeholder="Buscar por nombre" className="min-h-11 flex-1" /><span className="text-sm font-semibold text-muted-foreground">{visiblePatients.length} de {linkedUsers.length}</span><Button type="button" variant="outline" onClick={() => navigate('tools')} className="min-h-11"><KeyRound size={16} className="mr-2" aria-hidden />Vincular paciente</Button></div>
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
            <div className="grid gap-3 xl:grid-cols-2">{visiblePatients.map(u => {
              const acts = activitiesByUser[u.id] || [];
              const completed = acts.filter(a => a.status === 'completada').length;
              const adherence = acts.length > 0 ? Math.round((completed / acts.length) * 100) : 0;
              const emotions = emotionsByUser[u.id] || [];
              const nextSession = nextSessionForPatient(sessions, Number(linkForUser(u.id)?.perteneciente.id));
              const linkPermissions = vinculosByUsuarioPerteneciente.get(String(u.id))?.permisos_efectivos;
              const canViewPatientHistory = Boolean(permissionContext) && isPermissionEnabled(linkPermissions?.permisos, PROFESIONAL_PERMISSIONS.VER_HISTORIAL, false);

              return (
                <motion.button key={u.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} onClick={() => { setSelectedPatient(u.id); setPatientTab('overview'); }} className="w-full overflow-hidden rounded-3xl border border-border/80 bg-card text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
            })}</div>
          </>
        )}

        {tab === 'patients' && selectedPatient && patientDetail && (() => {
          const acts = activitiesByUser[patientDetail.id] || [];
          const emotions = emotionsByUser[patientDetail.id] || [];
          const patientPermissions = vinculosByUsuarioPerteneciente.get(String(patientDetail.id))?.permisos_efectivos?.permisos;
          const canViewPatientHistory = Boolean(permissionContext) && isPermissionEnabled(patientPermissions, PROFESIONAL_PERMISSIONS.VER_HISTORIAL, false);
          const canSchedulePatient = isPermissionEnabled(patientPermissions, PROFESIONAL_PERMISSIONS.AGENDAR_SESIONES, true);
          const pertenecienteId = Number(linkForUser(patientDetail.id)?.perteneciente.id);
          const patientSessions = sessions
            .filter(session => Number(session.id_perteneciente) === pertenecienteId)
            .sort((a, b) => b.fecha_sesion.localeCompare(a.fecha_sesion));
          const patientSessionSeries = Array.from(
            patientSessions.reduce((groups, session) => {
              if (!session.recurrence_group_id) return groups;
              const group = groups.get(session.recurrence_group_id) || [];
              group.push(session);
              groups.set(session.recurrence_group_id, group);
              return groups;
            }, new Map<string, ProfessionalSession[]>()),
            ([groupId, groupedSessions]) => ({
              groupId,
              sessions: groupedSessions.sort((a, b) => a.fecha_sesion.localeCompare(b.fecha_sesion)),
            }),
          ).sort((a, b) => b.sessions[0].fecha_sesion.localeCompare(a.sessions[0].fecha_sesion));
          const standalonePatientSessions = patientSessions.filter(session => !session.recurrence_group_id);
          const patientCompletadas = patientSessions.filter(s => s.estado === 'completada').length;
          const patientAusentes = patientSessions.filter(s => s.estado === 'ausente').length;
          const patientAsistencia = patientCompletadas + patientAusentes > 0
            ? Math.round((patientCompletadas / (patientCompletadas + patientAusentes)) * 100)
            : null;
          const nextPatientSession = nextSessionForPatient(sessions, pertenecienteId);
          const patientSupportLevel = patientDetail.supportLevel || 'Sin registrar';
          const patientAutonomy = (patientDetail as User & { autonomy?: string }).autonomy || 'Sin registrar';

          const gatherNotesFor = async (candidatas: ProfessionalSession[]) => {
            return Promise.all(
              candidatas.map(async (s) => {
                let notasTexto: string | undefined;
                try {
                  const note = await fetchPrivateProfessionalNote(s.id);
                  const fileId = note?.documento_drive?.google_file_id;
                  if (fileId) {
                    notasTexto = await withGoogleToken((token) => getDocPlainText(token, fileId));
                  }
                } catch {
                  // si falla la lectura de un doc puntual, seguimos sin su texto
                }
                return { id: s.id, fecha_sesion: s.fecha_sesion, titulo: s.titulo, estado: s.estado, notas_texto: notasTexto };
              }),
            );
          };

          const runPrepareSession = async (session: ProfessionalSession) => {
            setPrepSession(session);
            setPrepLoading(true);
            setPrepError(null);
            setPrepResult(null);
            try {
              const pastWithNotes = patientSessions
                .filter(s => s.estado !== 'programada' && s.has_note)
                .sort((a, b) => b.fecha_sesion.localeCompare(a.fecha_sesion))
                .slice(0, 3);
              if (pastWithNotes.length === 0) {
                setPrepError('No hay sesiones pasadas con notas para este paciente todavía.');
                return;
              }
              const sesionesPayload = await gatherNotesFor(pastWithNotes);
              const prep = await prepareSessionSummary({
                id_perteneciente: pertenecienteId,
                sesion_objetivo: { titulo: session.titulo, fecha_sesion: session.fecha_sesion },
                sesiones_pasadas: sesionesPayload,
              });
              setPrepResult(prep);
            } catch (err) {
              setPrepError(err instanceof Error ? err.message : 'No se pudo generar la preparación.');
            } finally {
              setPrepLoading(false);
            }
          };

          const runAskQuestion = async () => {
            if (!askQuestion.trim()) return;
            setAskLoading(true);
            setAskError(null);
            setAskAnswer(null);
            try {
              const withNotes = patientSessions
                .filter(s => s.has_note)
                .slice(0, 6);
              if (withNotes.length === 0) {
                setAskError('Este paciente todavía no tiene sesiones con notas para consultar.');
                return;
              }
              const sesionesPayload = await gatherNotesFor(withNotes);
              const { respuesta } = await askAboutPatient({
                id_perteneciente: pertenecienteId,
                pregunta: askQuestion.trim(),
                sesiones: sesionesPayload,
              });
              setAskAnswer(respuesta);
            } catch (err) {
              setAskError(err instanceof Error ? err.message : 'No se pudo responder la pregunta.');
            } finally {
              setAskLoading(false);
            }
          };

          const downloadPatientPdf = async () => {
            setDownloadingPatientPdf(true);
            try {
              const blob = await downloadPatientHistoryPdf(pertenecienteId);
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `historial-${patientDetail.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
              link.click();
              URL.revokeObjectURL(url);
            } catch (err) {
              toast({
                title: 'No se pudo generar el PDF',
                description: err instanceof Error ? err.message : undefined,
                variant: 'destructive',
              });
            } finally {
              setDownloadingPatientPdf(false);
            }
          };

          return (
            <div className="space-y-5 pb-24 lg:pb-6">
              <button onClick={() => { setSelectedPatient(null); setPatientTab('overview'); setPatientNoteSession(null); }} className="inline-flex min-h-10 items-center rounded-lg border border-primary/20 bg-white px-4 text-sm font-semibold text-primary shadow-sm">← Volver a pacientes</button>
              <section className="flex flex-col gap-4 border-b border-border/70 pb-4 lg:flex-row lg:items-center max-lg:rounded-[26px] max-lg:border max-lg:border-white/80 max-lg:bg-white/80 max-lg:p-4 max-lg:shadow-sm">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-violet-50 text-4xl shadow-md max-sm:h-16 max-sm:w-16 max-sm:text-3xl">
                    {patientDetail.avatar && /^(https?:|data:image\/|\/|\.\/|\.\.\/)/.test(patientDetail.avatar) ? <img src={patientDetail.avatar} alt="" className="h-full w-full object-cover" /> : patientDetail.avatar}
                  </span>
                  <div className="min-w-0"><h1 className="truncate text-2xl font-bold text-[#302444] sm:text-3xl">{patientDetail.name}</h1><p className="text-sm text-muted-foreground">{patientDetail.age ? `${patientDetail.age} años` : 'Edad sin registrar'}</p></div>
                </div>
                <div className="flex flex-wrap gap-2 lg:ml-4 max-sm:grid max-sm:grid-cols-2">
                  <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50/60 px-3 text-xs font-semibold text-violet-700 max-sm:px-2"><ShieldCheck size={16} className="shrink-0" />Apoyo {patientSupportLevel}</span>
                  <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-3 text-xs font-semibold text-amber-700 max-sm:px-2"><Users size={16} className="shrink-0" />Autonomía {patientAutonomy}</span>
                  <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 text-xs font-semibold text-emerald-700 max-sm:col-span-2 max-sm:px-2"><Link2 size={16} className="shrink-0" />Vínculo activo</span>
                </div>
                {nextPatientSession && <div className="rounded-xl border bg-white p-3 shadow-sm lg:ml-auto lg:min-w-52 max-lg:w-full"><p className="flex items-center gap-2 text-xs font-bold text-[#302444]"><CalendarClock size={17} className="text-violet-600" />Próxima sesión</p><p className="mt-1 pl-6 text-xs text-muted-foreground">{new Date(nextPatientSession.fecha_sesion).toLocaleString('es-AR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p></div>}
              </section>
              {!canViewPatientHistory && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  El tutor deshabilito ver historial para este perteneciente.
                </div>
              )}
              <div className="flex gap-1 overflow-x-auto border-b border-border/70 max-lg:sticky max-lg:top-16 max-lg:z-30 max-lg:-mx-4 max-lg:bg-[#faf8fe]/95 max-lg:px-4 max-lg:backdrop-blur sm:max-lg:-mx-6 sm:max-lg:px-6">
                {([
                  { id: 'overview', label: 'Resumen', icon: BarChart3 },
                  { id: 'stats', label: 'Estadísticas', icon: TrendingUp },
                  { id: 'sessions', label: 'Sesiones', icon: CalendarClock },
                ] as const).map(t => (
                  <button key={t.id} onClick={() => { setPatientTab(t.id); setPatientNoteSession(null); }} className={`flex min-h-12 min-w-28 flex-1 items-center justify-center gap-1.5 border-b-2 px-4 py-2 text-sm font-semibold transition max-sm:min-w-[104px] max-sm:px-2 ${patientTab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
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
                    <div className="grid gap-3 rounded-2xl border border-[#ebe7f2] bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto] max-sm:rounded-[22px]">
                        {canSchedulePatient && <Button onClick={() => { setAgendaInitialPatientId(pertenecienteId || undefined); setSelectedPatient(null); navigate('calendar'); }} className="min-h-11">+ Programar sesión</Button>}
                        <Button variant="outline" onClick={downloadPatientPdf} disabled={downloadingPatientPdf || patientSessions.length === 0} className="min-h-11">
                          {downloadingPatientPdf ? <Loader2 size={13} className="mr-1 animate-spin" /> : <Download size={13} className="mr-1" />}
                          Historial (PDF)
                        </Button>
                        <div className="rounded-xl bg-violet-50 px-5 py-2 text-center text-violet-700"><p className="text-lg font-bold">{patientAsistencia === null ? '—' : `${patientAsistencia}%`}</p><p className="text-[10px]">de asistencia</p></div>
                    </div>
                    {nextPatientSession && <section className="grid gap-4 rounded-2xl border border-[#ebe7f2] bg-white p-5 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center max-sm:rounded-[22px] max-sm:p-4"><div className="flex gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600"><CalendarClock /></span><div><p className="text-xs font-bold text-violet-600">Próxima sesión</p><h3 className="text-xl font-bold text-[#302444] max-sm:text-lg">{new Date(nextPatientSession.fecha_sesion).toLocaleString('es-AR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</h3><p className="text-sm text-muted-foreground">{nextPatientSession.titulo} · {nextPatientSession.duracion_minutos} minutos</p></div></div><Button onClick={() => runPrepareSession(nextPatientSession)} className="min-h-11 max-sm:w-full"><Sparkles size={15} className="mr-2" />Preparar con IA</Button></section>}
                    {patientSessions.length === 0 && (
                      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                        Todavia no hay sesiones agendadas con este paciente.
                      </div>
                    )}
                    <section className="rounded-2xl border border-[#ebe7f2] bg-white p-4 shadow-sm"><h3 className="mb-1 font-bold text-[#302444]">Historial de sesiones</h3><p className="mb-4 text-xs text-muted-foreground">Las sesiones recurrentes se agrupan por serie. Abrí una carpeta para consultar sus sesiones y notas.</p><div className="space-y-2">{patientSessionSeries.map(({ groupId, sessions: groupedSessions }) => (
                      <SessionSeriesFolder
                        key={groupId}
                        groupId={groupId}
                        sessions={groupedSessions}
                        patientName={patientDetail.name}
                        onOpenNote={setPatientNoteSession}
                        onEditSession={() => {
                          setAgendaInitialPatientId(pertenecienteId || undefined);
                          setSelectedPatient(null);
                          navigate('calendar');
                        }}
                        onDeleteSession={deletePatientSession}
                        onSeriesChanged={reloadSessions}
                        compact
                      />
                    ))}{standalonePatientSessions.map(session => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        patientName={patientDetail.name}
                        onOpenNote={() => setPatientNoteSession(session)}
                        onEdit={() => {
                          setAgendaInitialPatientId(pertenecienteId || undefined);
                          setSelectedPatient(null);
                          navigate('calendar');
                        }}
                        onDelete={() => deletePatientSession(session)}
                        onPrepare={session.estado === 'programada' ? () => runPrepareSession(session) : undefined}
                      />
                    ))}</div></section>
                    {patientSessions.some(s => s.has_note) && <section className="rounded-2xl border border-[#ebe7f2] bg-white p-4 shadow-sm"><p className="mb-3 flex items-center gap-2 text-sm font-semibold"><Sparkles size={16} className="text-primary" />Preguntale a la IA sobre este perteneciente</p><div className="flex flex-col gap-2 sm:flex-row"><Input value={askQuestion} onChange={e => setAskQuestion(e.target.value)} placeholder="¿Cómo evolucionó el uso de apoyos visuales?" onKeyDown={e => e.key === 'Enter' && runAskQuestion()} /><Button onClick={runAskQuestion} disabled={askLoading || !askQuestion.trim()}>{askLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} className="mr-2" />}Consultar</Button></div>{askError && <p className="mt-2 text-xs text-destructive">{askError}</p>}{askAnswer && <p className="mt-3 whitespace-pre-wrap border-t pt-3 text-sm">{askAnswer}</p>}<p className="mt-2 text-[11px] text-muted-foreground">La respuesta utiliza únicamente las sesiones y notas a las que tenés acceso.</p></section>}
                  </div>
                )
              )}

              <Dialog open={Boolean(prepSession)} onOpenChange={(open) => !open && setPrepSession(null)}>
                <DialogContent className="sm:max-w-lg max-lg:bottom-0 max-lg:left-0 max-lg:top-auto max-lg:max-h-[88dvh] max-lg:w-full max-lg:max-w-none max-lg:translate-x-0 max-lg:translate-y-0 max-lg:overflow-y-auto max-lg:rounded-b-none max-lg:rounded-t-[28px] max-lg:p-5">
                  <DialogHeader>
                    <DialogTitle>Preparación — {prepSession?.titulo}</DialogTitle>
                  </DialogHeader>
                  {prepLoading && (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                      <Loader2 size={16} className="animate-spin" /> Generando preparación con IA…
                    </div>
                  )}
                  {prepError && !prepLoading && (
                    <p className="text-sm text-destructive">{prepError}</p>
                  )}
                  {prepResult && !prepLoading && (
                    <Textarea readOnly value={prepResult.contenido} className="min-h-[280px] text-sm" />
                  )}
                  <Button variant="outline" onClick={() => setPrepSession(null)}>Cerrar</Button>
                </DialogContent>
              </Dialog>

              {patientTab === 'stats' && canViewPatientHistory && <AdvancedStats user={patientDetail} activities={acts} emotions={emotions} sessions={patientSessions} />}
              {patientTab === 'overview' && canViewPatientHistory && <ProfessionalPatientOverview user={patientDetail} emotions={emotions} sessions={patientSessions} supportLevel={patientSupportLevel} autonomy={patientAutonomy} />}
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

        {tab === 'calendar' && canScheduleSessions && (
          <ProfessionalCalendar patients={agendaPatients} initialPatientId={agendaInitialPatientId} />
        )}
        {tab === 'calendar' && !canScheduleSessions && (
          <PermissionBlocked title="Calendario deshabilitado" description="No tenés permisos activos para gestionar sesiones con tus pacientes vinculados." />
        )}
        {tab === 'documents' && <ProfessionalDocumentsArea onOpenPatients={() => navigate('patients')} />}
        {tab === 'reports' && <ProfessionalReportsPanel patients={agendaPatients} />}
        {tab === 'resources' && <ProfessionalResourceHub onNavigate={navigate} />}
        {tab === 'pictograms' && <AiPictogramStudio />}
        {tab === 'pictogramCatalog' && <UserPictograms />}
        {tab === 'profile' && <ProfessionalProfileSettings />}
        {tab === 'about' && <AboutTandem />}

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
                          navigate('calendar');
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
                      navigate('create');
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

      </main>
      <BelongingMobileBottomNav activeTab={tab} onNavigate={(next) => navigate(next as ProfessionalTab)} destinations={mobileDestinations} forceExpanded={quickOpen} center={(compactProgress) => <ProfessionalQuickMenu open={quickOpen} onOpenChange={setQuickOpen} compactProgress={compactProgress} permissions={navigationPermissions} onAction={(action: ProfessionalQuickAction) => {
        if (action === 'session') { setAgendaInitialPatientId(undefined); navigate('calendar'); }
        if (action === 'note') { navigate('patients'); toast({ title: 'Elegí una sesión', description: 'La nota clínica se guarda dentro de la sesión del paciente correspondiente.' }); }
        if (action === 'activity') navigate('create');
        if (action === 'pictogram') navigate('pictograms');
      }} />}/>
    </div>
  );
}

function ProfessionalResourceHub({ onNavigate }: { onNavigate: (tab: ProfessionalTab) => void }) {
  const areas = [
    { id: 'pictograms' as const, title: 'Crear pictograma con IA', text: 'Generá apoyos visuales a partir de una idea.', icon: Sparkles },
    { id: 'pictogramCatalog' as const, title: 'Explorar pictogramas', text: 'Buscá recursos visuales por categorías y temas.', icon: Image },
    { id: 'tools' as const, title: 'Herramientas profesionales', text: 'Vínculos, métricas y seguimiento operativo.', icon: ClipboardPlus },
  ];
  return <div className="space-y-5"><header><h1 className="font-heading text-3xl font-bold">Recursos y herramientas</h1><p className="mt-2 text-sm text-muted-foreground sm:text-base">Materiales visuales y utilidades para tu práctica.</p></header><div className="grid gap-4 md:grid-cols-3">{areas.map(area => <button key={area.id} type="button" onClick={() => onNavigate(area.id)} className="min-h-44 rounded-[26px] border border-white/80 bg-white/90 p-5 text-left shadow-[0_12px_36px_rgba(70,45,96,.075)] transition hover:-translate-y-0.5 hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><area.icon size={22} aria-hidden /></span><h2 className="mt-4 font-bold">{area.title}</h2><p className="mt-1 text-sm text-muted-foreground">{area.text}</p></button>)}</div></div>;
}

function ProfessionalHomeSkeleton() {
  return <div aria-label="Cargando inicio profesional" aria-busy="true" className="space-y-6">
    <div className="space-y-3"><div className="h-10 w-64 animate-pulse rounded-xl bg-primary/10" /><div className="h-5 w-full max-w-lg animate-pulse rounded-lg bg-primary/5" /></div>
    <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-48 animate-pulse rounded-[28px] border border-white/80 bg-white/80 shadow-sm" />)}</div>
    <div className="grid gap-5 xl:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-[26px] border border-white/80 bg-white/80 shadow-sm" />)}</div>
  </div>;
}

function ProfessionalDocumentsArea({ onOpenPatients }: { onOpenPatients: () => void }) {
  return <div className="space-y-5"><header><h1 className="font-heading text-3xl font-bold">Documentos y notas</h1><p className="mt-2 text-sm text-muted-foreground sm:text-base">Archivos de Drive y notas clínicas organizados dentro de tu práctica.</p></header><button type="button" onClick={onOpenPatients} className="flex min-h-24 w-full items-center gap-4 rounded-3xl border border-white/80 bg-white/90 p-4 text-left shadow-sm transition hover:border-primary/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><FileText size={21} aria-hidden /></span><span className="min-w-0 flex-1"><span className="block font-bold">Notas clínicas</span><span className="block text-sm text-muted-foreground">Elegí un paciente y una sesión para consultar o escribir su nota privada.</span></span><span className="text-sm font-semibold text-primary">Ver pacientes</span></button><section className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-sm sm:p-5"><h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><FolderOpen className="text-primary" aria-hidden />Documentos</h2><DriveExplorer /></section></div>;
}
