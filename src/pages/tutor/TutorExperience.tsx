import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, CalendarDays, CheckCircle2, ChevronRight, Clock,
  Heart, Image, Link2, MessageCircle, Sparkles, Users,
} from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import HeaderUserAvatar from '@/components/HeaderUserAvatar';
import NotificationBellButton, { useUnreadNotifications } from '@/components/NotificationBellButton';
import BelongingMobileBottomNav from '@/components/belonging/BelongingMobileBottomNav';
import ActivityManager from '@/components/ActivityManager';
import AiPictogramStudio from '@/components/AiPictogramStudio';
import ChatScreen from '@/components/ChatScreen';
import PersonalEventCalendar from '@/components/PersonalEventCalendar';
import ProfessionalDirectory from '@/components/ProfessionalDirectory';
import TutorReportsPanel from '@/components/TutorReportsPanel';
import TutorConnections from '@/pages/tutor/TutorConnections';
import UserNotifications from '@/pages/user/UserNotifications';
import UserPictograms from '@/pages/user/UserPictograms';
import AboutTandem from '@/pages/AboutTandem';
import { aggregateTutorEvents, type TutorAggregateEvent } from '@/lib/tutorEventAggregation';
import { TutorDrawer, TutorProfileDrawer, TutorQuickMenu, type TutorTab } from '@/components/tutor/TutorNavigation';
import TutorLinkedDetail from '@/components/tutor/TutorLinkedDetail';
import TutorHome from '@/components/tutor/TutorHome';
import TutorAccountSettings from '@/components/tutor/TutorAccountSettings';
import { ChatProvider } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncMobileMenuOpen } from '@/contexts/MobileMenuState';
import { useTutorNavigation } from '@/hooks/useTutorNavigation';
import type { TutorAggregateActivity as AggregateActivity, TutorAggregateEmotion as AggregateEmotion } from '@/lib/tutorHomeModel';
import {
  createCalendarEvent, deleteCalendarEvent, fetchCalendarEventsForUser, fetchPictograms,
  fetchTutorHome, updateCalendarEvent, type CalendarEvent, type Pictogram, type TutorHomeData,
  type TutorHomeLinkedUser,
} from '@/data/api';

const tutorPageLabels: Partial<Record<TutorTab, string>> = {
  calendar: 'Calendario', activities: 'Actividades', chat: 'Chats', notifications: 'Notificaciones',
  reports: 'Reportes', professionals: 'Profesionales', pictograms: 'Crear pictograma',
  pictogramCatalog: 'Pictogramas', connections: 'Personas vinculadas', profile: 'Perfil', about: 'Acerca de TÁNDEM',
};

function parseDate(value?: string | null) {
  if (!value) return 0;
  const parsed = Date.parse(value.includes('T') ? value : `${value}T12:00:00`);
  return Number.isFinite(parsed) ? parsed : 0;
}

function ownerAvatar(owner: TutorHomeLinkedUser, size = 'h-7 w-7') {
  const avatar = owner.avatar?.trim();
  const image = avatar && (/^(https?:|data:image\/|\/)/.test(avatar) || /\.(png|jpe?g|webp|svg)$/i.test(avatar));
  return <span className={`inline-flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary`} aria-hidden>{image ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : avatar || owner.name.slice(0, 1)}</span>;
}

