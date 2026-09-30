import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchActivitiesForUser,
  fetchEmotionRecordsForUser, fetchLinkedPertenecientesForSupportUser, fetchPersonalNotesForUser, fetchProfessionalSessions, joinProfessionalInviteByCode, updateProfessionalSession,
  type Activity, type EmotionalRecord, type PersonalNote, type ProfessionalSession, type User,
} from '@/data/api';
import { CheckCircle2, Calendar, Home, Users, FileText, ClipboardPlus, Sparkles, MessageCircle, Bell, KeyRound, Loader2, FolderOpen, Image, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ActivityManager from '@/components/ActivityManager';
import ChatScreen from '@/components/ChatScreen';
import { ChatProvider } from '@/contexts/ChatContext';
import AppHeader from '@/components/AppHeader';
import NotificationBellButton, { useUnreadNotifications } from '@/components/NotificationBellButton';
import ProfessionalReportsPanel from '@/components/ProfessionalReportsPanel';
import DriveExplorer from '@/components/DriveExplorer';
import ProfessionalCalendar from '@/components/ProfessionalCalendar';
import ProfessionalHome, { ProfessionalEmotionalStatus, ProfessionalRecentActivity } from '@/components/ProfessionalHome';
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
import { ProfessionalAccountMenu, ProfessionalDrawer, ProfessionalQuickMenu, type ProfessionalTab, type ProfessionalQuickAction } from '@/components/professional/ProfessionalNavigation';
import { useProfessionalNavigation } from '@/hooks/useProfessionalNavigation';
import ProfessionalPatients from '@/components/professional/patients/ProfessionalPatients';
import ProfessionalPatientCenter from '@/components/professional/patients/ProfessionalPatientCenter';
import type { PatientSessionsIntent } from '@/components/professional/patients/ProfessionalPatientSessions';
import type { DetailTab } from '@/components/perteneciente/PertenecienteDetail';
import { buildPatientLinks, nextSessionForPatient } from '@/lib/professionalPatientsModel';

export default function ProfessionalDashboard() {
  const { user, logout } = useAuth();
  const { context: permissionContext, refetch: refetchPermissionContext } = usePermissionContext();
  const { toast } = useToast();
  const { tab, patientId: routePatientId, chatId: routeChatId, navigate: navigateRoute } = useProfessionalNavigation();
  const [selectedPatient, setSelectedPatient] = useState<string | null>(routePatientId);
  const [patientEntry, setPatientEntry] = useState<{ tab?: DetailTab; intent?: PatientSessionsIntent } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
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
  const [selectedNotificationChatId, setSelectedNotificationChatId] = useState<string | undefined>();
  const [agendaInitialPatientId, setAgendaInitialPatientId] = useState<number | undefined>();
  const [builderPreselect, setBuilderPreselect] = useState<string[] | undefined>(undefined);
  const [activitiesReturnPatientId, setActivitiesReturnPatientId] = useState<string | null>(null);
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

  const linkPatientWithCode = async (code: string) => {
    await joinProfessionalInviteByCode(code);
    await refetchPermissionContext();
    await reloadPatients();
  };

  const acceptProfessionalInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = professionalInviteCode.trim();
    if (!code) return;

    setJoiningProfessionalInvite(true);
    try {
      await linkPatientWithCode(code);
      setProfessionalInviteCode('');
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
  const patientOpen = tab === 'patients' && Boolean(selectedPatient);
  const patientLink = patientDetail ? buildPatientLinks(permissionContext, [patientDetail])[patientDetail.id] : undefined;
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
      navigateRoute('chat', params?.chatId ? { chatId: String(params.chatId) } : undefined);
      return;
    }

    if (linkedPatient) {
      setSelectedPatient(linkedPatient);
      setPatientEntry(nextTab === 'activities' ? { tab: 'evolution' } : null);
      navigateRoute('patients', { patientId: linkedPatient });
      return;
    }

    setSelectedPatient(null);
    navigateRoute(nextTab === 'calendar' && canScheduleSessions ? 'calendar' : 'patients');
  };

  const navigate = (next: ProfessionalTab) => {
    navigateRoute(next); setSelectedPatient(null); setMenuOpen(false); setProfileOpen(false); setQuickOpen(false); setActivitiesReturnPatientId(null);
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  };
  const openPatient = (userId: string) => {
    navigateRoute('patients', { patientId: userId }); setSelectedPatient(userId); setPatientEntry(null); setMenuOpen(false); setProfileOpen(false); setQuickOpen(false);
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  };
  const userIdForSession = (session: ProfessionalSession) =>
    linkedUsers.find(patient => Number(linkForUser(patient.id)?.perteneciente.id) === Number(session.id_perteneciente))?.id;
  const openPatientSessions = (session: ProfessionalSession, intent?: PatientSessionsIntent) => {
    const userId = userIdForSession(session);
    if (!userId) return;
    openPatient(userId);
    setPatientEntry({ tab: 'sessions', intent });
  };
  const prepareSessionFromHome = (session: ProfessionalSession) => openPatientSessions(session, { prepare: session });
  const writeNoteFromHome = (session: ProfessionalSession) => openPatientSessions(session, { note: session });
  const scheduleFromHome = (userId: string) => {
    setAgendaInitialPatientId(Number(linkForUser(userId)?.perteneciente.id) || undefined);
    navigate('calendar');
  };
  const backToPatientFromActividades = () => {
    if (!activitiesReturnPatientId) return;
    const patientId = activitiesReturnPatientId;
    setActivitiesReturnPatientId(null);
    setBuilderPreselect(undefined);
    setMenuOpen(false); setProfileOpen(false); setQuickOpen(false);
    navigateRoute('patients', { patientId });
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  };
  return (
    <div className="professional-surface flex h-dvh flex-col overflow-hidden bg-[radial-gradient(circle_at_88%_4%,rgba(220,203,245,0.42),transparent_24rem),linear-gradient(180deg,#fbf9ff_0%,#f8f7fc_100%)] pb-24 lg:pb-0">
      <a href="#professional-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Saltar al contenido</a>
      <AppHeader
        onMenuClick={() => { setProfileOpen(false); setQuickOpen(false); setMenuOpen(true); }}
        onLogoClick={() => navigate('home')}
        centerLogoMobile
        onBack={patientOpen ? () => navigate('patients') : undefined}
        mobileBackOnly={patientOpen}
        contextTitle={patientOpen ? patientDetail?.name : undefined}
        menuButtonClassName={patientOpen ? 'invisible pointer-events-none lg:visible lg:pointer-events-auto' : undefined}
        rightSlot={
          <div className="flex items-center gap-2">
            <NotificationBellButton count={unreadCount} onClick={() => { setMenuOpen(false); setProfileOpen(false); navigate('notifications'); }} className="border-0 bg-transparent text-primary hover:bg-primary/10" />
            <ProfessionalAccountMenu open={profileOpen} onOpenChange={(open) => { setProfileOpen(open); if (open) { setMenuOpen(false); setQuickOpen(false); } }} user={user} onNavigate={navigate} onLogout={logout} />
          </div>
        }
      />

      <ProfessionalDrawer open={menuOpen} active={tab} permissions={navigationPermissions} onClose={() => setMenuOpen(false)} onNavigate={navigate} onLogout={logout} />
      <main ref={mainRef} id="professional-main" tabIndex={-1} className="mx-auto min-h-0 w-full max-w-[1536px] flex-1 space-y-5 overflow-y-auto px-4 py-6 max-lg:pb-28 sm:px-6 lg:px-8 lg:py-9 xl:px-10">
        {tab === 'home' && loadingPatients && <ProfessionalHomeSkeleton />}
        {tab === 'home' && !loadingPatients && patientsError && <div role="alert" className="rounded-3xl border border-destructive/20 bg-white p-6 text-sm text-destructive shadow-sm">{patientsError}<Button type="button" variant="outline" className="ml-3" onClick={reloadPatients}>Reintentar</Button></div>}
        {tab === 'home' && !loadingPatients && !patientsError && <ProfessionalHome professionalName={user.name} patients={linkedUsers} sessions={sessions} activitiesByUser={activitiesByUser} emotionsByUser={emotionsByUser} notesByUser={notesByUser} patientPertenecienteIds={Object.fromEntries(linkedUsers.map(patient => [patient.id, Number(linkForUser(patient.id)?.perteneciente.id)]))} onNavigate={navigate} onOpenPatient={openPatient} onPrepareSession={prepareSessionFromHome} onWriteNote={writeNoteFromHome} onSchedule={scheduleFromHome} unscheduledUserIds={patientsWithoutNextSession.map(patient => patient.id)} canOpenAgenda={canScheduleSessions} />}
        {tab === 'recentActivity' && <ProfessionalRecentActivity patients={linkedUsers} emotionsByUser={emotionsByUser} notesByUser={notesByUser} onOpenPatient={openPatient} />}
        {tab === 'emotionalStatus' && <ProfessionalEmotionalStatus patients={linkedUsers} emotionsByUser={emotionsByUser} />}
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
          <ProfessionalPatients patients={linkedUsers} sessions={sessions} permissionContext={permissionContext} loading={loadingPatients} error={patientsError} onRetry={reloadPatients} onOpenPatient={openPatient} onSchedule={scheduleFromHome} onLinkWithCode={linkPatientWithCode} />
        )}

        {tab === 'patients' && selectedPatient && patientDetail && patientLink && (
          <ProfessionalPatientCenter
            key={patientDetail.id}
            patient={patientDetail}
            link={patientLink}
            currentUserId={user.id}
            activities={activitiesByUser[patientDetail.id] || []}
            emotions={emotionsByUser[patientDetail.id] || []}
            sessions={sessions}
            initialTab={patientEntry?.tab}
            sessionsIntent={patientEntry?.intent}
            onSchedule={() => scheduleFromHome(patientDetail.id)}
            onCreateActivity={patientLink.canAssignActivities ? () => { setBuilderPreselect([patientDetail.id]); navigate('create'); setActivitiesReturnPatientId(patientDetail.id); } : undefined}
            onSessionsChanged={reloadSessions}
          />
        )}

        {tab === 'create' && (canAssignActivities || canCreateCustomActivities) && (
          <div className="space-y-4">
            {activitiesReturnPatientId && (
              <button type="button" onClick={backToPatientFromActividades} className="inline-flex min-h-10 items-center rounded-lg border border-primary/20 bg-white px-4 text-sm font-semibold text-primary shadow-sm"><ChevronLeft size={16} className="mr-1" />Volver a {linkedUsers.find(p => p.id === activitiesReturnPatientId)?.name || 'pacientes'}</button>
            )}
            <ActivityManager assignableUsers={activityPatients} initialPreselectUserIds={builderPreselect} onBuilderClose={() => setBuilderPreselect(undefined)} onBack={backToPatientFromActividades} />
          </div>
        )}
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
        {tab === 'profile' && <ProfessionalProfileSettings patients={linkedUsers} />}
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
      <BelongingMobileBottomNav activeTab={tab} onNavigate={(next) => navigate(next as ProfessionalTab)} destinations={mobileDestinations} forceExpanded={quickOpen} scrollContainerRef={mainRef} center={(compactProgress) => <ProfessionalQuickMenu open={quickOpen} onOpenChange={setQuickOpen} compactProgress={compactProgress} permissions={navigationPermissions} onAction={(action: ProfessionalQuickAction) => {
        if (action === 'activity') navigate('create');
        if (action === 'resources') navigate('resources');
        if (action === 'documents') navigate('documents');
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
  return <div className="space-y-5"><header><h1 className="font-heading text-3xl font-bold">Recursos y herramientas</h1><p className="mt-2 text-sm text-muted-foreground sm:text-base">Materiales visuales y utilidades para tu práctica.</p></header><div className="grid gap-4 md:grid-cols-3">{areas.map(area => <button key={area.id} type="button" onClick={() => onNavigate(area.id)} className="min-h-44 rounded-[24px] border border-[#ece3f8] bg-white p-5 text-left shadow-[0_8px_24px_#f0e8f8] transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><area.icon size={22} aria-hidden /></span><h2 className="mt-4 font-bold text-[#2e2344]">{area.title}</h2><p className="mt-1 text-sm text-muted-foreground">{area.text}</p></button>)}</div></div>;
}

function ProfessionalHomeSkeleton() {
  return <div aria-label="Cargando inicio profesional" aria-busy="true" className="space-y-6">
    <div className="space-y-3"><div className="h-10 w-64 animate-pulse rounded-xl bg-primary/10" /><div className="h-5 w-full max-w-lg animate-pulse rounded-lg bg-primary/5" /></div>
    <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-48 animate-pulse rounded-[28px] border border-white/80 bg-white/80 shadow-sm" />)}</div>
    <div className="grid gap-5 xl:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-[26px] border border-white/80 bg-white/80 shadow-sm" />)}</div>
  </div>;
}

function ProfessionalDocumentsArea({ onOpenPatients }: { onOpenPatients: () => void }) {
  return <div className="space-y-5"><header><h1 className="font-heading text-3xl font-bold">Documentos y notas</h1><p className="mt-2 text-sm text-muted-foreground sm:text-base">Archivos de Drive y notas clínicas organizados dentro de tu práctica.</p></header><button type="button" onClick={onOpenPatients} className="flex min-h-24 w-full items-center gap-4 rounded-[24px] border border-[#ece3f8] bg-white p-4 text-left shadow-[0_8px_24px_#f0e8f8] transition hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FileText size={21} aria-hidden /></span><span className="min-w-0 flex-1"><span className="block font-bold text-[#2e2344]">Notas clínicas</span><span className="block text-sm text-muted-foreground">Elegí un paciente y una sesión para consultar o escribir su nota privada.</span></span><span className="text-sm font-semibold text-primary">Ver pacientes</span></button><section className="rounded-[24px] border border-[#ece3f8] bg-white p-4 shadow-[0_8px_24px_#f0e8f8] sm:p-5"><h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#2e2344]"><FolderOpen className="text-primary" aria-hidden />Documentos</h2><DriveExplorer /></section></div>;
}