export default function TutorExperience() {
  const { user, logout } = useAuth();
  const { tab, detailUserId, chatId, navigate: navigateRoute, goBack } = useTutorNavigation();
  const [data, setData] = useState<TutorHomeData | null>(null);
  const [tutorEvents, setTutorEvents] = useState<CalendarEvent[]>([]);
  const [pictograms, setPictograms] = useState<Pictogram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [selectedNotificationChatId, setSelectedNotificationChatId] = useState<string | undefined>();
  const { unreadCount, setUnreadCount } = useUnreadNotifications(user?.role === 'tutor' ? { id: String(user.id) } : null);
  useSyncMobileMenuOpen(menuOpen || profileOpen || quickOpen);

  const load = useCallback(async () => {
    if (!user || user.role !== 'tutor') return;
    setLoading(true); setError(null);
    try {
      const [home, ownEvents, pics] = await Promise.all([
        fetchTutorHome(user.id),
        fetchCalendarEventsForUser(user.id).catch(() => []),
        fetchPictograms({ limit: 6 }).catch(() => []),
      ]);
      setData(home); setTutorEvents(ownEvents); setPictograms(pics);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos cargar la experiencia del tutor.');
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setSelectedNotificationChatId(chatId); }, [chatId]);

  const linkedUsers = useMemo(() => data?.linkedUsers || [], [data]);
  const aggregates = useMemo(() => {
    const activities: AggregateActivity[] = [];
    const emotions: AggregateEmotion[] = [];
    const events: TutorAggregateEvent[] = [];
    linkedUsers.forEach(owner => {
      const bucket = data?.byUserId[owner.id];
      bucket?.activities.forEach(item => activities.push({ ...item, owner }));
      bucket?.emotions.forEach(item => emotions.push({ ...item, owner }));
    });
    activities.sort((a, b) => parseDate(b.completedAt || b.assignedAt) - parseDate(a.completedAt || a.assignedAt));
    emotions.sort((a, b) => parseDate(`${b.date}T${b.timestamp || '12:00'}`) - parseDate(`${a.date}T${a.timestamp || '12:00'}`));
    events.push(...aggregateTutorEvents(linkedUsers, data?.byUserId || {}, tutorEvents));
    return { activities, emotions, events };
  }, [data, linkedUsers, tutorEvents]);

  if (!user || user.role !== 'tutor') return null;

  const navigate = (next: TutorTab, context?: { detailUserId?: string | null; chatId?: string }) => { setMenuOpen(false); setProfileOpen(false); setQuickOpen(false); navigateRoute(next, context); };
  const openDetail = (id: string) => navigate('detail', { detailUserId: id });
  const chatProfiles = [{ id: String(user.id), name: user.name, avatar: user.avatar, label: 'Tutor' }, ...linkedUsers.map(item => ({ id: item.id, name: item.name, avatar: item.avatar, label: 'Perteneciente' }))];
  const detailOwner = linkedUsers.find(item => item.id === detailUserId);
  const pageTitle = tab === 'detail' ? detailOwner?.name || 'Detalle' : tutorPageLabels[tab] || 'TÁNDEM';

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[radial-gradient(circle_at_88%_4%,rgba(220,203,245,0.48),transparent_24rem),linear-gradient(180deg,#fbf9ff_0%,#f8f7fc_100%)] pb-24 lg:pb-0">
      <a href="#tutor-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Saltar al contenido</a>
      <AppHeader
        onMenuClick={() => setMenuOpen(true)}
        onLogoClick={() => navigate('home')}
        onBack={tab !== 'home' ? () => goBack('home') : undefined}
        mobileBackOnly
        contextTitle={pageTitle}
        menuButtonClassName="invisible pointer-events-none lg:visible lg:pointer-events-auto"
        rightSlot={<div className="flex items-center gap-2">
          <NotificationBellButton count={unreadCount} onClick={() => navigate('notifications')} className="border-0 bg-transparent" />
          <button type="button" onClick={() => setProfileOpen(true)} aria-label="Abrir perfil y cuenta" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><HeaderUserAvatar avatar={user.avatar} name={user.name} /></button>
        </div>}
      />

      <TutorDrawer open={menuOpen} active={tab} onClose={() => setMenuOpen(false)} onNavigate={navigate} onLogout={logout} />
      <TutorProfileDrawer open={profileOpen} user={user} onClose={() => setProfileOpen(false)} onNavigate={navigate} onLogout={logout} />

      <main id="tutor-main" tabIndex={-1} className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
        {tab !== 'home' && <TutorBreadcrumb current={pageTitle} parent={tab === 'detail' ? 'Personas vinculadas' : undefined} onBack={() => goBack('home')} />}
        {loading ? <TutorSkeleton /> : error ? <ErrorState message={error} onRetry={load} /> : (
          <TutorContent
            tab={tab} userName={user.name} userId={user.id} data={data!} linkedUsers={linkedUsers}
            activities={aggregates.activities} emotions={aggregates.emotions} events={aggregates.events}
            tutorEvents={tutorEvents} pictograms={pictograms}
            detailUserId={detailUserId} chatProfiles={chatProfiles} selectedNotificationChatId={selectedNotificationChatId}
            onNavigate={navigate} onOpenDetail={openDetail}
            onUnreadCountChange={setUnreadCount} onSelectNotificationChat={setSelectedNotificationChatId}
            onTutorEventsChange={setTutorEvents}
          />
        )}
      </main>

      <BelongingMobileBottomNav
        activeTab={tab === 'home' ? 'home' : tab}
        onNavigate={(id) => navigate(id as TutorTab)}
        forceExpanded={quickOpen}
        center={(compactProgress) => <TutorQuickMenu open={quickOpen} onOpenChange={setQuickOpen} compactProgress={compactProgress} onAction={(action) => {
          if (action === 'activity') navigate('activities');
          if (action === 'event') navigate('calendar');
          if (action === 'link') navigate('connections');
          if (action === 'pictogram') navigate('pictograms');
        }} />}
      />
    </div>
  );
}

function TutorContent(props: {
  tab: TutorTab; userName: string; userId: string; data: TutorHomeData; linkedUsers: TutorHomeLinkedUser[];
  activities: AggregateActivity[]; emotions: AggregateEmotion[]; events: TutorAggregateEvent[]; tutorEvents: CalendarEvent[];
  pictograms: Pictogram[]; detailUserId: string | null;
  chatProfiles: { id: string; name: string; avatar?: string | null; label: string }[]; selectedNotificationChatId?: string;
  onNavigate: (tab: TutorTab, context?: { detailUserId?: string | null; chatId?: string }) => void; onOpenDetail: (id: string) => void;
  onUnreadCountChange: (count: number) => void; onSelectNotificationChat: (id?: string) => void;
  onTutorEventsChange: (events: CalendarEvent[]) => void;
}) {
  const { tab } = props;
  if (tab === 'home') return <TutorHome userName={props.userName} data={props.data} linkedUsers={props.linkedUsers} activities={props.activities} emotions={props.emotions} events={props.events} pictograms={props.pictograms} onNavigate={props.onNavigate} onOpenDetail={props.onOpenDetail} />;
  if (tab === 'activities') return <ActivitiesPage activities={props.activities} linkedUsers={props.linkedUsers} />;
  if (tab === 'calendar') return <CalendarPage {...props} />;
  if (tab === 'chat') return <ChatProvider><ChatScreen key={props.selectedNotificationChatId || 'tutor-chat'} profiles={props.chatProfiles} defaultProfileId={props.userId} defaultSelectedId={props.selectedNotificationChatId} /></ChatProvider>;
  if (tab === 'notifications') return <UserNotifications onUnreadCountChange={props.onUnreadCountChange} onNavigate={(next, params) => {
    if (next === 'chat') { const chatId = params?.chatId ? String(params.chatId) : undefined; props.onSelectNotificationChat(chatId); props.onNavigate('chat', { chatId }); }
    else if (next === 'calendar') props.onNavigate('calendar');
    else if (next === 'activities') props.onNavigate('activities');
    else props.onNavigate('home');
  }} />;
  if (tab === 'reports') return <TutorReportsPanel />;
  if (tab === 'professionals') return <ProfessionalDirectory />;
  if (tab === 'pictograms') return <AiPictogramStudio />;
  if (tab === 'pictogramCatalog') return <UserPictograms />;
  if (tab === 'connections') return <ConnectionsPage users={props.linkedUsers} onOpenDetail={props.onOpenDetail} />;
  if (tab === 'about') return <AboutTandem />;
  if (tab === 'profile') return <TutorAccountSettings onManageConnections={() => props.onNavigate('connections')} />;
  if (tab === 'detail') {
    const owner = props.linkedUsers.find(item => item.id === props.detailUserId);
    return owner ? <TutorLinkedDetail owner={owner} data={props.data.byUserId[owner.id]} onNavigate={props.onNavigate} onOpenChat={(id) => { props.onSelectNotificationChat(id); props.onNavigate('chat', { chatId: id }); }} /> : <ErrorState message="No encontramos a esa persona vinculada." onRetry={() => props.onNavigate('connections')} />;
  }
  return null;
}

function TutorHomeLegacy(props: Parameters<typeof TutorContent>[0]) {
  const completed = props.activities.filter(item => item.completed).length;
  const adherence = props.activities.length ? Math.round((completed / props.activities.length) * 100) : 0;
  const weekAgo = Date.now() - 7 * 86400000;
  const recentEmotions = props.emotions.filter(item => parseDate(item.date) >= weekAgo);
  const emotionGroups = recentEmotions.reduce((acc, item) => {
    if (item.intensity >= 4) acc.high += 1; else if (item.intensity === 3) acc.medium += 1; else acc.low += 1;
    return acc;
  }, { high: 0, medium: 0, low: 0 });
  const emotionTotal = recentEmotions.length;
  const pct = (value: number) => emotionTotal ? Math.round((value / emotionTotal) * 100) : 0;
  const upcoming = props.events.filter(item => parseDate(`${item.date}T${item.time || '00:00'}`) >= Date.now() - 3600000).slice(0, 5);
  const recentItems = [
    ...props.activities.slice(0, 6).map(item => ({ id: `a-${item.owner.id}-${item.id}`, kind: item.completed ? 'Actividad completada' : 'Actividad asignada', detail: item.title, category: 'Actividad', owner: item.owner, date: item.completedAt || item.assignedAt, icon: item.completed ? CheckCircle2 : Activity, color: 'text-emerald-600 bg-emerald-50' })),
    ...props.emotions.slice(0, 6).map(item => ({ id: `e-${item.owner.id}-${item.id}`, kind: 'Emoción registrada', detail: item.emotion, category: 'Emociones', owner: item.owner, date: item.date, icon: Heart, color: 'text-rose-500 bg-rose-50' })),
  ].sort((a, b) => parseDate(b.date) - parseDate(a.date)).slice(0, 6);

  return <div className="space-y-5 lg:space-y-6">
    <section>
      <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Buen día, {props.userName.split(' ')[0]}</h1>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">Todo lo importante para acompañar, organizar y conectar, en un solo lugar.</p>
    </section>

    <section aria-label="Acciones rápidas" className="hidden grid-cols-2 gap-3 lg:grid lg:grid-cols-4">
      <QuickAction icon={CheckCircle2} label="Asignar actividad" onClick={() => props.onNavigate('activities')} />
      <QuickAction icon={CalendarDays} label="Agregar evento" onClick={() => props.onNavigate('calendar')} />
      <QuickAction icon={MessageCircle} label="Enviar mensaje" onClick={() => props.onNavigate('chat')} />
      <QuickAction icon={Link2} label="Vincular" onClick={() => props.onNavigate('connections')} />
    </section>

    <div className="grid gap-5 xl:grid-cols-2">
      <DashboardCard title="Resumen de vinculados" icon={Users} action="Ver detalle" onAction={() => props.onNavigate('reports')}>
        {props.linkedUsers.length === 0 ? <EmptyState text="Todavía no hay personas vinculadas." /> : <div className="grid gap-5 md:grid-cols-[1.25fr_.75fr]">
          <div><p className="mb-4 text-sm font-semibold text-foreground">Actividades por integrante</p><div className="space-y-4">{props.linkedUsers.map(owner => {
            const list = props.data.byUserId[owner.id]?.activities || []; const done = list.filter(item => item.completed).length; const ownerPct = list.length ? Math.round((done / list.length) * 100) : 0;
            return <div key={owner.id} className="grid grid-cols-[minmax(88px,auto)_1fr_42px] items-center gap-3">
              <span className="flex min-w-0 items-center gap-2">{ownerAvatar(owner)}<span className="truncate text-xs font-medium">{owner.name.split(' ')[0]}</span></span>
              <span className="h-3 overflow-hidden rounded-full bg-primary/10"><span className="block h-full rounded-full bg-[linear-gradient(90deg,#8157d9,#a78bfa)]" style={{ width: `${ownerPct}%` }} /></span>
              <span className="text-right text-xs font-bold tabular-nums">{done}/{list.length}</span>
            </div>;
          })}</div></div>
          <div className="flex flex-col items-center justify-center border-t border-border pt-5 md:border-l md:border-t-0 md:pl-5 md:pt-0">
            <p className="self-start text-sm font-semibold text-foreground">Registros emocionales</p>
            {emotionTotal ? <><div className="relative my-4 h-28 w-28 rounded-full" style={{ background: `conic-gradient(#80c783 0 ${pct(emotionGroups.high)}%,#f3be59 ${pct(emotionGroups.high)}% ${pct(emotionGroups.high + emotionGroups.medium)}%,#e99bb7 ${pct(emotionGroups.high + emotionGroups.medium)}% 100%)` }}><div className="absolute inset-4 flex items-center justify-center rounded-full bg-card"><span className="text-2xl font-bold">{emotionTotal}</span></div></div><div className="w-full space-y-1 text-xs"><Legend color="bg-emerald-500" label="Intensidad alta" value={pct(emotionGroups.high)} /><Legend color="bg-amber-400" label="Media" value={pct(emotionGroups.medium)} /><Legend color="bg-rose-400" label="Baja" value={pct(emotionGroups.low)} /></div></> : <EmptyState text="Sin registros de los últimos 7 días." />}
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-primary/10 bg-primary/[0.035] p-3 md:col-span-2"><Metric value={props.linkedUsers.length} label="vinculados" /><Metric value={props.activities.length} label="actividades" /><Metric value={`${adherence}%`} label="adherencia" /></div>
        </div>}
      </DashboardCard>

      <DashboardCard title="Próximos eventos" icon={CalendarDays} action="Ver calendario" onAction={() => props.onNavigate('calendar')}>
        <div className="divide-y divide-border">{upcoming.map(event => <button key={`${event.userId}-${event.id}`} type="button" onClick={() => props.onNavigate('calendar')} className="grid min-h-16 w-full grid-cols-[72px_1fr_auto] items-center gap-3 py-2 text-left transition-colors hover:bg-primary/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="text-xs font-semibold text-primary"><span className="block">{new Date(`${event.date}T12:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</span><span>{event.time}</span></span>
          <span className="min-w-0"><span className="block truncate text-sm font-semibold text-foreground">{event.title}</span><span className="block truncate text-xs text-muted-foreground">{event.description || event.type}</span></span>
          <EventContextChip owner={event.owner} />
        </button>)}{upcoming.length === 0 && <EmptyState text="No hay próximos eventos programados." />}</div>
      </DashboardCard>

      <DashboardCard title="Actividad reciente" icon={Activity} action="Ver actividades" onAction={() => props.onNavigate('activities')}>
        <div className="divide-y divide-border">{recentItems.map(item => <button type="button" key={item.id} onClick={() => props.onOpenDetail(item.owner.id)} aria-label={`Ver información de ${item.owner.name}: ${item.kind}`} className="grid min-h-14 w-full grid-cols-[36px_1fr_auto] items-center gap-3 py-2 text-left transition-colors hover:bg-primary/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.color}`}><item.icon size={18} aria-hidden /></span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{item.kind}</span><span className="block truncate text-xs text-muted-foreground">{item.detail} · {item.category}</span></span><span className="flex items-center gap-3"><PersonChip owner={item.owner} /><span className="hidden min-w-16 text-right text-xs text-muted-foreground sm:block">{relativeTime(item.date)}</span><ChevronRight size={16} className="text-muted-foreground" aria-hidden /></span></button>)}{recentItems.length === 0 && <EmptyState text="Todavía no hay actividad reciente." />}</div>
      </DashboardCard>

      <DashboardCard title="Pictogramas" icon={Image} action="Ver todos" onAction={() => props.onNavigate('pictogramCatalog')}>
        <div className="grid gap-3 sm:grid-cols-2"><ToolCard icon={Sparkles} title="Crear con IA" text="Generá pictogramas a partir de una idea" onClick={() => props.onNavigate('pictograms')} /><ToolCard icon={Image} title="Explorar pictogramas" text="Buscá por categorías y temas" onClick={() => props.onNavigate('pictogramCatalog')} /></div>
        {props.pictograms.length ? <div className="mt-4 flex flex-wrap gap-2" aria-label="Pictogramas recientes">{props.pictograms.slice(0, 6).map(pic => <button key={pic.id} type="button" onClick={() => props.onNavigate('pictogramCatalog')} className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{pic.imageUrl ? <img src={pic.imageUrl} alt={pic.name} loading="lazy" className="h-full w-full object-contain" /> : <span className="text-2xl" aria-label={pic.name}>{pic.emoji}</span>}</button>)}</div> : <p className="mt-4 text-sm text-muted-foreground">Todavía no hay pictogramas disponibles para mostrar.</p>}
      </DashboardCard>
    </div>
  </div>;
}

function ActivitiesPage({ activities, linkedUsers }: { activities: AggregateActivity[]; linkedUsers: TutorHomeLinkedUser[] }) {
  const completed = activities.filter(item => item.completed).length;
  return <div className="space-y-5"><PageHeading title="Actividades" subtitle="Creá, asigná y seguí actividades sin cambiar el contexto general de la aplicación." />
    <div className="grid grid-cols-3 gap-3"><MetricCard value={activities.length} label="Total asignadas" /><MetricCard value={completed} label="Completadas" /><MetricCard value={activities.length - completed} label="Pendientes" /></div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
      <section className="rounded-3xl border border-border/80 bg-card p-4 shadow-[0_12px_34px_rgba(67,45,96,0.06)] sm:p-5"><h2 className="text-lg font-bold">Actividad de todos los vinculados</h2><p className="mb-4 text-sm text-muted-foreground">La persona aparece como contexto, no como filtro obligatorio.</p><div className="divide-y divide-border">{activities.map(item => <div key={`${item.owner.id}-${item.id}`} className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-3 py-3"><span className="min-w-0"><span className="flex items-center gap-2"><span className="truncate text-sm font-semibold">{item.title}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.completed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{item.status}</span></span><span className="mt-1 block truncate text-xs text-muted-foreground">{item.description}</span></span><PersonChip owner={item.owner} /></div>)}{activities.length === 0 && <EmptyState text="Todavía no hay actividades asignadas." />}</div></section>
      <ActivityManager assignableUsers={linkedUsers} />
    </div>
  </div>;
}

function CalendarPage(props: Parameters<typeof TutorContent>[0]) {
  const [saving, setSaving] = useState(false);
  const upcomingEvents = props.events.filter(event => parseDate(`${event.date}T${event.time || '00:00'}`) >= Date.now() - 3600000).slice(0, 10);
  const refresh = async () => props.onTutorEventsChange(await fetchCalendarEventsForUser(props.userId).catch(() => props.tutorEvents));
  return <div className="space-y-5"><PageHeading title="Calendario" subtitle="Organizá tu agenda. Cuando un evento corresponde a alguien, elegilo dentro del evento." />
    <PersonalEventCalendar
      heading="Agenda del tutor"
      events={props.tutorEvents}
      patients={props.linkedUsers.map(item => ({ id: item.id, name: item.name }))}
      loading={saving}
      onCreate={async payload => { setSaving(true); try { await createCalendarEvent(props.userId, payload); await refresh(); } finally { setSaving(false); } }}
      onUpdate={async (id, patch) => { setSaving(true); try { await updateCalendarEvent(id, patch); await refresh(); } finally { setSaving(false); } }}
      onDelete={async id => { setSaving(true); try { await deleteCalendarEvent(id); await refresh(); } finally { setSaving(false); } }}
    />
    <section className="rounded-3xl border border-border/80 bg-card p-4 shadow-sm"><h2 className="text-lg font-bold">Próximos eventos</h2><div className="mt-3 divide-y divide-border">{upcomingEvents.map(event => <div key={`${event.userId}-${event.id}`} className="grid min-h-14 grid-cols-[80px_1fr_auto] items-center gap-3 py-2"><span className="text-xs font-semibold text-primary">{event.date}<br />{event.time}</span><span className="truncate text-sm font-semibold">{event.title}</span><EventContextChip owner={event.owner} /></div>)}{upcomingEvents.length === 0 && <EmptyState text="No hay eventos futuros para mostrar." />}</div></section>
  </div>;
}

function ConnectionsPage({ users, onOpenDetail }: { users: TutorHomeLinkedUser[]; onOpenDetail: (id: string) => void }) {
  return <div className="space-y-5"><PageHeading title="Personas vinculadas" subtitle="Consultá perfiles y administrá vínculos sin convertir a una persona en el contexto global." />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{users.map(owner => <button key={owner.id} type="button" onClick={() => onOpenDetail(owner.id)} className="flex min-h-24 items-center gap-4 rounded-3xl border border-border/80 bg-card p-4 text-left shadow-sm transition hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{ownerAvatar(owner, 'h-14 w-14')}<span className="min-w-0 flex-1"><span className="block truncate font-bold">{owner.name}</span><span className="block truncate text-xs text-muted-foreground">{owner.supportLevel} · {owner.linkStatus}</span></span><ChevronRight className="text-muted-foreground" aria-hidden /></button>)}{users.length === 0 && <EmptyState text="Todavía no hay personas vinculadas." />}</div>
    <TutorConnections />
  </div>;
}

function DashboardCard({ title, icon: Icon, action, onAction, children }: { title: string; icon: typeof Activity; action?: string; onAction?: () => void; children: React.ReactNode }) {
  return <section className="rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-[0_12px_36px_rgba(70,45,96,.075)] backdrop-blur sm:p-5"><header className="mb-4 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon size={20} aria-hidden /></span><h2 className="min-w-0 flex-1 text-lg font-bold text-foreground">{title}</h2>{action && <button type="button" onClick={onAction} className="min-h-11 rounded-xl px-2 text-sm font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{action} <ChevronRight size={16} className="inline" aria-hidden /></button>}</header>{children}</section>;
}

function QuickAction({ icon: Icon, label, onClick }: { icon: typeof Activity; label: string; onClick: () => void }) { return <button type="button" onClick={onClick} className="flex min-h-20 items-center gap-4 rounded-2xl border border-white bg-white/90 p-4 text-left font-semibold shadow-[0_8px_24px_rgba(70,45,96,.07)] transition hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={22} aria-hidden /></span>{label}</button>; }
function ToolCard({ icon: Icon, title, text, onClick }: { icon: typeof Activity; title: string; text: string; onClick: () => void }) { return <button type="button" onClick={onClick} className="flex min-h-24 items-center gap-3 rounded-2xl bg-[linear-gradient(135deg,rgba(239,230,251,.95),rgba(250,248,255,.95))] p-4 text-left transition hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Icon className="shrink-0 text-primary" aria-hidden /><span><span className="block font-bold text-primary">{title}</span><span className="mt-1 block text-xs text-muted-foreground">{text}</span></span><ChevronRight className="ml-auto shrink-0 text-primary" aria-hidden /></button>; }
function PersonChip({ owner }: { owner: TutorHomeLinkedUser }) { return <span className="inline-flex max-w-28 items-center gap-1.5 rounded-full bg-primary/[0.065] py-1 pl-1 pr-2 text-xs font-semibold text-primary">{ownerAvatar(owner, 'h-6 w-6')}<span className="truncate">{owner.name.split(' ')[0]}</span></span>; }
function EventContextChip({ owner }: { owner?: TutorHomeLinkedUser }) { return owner ? <PersonChip owner={owner} /> : <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">Agenda del tutor</span>; }
function Legend({ color, label, value }: { color: string; label: string; value: number }) { return <div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${color}`} /><span className="flex-1 text-muted-foreground">{label}</span><span className="font-semibold tabular-nums">{value}%</span></div>; }
function Metric({ value, label }: { value: string | number; label: string }) { return <div className="text-center"><p className="text-xl font-bold text-primary tabular-nums">{value}</p><p className="text-[11px] text-muted-foreground">{label}</p></div>; }
function MetricCard({ value, label }: { value: string | number; label: string }) { return <div className="rounded-2xl border border-border/80 bg-card p-4 text-center shadow-sm"><p className="text-2xl font-bold text-primary tabular-nums">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>; }
function TutorBreadcrumb({ current, parent, onBack }: { current: string; parent?: string; onBack: () => void }) { return <nav aria-label="Ruta de navegación" className="mb-5 hidden min-h-11 items-center gap-2 text-sm lg:flex"><button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-2 font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronRight size={17} className="rotate-180" aria-hidden />Volver</button><span className="text-muted-foreground">TÁNDEM</span><ChevronRight size={15} className="text-muted-foreground" aria-hidden />{parent && <><span className="text-muted-foreground">{parent}</span><ChevronRight size={15} className="text-muted-foreground" aria-hidden /></>}<span className="font-semibold text-foreground" aria-current="page">{current}</span></nav>; }
function PageHeading({ title, subtitle }: { title: string; subtitle: string }) { return <header><h1 className="font-heading text-3xl font-bold tracking-tight">{title}</h1><p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p></header>; }
function EmptyState({ text }: { text: string }) { return <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">{text}</p>; }
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) { return <div role="alert" className="mx-auto max-w-xl rounded-3xl border border-destructive/20 bg-card p-8 text-center shadow-sm"><p className="font-semibold">No pudimos cargar esta información.</p><p className="mt-2 text-sm text-muted-foreground">{message}</p><button type="button" onClick={onRetry} className="mt-4 min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Intentar nuevamente</button></div>; }
function TutorSkeleton() { return <div className="space-y-5" aria-label="Cargando panel del Tutor"><div className="h-20 animate-pulse rounded-3xl bg-muted" /><div className="grid gap-5 xl:grid-cols-2">{[1, 2, 3, 4].map(item => <div key={item} className="h-72 animate-pulse rounded-3xl bg-muted" />)}</div></div>; }
