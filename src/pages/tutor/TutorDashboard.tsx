import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Loader2,
  LogOut,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Save,
  Settings,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import TutorAdvancedStats from '@/components/TutorAdvancedStats';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import ActivityManager from '@/components/ActivityManager';
import ChatScreen from '@/components/ChatScreen';
import { ChatProvider } from '@/contexts/ChatContext';
import AppHeader from '@/components/AppHeader';
import HeaderUserAvatar from '@/components/HeaderUserAvatar';
import NotificationBellButton, { useUnreadNotifications } from '@/components/NotificationBellButton';
import PersonalEventCalendar from '@/components/PersonalEventCalendar';
import AiPictogramStudio from '@/components/AiPictogramStudio';
import { useCustomActivities } from '@/contexts/CustomActivitiesContext';
import UserNotifications from '@/pages/user/UserNotifications';
import TutorConnections from '@/pages/tutor/TutorConnections';
import ProfessionalDirectory from '@/components/ProfessionalDirectory';
import {
  createCalendarEvent,
  deleteCalendarEvent,
  fetchCalendarEventsForUser,
  fetchUserProfileDashboard,
  fetchUserProfileSettings,
  fetchTutorHome,
  saveUserProfileSettings,
  updateCalendarEvent,
  type CalendarEvent,
  type UserProfileDashboard,
  type UserProfileSettings,
  type UserProfileSettingsPayload,
  type TutorHomeData,
  type TutorHomeLinkedUser,
} from '@/data/api';
import { useSyncMobileMenuOpen } from '@/contexts/MobileMenuState';
import { toast } from '@/hooks/ui/use-toast';

type TabId =
  | 'overview'
  | 'connections'
  | 'stats'
  | 'agenda'
  | 'activities'
  | 'chat'
  | 'location'
  | 'emotions'
  | 'calendar'
  | 'insights'
  | 'notifications'
  | 'profile'
  | 'settings'
  | 'pictograms'
  | 'directory';

const tabs: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
  { id: 'overview', label: 'Inicio', icon: BarChart3 },
  { id: 'connections', label: 'Permisos', icon: Users },
  { id: 'stats', label: 'Estadisticas', icon: TrendingUp },
  { id: 'agenda', label: 'Agenda', icon: Clock },
  { id: 'activities', label: 'Actividades', icon: Sparkles },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'location', label: 'Ubicacion', icon: MapPin },
  { id: 'emotions', label: 'Emociones', icon: Heart },
  { id: 'calendar', label: 'Calendario', icon: Calendar },
  { id: 'insights', label: 'Tranquilidad', icon: Shield },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'pictograms', label: 'Pictogramas IA', icon: Sparkles },
  { id: 'profile', label: 'Perfil', icon: UserRound },
  { id: 'settings', label: 'Config', icon: Settings },
  { id: 'directory', label: 'Profesionales', icon: Users },
];

const tutorTabs = tabs.filter(item => ['agenda', 'chat', 'notifications', 'pictograms', 'directory'].includes(item.id));
const belongingTabs = tabs.filter(item => ['overview', 'stats', 'activities', 'location', 'emotions', 'calendar', 'insights', 'profile', 'settings', 'connections'].includes(item.id));

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

function typeColorForEvent(type: CalendarEvent['type']) {
  const colors: Partial<Record<CalendarEvent['type'] | string, string>> = {
    terapia: 'hsl(270 40% 75%)',
    escuela: 'hsl(210 70% 55%)',
    personal: 'hsl(30 80% 60%)',
    médico: 'hsl(0 72% 55%)',
    medico: 'hsl(0 72% 55%)',
    'mÃ©dico': 'hsl(0 72% 55%)',
    social: 'hsl(150 60% 45%)',
    actividad: 'hsl(45 90% 55%)',
  };
  return colors[type] || colors.personal || 'hsl(30 80% 60%)';
}

function shortName(user?: TutorHomeLinkedUser) {
  return user?.name.split(' ')[0] || 'El usuario';
}

function clampPct(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

type TutorDashboardProps = {
  initialUserId?: number;
  initialTab?: string;
  onBack?: () => void;
};

export default function TutorDashboard({ initialUserId, initialTab, onBack }: TutorDashboardProps) {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<TabId>((initialTab as TabId) || 'overview');
  const [selectedUser, setSelectedUser] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  useSyncMobileMenuOpen(menuOpen);
  const [menuPanel, setMenuPanel] = useState<'main' | 'pertenecientes'>('main');
  const [yoOpen, setYoOpen] = useState(true);
  const [data, setData] = useState<TutorHomeData | null>(null);
  const [tutorAgendaEvents, setTutorAgendaEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotificationChatId, setSelectedNotificationChatId] = useState<string | undefined>();
  const { unreadCount, setUnreadCount } = useUnreadNotifications(
    user && user.role === 'tutor' ? { id: String(user.id) } : null
  );

  const loadTutorAgenda = async () => {
    if (!user || user.role !== 'tutor') return;
    const nextEvents = await fetchCalendarEventsForUser(user.id).catch(() => []);
    setTutorAgendaEvents(nextEvents);
  };

  const load = async (preferredUserId?: string) => {
    if (!user || user.role !== 'tutor') return;
    setLoading(true);
    setError(null);
    try {
      const [next, nextAgendaEvents] = await Promise.all([
        fetchTutorHome(user.id),
        fetchCalendarEventsForUser(user.id).catch(() => []),
      ]);
      setData(next);
      setTutorAgendaEvents(nextAgendaEvents);
      const nextIndex = preferredUserId
        ? next.linkedUsers.findIndex(linked => linked.id === preferredUserId)
        : selectedUser;
      setSelectedUser(nextIndex >= 0 && nextIndex < next.linkedUsers.length ? nextIndex : 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el panel del tutor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const preferredUserId = initialUserId ? String(initialUserId) : undefined;
    load(preferredUserId);
  }, [user?.id]);

  const linkedUsers = data?.linkedUsers || [];
  const mainUser = linkedUsers[selectedUser] || linkedUsers[0];
  const userData = mainUser ? data?.byUserId[mainUser.id] : undefined;
  const activities = userData?.activities || [];
  const emotions = userData?.emotions || [];
  const events = userData?.events || [];
  const locations = userData?.locations || [];
  const notifications = userData?.notifications || [];
  const completedAct = activities.filter(a => a.completed);
  const pendingAct = activities.filter(a => !a.completed);
  const adherence = activities.length > 0 ? clampPct((completedAct.length / activities.length) * 100) : 0;
  const todayEmotions = emotions.filter(e => e.date === todayKey());
  const currentWeekStart = new Date();
  currentWeekStart.setDate(currentWeekStart.getDate() - 6);
  const weeklyActivitiesForHeader = activities.filter(a => {
    const d = new Date(a.assignedAt);
    return d >= currentWeekStart && d <= new Date();
  });
  const weeklyAdherence = weeklyActivitiesForHeader.length
    ? clampPct((weeklyActivitiesForHeader.filter(a => a.completed).length / weeklyActivitiesForHeader.length) * 100)
    : 0;

  const navigateFromNotification = (nextTab: string, params?: Record<string, any>) => {
    const tutorTabMap: Record<string, TabId> = {
      home: 'overview',
      achievements: 'overview',
      shop: 'overview',
      resources: 'overview',
      activities: 'activities',
      calendar: 'calendar',
      chat: 'chat',
    };
    if (nextTab === 'chat') {
      setSelectedNotificationChatId(params?.chatId ? String(params.chatId) : undefined);
    }
    if (params?.sourceUserId) {
      const linkedIndex = linkedUsers.findIndex(linked => String(linked.id) === String(params.sourceUserId));
      if (linkedIndex >= 0) setSelectedUser(linkedIndex);
    }
    setTab(tutorTabMap[nextTab] || 'overview');
  };

  const insights = useMemo(() => {
    if (!mainUser) return [];
    return [
      {
        text: `${shortName(mainUser)} completo ${completedAct.length} de ${activities.length} actividades asignadas`,
        type: activities.length === 0 ? 'neutral' : adherence >= 70 ? 'positive' : 'warning',
      },
      {
        text: todayEmotions.length > 0
          ? `Hoy registró ${todayEmotions.length} estado emocional`
          : 'Todavía no hay registro emocional de hoy',
        type: todayEmotions.length > 0 ? 'positive' : 'warning',
      },
      {
        text: `${notifications.filter(n => !n.read).length} notificaciones sin leer`,
        type: notifications.some(n => !n.read) ? 'warning' : 'positive',
      },
      {
        text: mainUser.canSelfManage
          ? 'Perfil marcado como autogestionable'
          : `Nivel de apoyo: ${mainUser.supportLevel} - autonomía ${mainUser.autonomy}`,
        type: mainUser.canSelfManage ? 'positive' : 'neutral',
      },
    ] as const;
  }, [mainUser, activities.length, completedAct.length, adherence, todayEmotions.length, notifications]);

  if (!user || user.role !== 'tutor') return null;

  const primaryTabs = tabs.filter(item => ['overview', 'connections', 'calendar', 'activities', 'chat', 'profile'].includes(item.id));
  const secondaryTabs = tabs.filter(item => !primaryTabs.some(primary => primary.id === item.id));
  const chatProfiles = [
    { id: String(user.id), name: user.name, avatar: (user as any).avatar, label: 'Tutor' },
    ...linkedUsers.map(linked => ({
      id: String(linked.id),
      name: linked.name,
      avatar: linked.avatar,
      label: 'Perteneciente',
    })),
  ];
  const isBelongingTab = belongingTabs.some(item => item.id === tab);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <AppHeader
        onMenuClick={() => { setMenuPanel('main'); setMenuOpen(true); }}
        onBack={onBack}
        rightSlot={
          <>
            <HeaderUserAvatar avatar={user.avatar} name={user.name} />
            <NotificationBellButton count={unreadCount} onClick={() => setTab('notifications')} />
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
                          <button key={item.id} onClick={() => { setTab(item.id); setMenuOpen(false); setMenuPanel('main'); }} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-colors ${tab === item.id ? 'bg-[#C9A7EB]/40 text-[#7C3AED] font-semibold' : 'text-muted-foreground'} hover:bg-[#C9A7EB]/50 hover:text-[#7C3AED]`}>
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
                    {linkedUsers.map((linked, index) => (
                      <button key={linked.id} type="button" onClick={() => { setSelectedUser(index); setTab('overview'); setMenuOpen(false); setMenuPanel('main'); }} className={`group min-h-[150px] rounded-2xl border p-3 text-center transition ${selectedUser === index ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-border bg-background hover:border-primary/50 hover:bg-primary/5'}`}>
                        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-card text-4xl shadow-sm transition group-hover:scale-105">{linked.avatar}</span>
                        <span className="mt-3 block truncate text-sm font-semibold text-foreground">{linked.name}</span>
                        <span className="mt-1 block truncate text-[11px] text-muted-foreground">{linked.supportLevel}</span>
                      </button>
                    ))}
                    <button type="button" onClick={() => { setTab('connections'); setMenuOpen(false); setMenuPanel('main'); }} className="min-h-[150px] rounded-2xl border border-dashed border-primary/45 bg-primary/5 p-3 text-center text-primary transition hover:bg-primary/10">
                      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-primary shadow-sm"><Plus size={28} /></span>
                      <span className="mt-3 block text-sm font-semibold">Vincular nuevo usuario</span>
                    </button>
                  </div>
                  {linkedUsers.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">No hay pertenecientes vinculados.</p>}
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

      {linkedUsers.length > 0 && (
        <section className="hidden">
          <div className="mx-auto max-w-4xl space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Perteneciente vinculado</p>
                <p className="text-sm text-muted-foreground">Elegí sobre quién querés ver o editar la información.</p>
              </div>
              {linkedUsers.length > 1 && (
                <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                  {linkedUsers.length} vinculados
                </span>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {linkedUsers.map((u, i) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(i)}
                  className={`rounded-lg border p-3 text-left transition ${
                    selectedUser === i ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{u.avatar}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{u.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.supportLevel} - {u.autonomy}</p>
                    </div>
                    {u.isPrimaryTutor && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        Principal
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-4 py-4">
        {linkedUsers.length > 0 && (
          <aside className="hidden">
            <div className="sticky top-[86px] space-y-3 rounded-xl border border-border bg-card p-3 shadow-sm">
              <div className="flex items-center justify-between gap-3 px-1">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Viendo datos de</p>
                  <p className="truncate font-heading text-lg font-bold text-foreground">{mainUser?.name || 'Perteneciente'}</p>
                </div>
                {linkedUsers.length > 1 && (
                  <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                    {linkedUsers.length}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {linkedUsers.map((u, i) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUser(i)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      selectedUser === i
                        ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/15'
                        : 'border-border bg-background hover:border-primary/40 hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card text-2xl shadow-sm">
                        {u.avatar}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{u.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.supportLevel}</p>
                      </div>
                      {selectedUser === i && <CheckCircle2 size={17} className="shrink-0 text-primary" />}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                      <span className="truncate text-muted-foreground">{u.autonomy}</span>
                      {u.isPrimaryTutor && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                          Principal
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        <main className="min-w-0 space-y-4">
        {!loading && !error && mainUser && isBelongingTab && (
          <section className="sticky top-[72px] z-30 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
            <div className="mx-auto max-w-7xl space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card text-3xl shadow-sm">
                  {mainUser.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-base font-bold text-foreground">{mainUser.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Nivel {mainUser.level} - {mainUser.points} pts - {mainUser.supportLevel} - {mainUser.linkStatus}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-success">{weeklyAdherence}%</p>
                  <p className="text-[10px] text-muted-foreground">adherencia semanal</p>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {belongingTabs.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${
                      tab === item.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
        {loading && (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Loader2 size={28} className="mx-auto animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Cargando datos reales del backend...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-card rounded-xl border border-destructive/30 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-foreground">No se pudo cargar el panel</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button size="sm" variant="outline" onClick={load}>Reintentar</Button>
            </div>
          </div>
        )}

        {!loading && !error && !mainUser && tab !== 'notifications' && tab !== 'connections' && tab !== 'chat' && tab !== 'agenda' && tab !== 'pictograms' && tab !== 'directory' && (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Shield size={30} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold text-foreground">No hay pertenecientes vinculados</p>
            <p className="text-sm text-muted-foreground mt-1">
              El backend no devolvio vinculos activos para este tutor.
            </p>
          </div>
        )}

        {!loading && !error && tab === 'notifications' && (
          <UserNotifications onUnreadCountChange={setUnreadCount} onNavigate={navigateFromNotification} />
        )}

        {!loading && !error && tab === 'chat' && (
          <ChatProvider>
            <ChatScreen
              key={selectedNotificationChatId ? `chat-${selectedNotificationChatId}` : 'chat'}
              profiles={chatProfiles}
              defaultProfileId={String(user.id)}
              defaultSelectedId={selectedNotificationChatId}
            />
          </ChatProvider>
        )}

        {!loading && !error && tab === 'agenda' && (
          <TutorCalendar userId={user.id} events={tutorAgendaEvents} onChanged={loadTutorAgenda} compact />
        )}

        {!loading && !error && tab === 'pictograms' && <AiPictogramStudio />}
        {!loading && !error && tab === 'directory' && <ProfessionalDirectory />}

        {!loading && !error && tab === 'connections' && (
          <TutorConnections initialPertenecienteId={mainUser?.pertenecienteId} />
        )}

        {!loading && !error && mainUser && tab !== 'notifications' && tab !== 'chat' && tab !== 'agenda' && tab !== 'connections' && tab !== 'pictograms' && tab !== 'directory' && (
          <>
            <div className="hidden">
              <span className="text-4xl">{mainUser.avatar}</span>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-foreground truncate">{mainUser.name}</p>
                <p className="text-xs text-muted-foreground">
                  Nivel {mainUser.level} - {mainUser.points} pts - {mainUser.supportLevel} - {mainUser.linkStatus}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-success">{adherence}%</p>
                <p className="text-[10px] text-muted-foreground">adherencia</p>
              </div>
            </div>

            {tab === 'activities' && (
              <TutorActivitiesPanel
                mainUser={mainUser}
                linkedUsers={linkedUsers}
                activities={activities}
              />
            )}
            {tab === 'overview' && (
              <Stats
                activities={activities}
                emotions={emotions}
                events={events}
                adherence={adherence}
                mainUser={mainUser}
                onNavigate={setTab}
              />
            )}
            {tab === 'stats' && (
              <TutorAdvancedStats
                activities={activities}
                emotions={emotions}
                events={events}
                adherence={adherence}
                mainUser={mainUser}
              />
            )}
            {tab === 'insights' && <Insights insights={insights} pending={pendingAct.length} />}
            {tab === 'location' && <Locations locations={locations} />}
            {tab === 'emotions' && <Emotions emotions={emotions} />}
            {tab === 'calendar' && <TutorCalendar userId={mainUser.id} events={events} onChanged={() => load(mainUser.id)} />}
            {tab === 'profile' && <TutorLinkedProfile userId={mainUser.id} fallback={mainUser} onConfigure={() => setTab('settings')} />}
            {tab === 'settings' && <TutorLinkedSettings userId={mainUser.id} onSaved={() => load(mainUser.id)} />}
          </>
        )}
        </main>
      </div>

      <nav className="hidden">
        <div className="mx-auto grid max-w-lg grid-cols-6 gap-1">
          {primaryTabs.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium ${
                tab === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              <item.icon size={18} />
              <span className="leading-none">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function Stats({
  activities,
  emotions,
  events,
  adherence,
  mainUser,
  onNavigate,
}: {
  activities: TutorHomeData['byUserId'][string]['activities'];
  emotions: TutorHomeData['byUserId'][string]['emotions'];
  events: TutorHomeData['byUserId'][string]['events'];
  adherence: number;
  mainUser: TutorHomeLinkedUser;
  onNavigate?: (tab: TabId) => void;
}) {
  const completed = activities.filter(a => a.completed);

  const byStatus = activities.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const weeklyActivities = activities.filter(a => {
    const d = new Date(a.assignedAt);
    return d >= weekAgo && d <= today;
  });
  const weeklyCompleted = weeklyActivities.filter(a => a.completed);
  const weeklyAdherence = weeklyActivities.length
    ? clampPct((weeklyCompleted.length / weeklyActivities.length) * 100)
    : 0;

  const lastWeekEmotions = emotions
    .filter(e => {
      const d = new Date(e.date);
      return d >= weekAgo && d <= today;
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={CheckCircle2} label="Adherencia semanal" value={`${weeklyAdherence}%`} />
        <Kpi icon={Award} label="Completadas" value={`${completed.length}/${activities.length}`} />
        <Kpi icon={TrendingUp} label="Racha" value={`${mainUser.streak} dias`} />
        <Kpi icon={Target} label="Puntos" value={`${mainUser.points} pts`} />
      </div>

      {onNavigate && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-primary" /> Acceso rapido
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button onClick={() => onNavigate('activities')} className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-background p-3 hover:border-primary hover:bg-primary/5 transition-colors">
              <Plus size={20} className="text-primary" />
              <span className="text-xs font-medium text-foreground">Nueva Actividad</span>
            </button>
            <button onClick={() => onNavigate('calendar')} className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-background p-3 hover:border-primary hover:bg-primary/5 transition-colors">
              <Calendar size={20} className="text-primary" />
              <span className="text-xs font-medium text-foreground">Ver Calendario</span>
            </button>
            <button onClick={() => onNavigate('chat')} className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-background p-3 hover:border-primary hover:bg-primary/5 transition-colors">
              <MessageCircle size={20} className="text-primary" />
              <span className="text-xs font-medium text-foreground">Enviar Mensaje</span>
            </button>
            <button onClick={() => onNavigate('connections')} className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-background p-3 hover:border-primary hover:bg-primary/5 transition-colors">
              <Users size={20} className="text-primary" />
              <span className="text-xs font-medium text-foreground">Vincular Usuario</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" /> Estado de actividades
          </h3>
          <div className="space-y-3">
            {Object.entries(byStatus).map(([status, count]) => {
              const pct = activities.length ? clampPct((count / activities.length) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground">{status}</span>
                    <span className="text-muted-foreground">{count} - {pct}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-1">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-2 rounded-full gradient-primary" />
                  </div>
                </div>
              );
            })}
            {Object.keys(byStatus).length === 0 && <EmptyText text="Todavía no hay actividades para medir." />}
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Heart size={16} className="text-primary" /> Últimas emociones
          </h3>
          <p className="text-xs text-muted-foreground mb-2">Registros de los ultimos 7 dias</p>
          <div className="space-y-1.5">
            {lastWeekEmotions.map((emotion, index) => (
              <div key={`${emotion.date}-${emotion.emotion}-${index}`} className="flex items-center gap-2">
                <span className="text-xs w-24 text-foreground truncate">{emotion.emotion}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div className="h-2 rounded-full gradient-primary" style={{ width: `${clampPct((emotion.intensity / 5) * 100)}%` }} />
                </div>
                <span className="text-xs font-bold w-12 text-right text-muted-foreground">{emotion.intensity}/5</span>
              </div>
            ))}
            {lastWeekEmotions.length === 0 && <EmptyText text="Sin registros emocionales recientes." />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Calendar size={16} className="text-primary" /> Proximos eventos ({upcomingEvents.length})
          </h3>
          <div className="space-y-2">
            {upcomingEvents.map(e => (
              <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                <div className="w-2 h-10 rounded-full" style={{ background: e.color || 'var(--primary)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.date} &middot; {e.time}</p>
                </div>
                <Clock size={14} className="text-muted-foreground shrink-0" />
              </div>
            ))}
            {upcomingEvents.length === 0 && <EmptyText text="No hay eventos proximos." />}
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Shield size={16} className="text-primary" /> Perfil de apoyo
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <InfoItem label="Nivel" value={mainUser.level} />
            <InfoItem label="Puntos" value={mainUser.points} />
            <InfoItem label="Nivel de apoyo" value={mainUser.supportLevel} />
            <InfoItem label="Autonomía" value={mainUser.autonomy} />
          </div>
        </div>
      </div>
    </div>
  );
}
function TutorActivitiesPanel({
  mainUser,
  linkedUsers,
  activities,
}: {
  mainUser: TutorHomeLinkedUser;
  linkedUsers: TutorHomeLinkedUser[];
  activities: TutorHomeData['byUserId'][string]['activities'];
}) {
  const { forUser } = useCustomActivities();
  const customActivities = forUser(mainUser.id);
  const visibleActivities = [
    ...customActivities.map(activity => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      category: activity.category,
      difficulty: activity.difficulty,
      points: activity.points,
      status: activity.status,
      completed: activity.status === 'completada',
      assignedAt: new Date(activity.createdAt).toLocaleDateString('es-AR'),
      completedAt: undefined,
      source: activity.gameType ? `Juego: ${activity.gameType}` : 'Actividad creada',
    })),
    ...activities.map(activity => ({ ...activity, source: 'Backend' })),
  ];
  const completed = visibleActivities.filter(activity => activity.completed).length;
  const pending = visibleActivities.length - completed;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Actividades</h2>
            <p className="text-sm text-muted-foreground">
              Seguimiento de {mainUser.name} y creacion de actividades para tus pertenecientes.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[300px]">
            <div className="rounded-lg bg-muted/50 p-2 text-center">
              <p className="text-lg font-bold text-foreground">{visibleActivities.length}</p>
              <p className="text-[10px] text-muted-foreground">total</p>
            </div>
            <div className="rounded-lg bg-green-50 p-2 text-center">
              <p className="text-lg font-bold text-green-700">{completed}</p>
              <p className="text-[10px] text-green-700/80">hechas</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2 text-center">
              <p className="text-lg font-bold text-amber-700">{pending}</p>
              <p className="text-[10px] text-amber-700/80">pendientes</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-3">
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground">Lo que viene haciendo</h3>
            <p className="text-sm text-muted-foreground">Actividades asignadas y publicadas para {shortName(mainUser)}.</p>
          </div>
          <AssignedActivities activities={visibleActivities} />
        </section>

        <section className="space-y-3">
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground">Crear y asignar</h3>
            <p className="text-sm text-muted-foreground">Elegi una plantilla, carga el contenido y asignala a tus vinculados.</p>
          </div>
          <ActivityManager assignableUsers={linkedUsers} />
        </section>
      </div>
    </div>
  );
}

function AssignedActivities({
  activities,
}: {
  activities: Array<TutorHomeData['byUserId'][string]['activities'][number] & { source?: string }>;
}) {
  return (
    <div className="space-y-3">
      {activities.map(activity => (
        <div key={activity.id} className="bg-card rounded-lg p-3 border border-border">
          <div className="flex items-start gap-3">
            <Sparkles size={18} className="text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm text-foreground truncate">{activity.title}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  activity.completed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {activity.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground flex-wrap">
                <span>{activity.category}</span>
                <span>{activity.difficulty}</span>
                <span>{activity.points} pts</span>
                {activity.source && <span>{activity.source}</span>}
                <span>Asignada: {activity.assignedAt}</span>
                {activity.completedAt && <span>Completada: {activity.completedAt}</span>}
              </div>
            </div>
          </div>
        </div>
      ))}
      {activities.length === 0 && <EmptyCard text="No hay actividades asignadas en la base para este perteneciente." />}
    </div>
  );
}

function TutorCalendar({
  userId,
  events,
  onChanged,
  compact = false,
}: {
  userId: string;
  events: CalendarEvent[];
  onChanged: () => void;
  compact?: boolean;
}) {
  const handleCreate = async (data: Omit<CalendarEvent, 'id' | 'userId' | 'color'>) => {
    await createCalendarEvent(userId, { ...data, color: typeColorForEvent(data.type) });
    await onChanged();
  };
  const handleUpdate = async (id: string, patch: Partial<Omit<CalendarEvent, 'id' | 'userId'>>) => {
    await updateCalendarEvent(id, { ...patch, color: patch.type ? typeColorForEvent(patch.type) : undefined });
    await onChanged();
  };
  const handleDelete = async (id: string) => {
    await deleteCalendarEvent(id);
    await onChanged();
  };

  return (
    <PersonalEventCalendar
      heading={compact ? 'Agenda' : 'Calendario'}
      events={events}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}

function Insights({
  insights,
  pending,
}: {
  insights: readonly { text: string; type: 'positive' | 'warning' | 'neutral' }[];
  pending: number;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
          <Shield size={16} className="text-primary" /> Insights automaticos
        </h3>
        <div className="space-y-2">
          {insights.map((ins, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${
              ins.type === 'positive'
                ? 'bg-green-50 border-green-200'
                : ins.type === 'warning'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-muted/50 border-border'
            }`}>
              {ins.type === 'positive' ? <CheckCircle2 size={16} className="text-green-600" /> : ins.type === 'warning' ? <AlertTriangle size={16} className="text-amber-600" /> : <Shield size={16} className="text-muted-foreground" />}
              <p className="text-sm text-foreground">{ins.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-heading font-semibold text-foreground mb-3">Alertas activas</h3>
        {pending > 0 ? (
          <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle size={14} className="text-amber-600" />
            <span className="text-foreground">{pending} actividad(es) pendientes</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle2 size={14} className="text-green-600" />
            <span className="text-foreground">Sin actividades pendientes</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Locations({ locations }: { locations: TutorHomeData['byUserId'][string]['locations'] }) {
  return (
    <div className="space-y-3">
      {locations.map(location => (
        <div key={location.id} className="bg-card rounded-lg p-3 border border-border flex items-center gap-3">
          <MapPin size={18} className={location.type === 'actual' ? 'text-primary' : 'text-success'} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{location.name}</p>
            <p className="text-xs text-muted-foreground truncate">{location.address}</p>
            {location.timestamp && <p className="text-xs text-success">Ultimo reporte: {location.timestamp}</p>}
          </div>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {location.type}
          </span>
        </div>
      ))}
      {locations.length === 0 && <EmptyCard text="No hay ubicacion ni zonas seguras cargadas." />}
    </div>
  );
}

function Emotions({ emotions }: { emotions: TutorHomeData['byUserId'][string]['emotions'] }) {
  return (
    <div className="space-y-3">
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-heading font-semibold text-foreground mb-3">Resumen emocional</h3>
        <div className="flex gap-1">
          {emotions.slice(0, 7).map(emotion => (
            <div key={emotion.id} className="flex flex-col items-center flex-1">
              <span className="text-2xl">{emotion.emoji}</span>
              <span className="text-[8px] text-muted-foreground mt-1">{emotion.date.slice(5)}</span>
              <div className="flex gap-0.5 mt-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`w-1 h-1 rounded-full ${i < emotion.intensity ? 'bg-primary' : 'bg-muted'}`} />
                ))}
              </div>
            </div>
          ))}
          {emotions.length === 0 && <EmptyText text="No hay emociones registradas." />}
        </div>
      </div>

      {emotions.slice(0, 10).map(emotion => (
        <div key={emotion.id} className="bg-card rounded-lg p-3 border border-border flex items-start gap-3">
          <span className="text-2xl">{emotion.emoji}</span>
          <div className="min-w-0">
            <p className="font-medium text-sm text-foreground">{emotion.emotion} ({emotion.intensity}/5)</p>
            <p className="text-xs text-muted-foreground">{emotion.context}</p>
            {emotion.whatHelped && <p className="text-xs text-success mt-0.5">{emotion.whatHelped}</p>}
          </div>
          <span className="ml-auto text-[10px] text-muted-foreground">{emotion.date === todayKey() ? 'Hoy' : emotion.date}</span>
        </div>
      ))}
    </div>
  );
}

function TutorLinkedProfile({
  userId,
  fallback,
  onConfigure,
}: {
  userId: string;
  fallback: TutorHomeLinkedUser;
  onConfigure: () => void;
}) {
  const [profile, setProfile] = useState<UserProfileDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await fetchUserProfileDashboard(userId));
    } catch {
      setError('No se pudo cargar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const fullName = profile?.usuario
    ? [profile.usuario.nombre, profile.usuario.apellido].filter(Boolean).join(' ')
    : fallback.name;
  const username = profile?.usuario?.nombre_usuario || fallback.username;
  const email = profile?.usuario?.correo || fallback.email;
  const birthDate = profile?.usuario?.fecha_nacimiento
    ? new Date(profile.usuario.fecha_nacimiento).toLocaleDateString('es-AR')
    : 'Sin registrar';
  const joinedAt = profile?.usuario?.fecha_ingreso
    ? new Date(profile.usuario.fecha_ingreso).toLocaleDateString('es-AR')
    : 'Sin registrar';
  const support = [...(profile?.tutors || []), ...(profile?.professionals || [])];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Perfil de {shortName(fallback)}</h2>
          <p className="text-muted-foreground text-sm">Datos personales, apoyo y progreso desde la base.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="default" size="sm" onClick={onConfigure} className="gap-2">
            <Settings size={15} />
            Configurar
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <div className="flex h-28 w-28 items-center justify-center rounded-lg bg-primary/10 text-5xl">
            {fallback.avatar}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-heading font-bold text-foreground">{fullName}</h3>
            <p className="text-sm text-muted-foreground">@{username}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <InfoItem label="Nivel" value={profile?.level ?? fallback.level} />
              <InfoItem label="Puntos" value={profile?.points ?? fallback.points} />
              <InfoItem label="Experiencia" value={profile?.experience ?? 0} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoItem label="Correo" value={email || 'Sin registrar'} />
        <InfoItem label="Teléfono" value={profile?.usuario?.telefono ? String(profile.usuario.telefono) : 'Sin registrar'} />
        <InfoItem label="Nacimiento" value={birthDate} />
        <InfoItem label="Ingreso" value={joinedAt} />
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 font-heading font-semibold text-foreground">
          <UserRound size={16} className="text-primary" />
          Perfil de autonomía
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoItem label="Nivel de apoyo" value={profile?.supportLevel || fallback.supportLevel} />
          <InfoItem label="Autonomía" value={profile?.autonomy || fallback.autonomy} />
          <InfoItem label="Autogestión" value={(profile?.canSelfManage ?? fallback.canSelfManage) ? 'Habilitada' : 'Asistida'} />
        </div>
        {(profile?.observation || fallback.observation) && (
          <div className="mt-3 rounded-lg bg-muted/40 p-3">
            <p className="text-[11px] font-medium uppercase text-muted-foreground">Observación</p>
            <p className="mt-1 text-sm text-foreground">{profile?.observation || fallback.observation}</p>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 font-heading font-semibold text-foreground">
          <Shield size={16} className="text-primary" />
          Red de apoyo
        </h3>
        {support.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {support.map(person => (
              <div key={`${person.role}-${person.id}`} className="rounded-lg border border-border bg-card p-4">
                <p className="font-semibold text-sm text-foreground">{person.name}</p>
                <p className="text-xs text-muted-foreground">{person.detail}</p>
                <p className="mt-1 text-[11px] font-medium text-primary">{person.status}</p>
                {person.email && <p className="mt-2 text-xs text-muted-foreground">{person.email}</p>}
              </div>
            ))}
          </div>
        ) : (
          <EmptyCard text="No hay red de apoyo registrada." />
        )}
      </section>
    </div>
  );
}

type SettingsFormState = UserProfileSettingsPayload & {
  telefonoText: string;
};

const emptySettingsForm: SettingsFormState = {
  usuario: {
    nombre_usuario: '',
    nombre: '',
    apellido: '',
    correo: '',
    telefono: null,
    fecha_nacimiento: null,
  },
  perteneciente: {
    id_nivel_apoyo: 0,
    id_autonomia_operativa: 0,
    puede_autogestionarse: false,
    observacion_general: '',
  },
  preferences: {
    recibir_notificaciones: true,
    recordatorios_actividad: true,
    resumen_semanal: false,
    compartir_ubicacion: false,
    permitir_mensajes: true,
    mostrar_progreso_red_apoyo: true,
  },
  accessibility: {
    tamanio_texto: 'normal',
    contraste_alto: false,
    reducir_movimiento: false,
    pictogramas_grandes: false,
  },
  telefonoText: '',
};

function dateInputValue(value?: string | null) {
  if (!value) return '';
  return value.split('T')[0];
}

function TutorLinkedSettings({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [settings, setSettings] = useState<UserProfileSettings | null>(null);
  const [form, setForm] = useState<SettingsFormState>(emptySettingsForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchUserProfileSettings(userId);
      setSettings(next);
      setForm({
        usuario: {
          nombre_usuario: next.usuario?.nombre_usuario || '',
          nombre: next.usuario?.nombre || '',
          apellido: next.usuario?.apellido || '',
          correo: next.usuario?.correo || '',
          telefono: next.usuario?.telefono ?? null,
          fecha_nacimiento: dateInputValue(next.usuario?.fecha_nacimiento) || null,
        },
        perteneciente: {
          id_nivel_apoyo: next.perteneciente?.id_nivel_apoyo || next.supportLevels[0]?.id || 0,
          id_autonomia_operativa: next.perteneciente?.id_autonomia_operativa || next.autonomies[0]?.id || 0,
          puede_autogestionarse: Boolean(next.perteneciente?.puede_autogestionarse),
          observacion_general: next.perteneciente?.observacion_general || '',
        },
        preferences: next.preferences,
        accessibility: next.accessibility,
        telefonoText: next.usuario?.telefono ? String(next.usuario.telefono) : '',
      });
    } catch {
      setError('No se pudo cargar la configuracion.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const updateUsuario = <K extends keyof SettingsFormState['usuario']>(key: K, value: SettingsFormState['usuario'][K]) => {
    setForm(prev => ({ ...prev, usuario: { ...prev.usuario, [key]: value } }));
  };

  const updatePerteneciente = <K extends keyof SettingsFormState['perteneciente']>(key: K, value: SettingsFormState['perteneciente'][K]) => {
    setForm(prev => ({ ...prev, perteneciente: { ...prev.perteneciente, [key]: value } }));
  };

  const updatePreference = <K extends keyof SettingsFormState['preferences']>(key: K, value: boolean) => {
    setForm(prev => ({ ...prev, preferences: { ...prev.preferences, [key]: value } }));
  };

  const updateAccessibility = <K extends keyof SettingsFormState['accessibility']>(key: K, value: SettingsFormState['accessibility'][K]) => {
    setForm(prev => ({ ...prev, accessibility: { ...prev.accessibility, [key]: value } }));
  };

  const handlePhoneChange = (value: string) => {
    const sanitized = value.replace(/[^\d]/g, '');
    setForm(prev => ({
      ...prev,
      telefonoText: sanitized,
      usuario: { ...prev.usuario, telefono: sanitized ? Number(sanitized) : null },
    }));
  };

  const canSave = Boolean(
    form.usuario.nombre_usuario.trim() &&
    form.usuario.nombre.trim() &&
    form.usuario.apellido.trim() &&
    form.usuario.correo.trim() &&
    form.perteneciente.id_nivel_apoyo &&
    form.perteneciente.id_autonomia_operativa
  );

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await saveUserProfileSettings(userId, {
        usuario: {
          ...form.usuario,
          nombre_usuario: form.usuario.nombre_usuario.trim(),
          nombre: form.usuario.nombre.trim(),
          apellido: form.usuario.apellido.trim(),
          correo: form.usuario.correo.trim(),
          fecha_nacimiento: form.usuario.fecha_nacimiento || null,
        },
        perteneciente: {
          ...form.perteneciente,
          observacion_general: form.perteneciente.observacion_general?.trim() || null,
        },
        preferences: form.preferences,
        accessibility: form.accessibility,
      });
      toast({ title: 'Configuracion guardada' });
      await loadSettings();
      onSaved();
    } catch {
      setError('No se pudieron guardar los cambios.');
      toast({ title: 'No se pudo guardar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Configuración del perteneciente</h2>
          <p className="text-sm text-muted-foreground">Datos personales, autonomía, privacidad y accesibilidad.</p>
        </div>
        <Button type="button" size="sm" disabled={loading || saving || !canSave} onClick={submit} className="gap-2">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Guardar
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {loading && !settings ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          Cargando configuración...
        </div>
      ) : (
        <>
          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <SectionHeader icon={UserRound} title="Datos personales" description="Información visible para la cuenta y red de apoyo." />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={form.usuario.nombre} onChange={e => updateUsuario('nombre', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input value={form.usuario.apellido} onChange={e => updateUsuario('apellido', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Usuario</Label>
                <Input value={form.usuario.nombre_usuario} onChange={e => updateUsuario('nombre_usuario', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Correo</Label>
                <Input type="email" value={form.usuario.correo} onChange={e => updateUsuario('correo', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input inputMode="numeric" value={form.telefonoText} onChange={e => handlePhoneChange(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fecha de nacimiento</Label>
                <Input type="date" value={form.usuario.fecha_nacimiento || ''} onChange={e => updateUsuario('fecha_nacimiento', e.target.value || null)} />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <SectionHeader icon={Shield} title="Perfil perteneciente" description="Configuración de apoyo, autonomía y observaciones." />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nivel de apoyo</Label>
                <Select value={String(form.perteneciente.id_nivel_apoyo || '')} onValueChange={value => updatePerteneciente('id_nivel_apoyo', Number(value))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar nivel" /></SelectTrigger>
                  <SelectContent>
                    {(settings?.supportLevels || []).map(level => <SelectItem key={level.id} value={String(level.id)}>{level.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Autonomía operativa</Label>
                <Select value={String(form.perteneciente.id_autonomia_operativa || '')} onValueChange={value => updatePerteneciente('id_autonomia_operativa', Number(value))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar autonomía" /></SelectTrigger>
                  <SelectContent>
                    {(settings?.autonomies || []).map(autonomy => <SelectItem key={autonomy.id} value={String(autonomy.id)}>{autonomy.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <ToggleRow
                  label="Autogestión habilitada"
                  description="Permite completar acciones personales sin aprobación previa."
                  checked={form.perteneciente.puede_autogestionarse}
                  onChange={value => updatePerteneciente('puede_autogestionarse', value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Observación general</Label>
                <Textarea value={form.perteneciente.observacion_general || ''} onChange={e => updatePerteneciente('observacion_general', e.target.value)} rows={4} />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <SectionHeader icon={Settings} title="Preferencias y privacidad" description="Controles guardados en configuración del usuario." />
            <div className="grid gap-3 md:grid-cols-2">
              <ToggleRow label="Notificaciones" description="Recibir avisos importantes." checked={form.preferences.recibir_notificaciones} onChange={value => updatePreference('recibir_notificaciones', value)} />
              <ToggleRow label="Recordatorios" description="Avisos de actividades pendientes." checked={form.preferences.recordatorios_actividad} onChange={value => updatePreference('recordatorios_actividad', value)} />
              <ToggleRow label="Resumen semanal" description="Guardar preferencia de reporte semanal." checked={form.preferences.resumen_semanal} onChange={value => updatePreference('resumen_semanal', value)} />
              <ToggleRow label="Compartir ubicación" description="Permitir uso de ubicación con apoyo autorizado." checked={form.preferences.compartir_ubicacion} onChange={value => updatePreference('compartir_ubicacion', value)} />
              <ToggleRow label="Mensajes" description="Permitir mensajes dentro de TÁNDEM." checked={form.preferences.permitir_mensajes} onChange={value => updatePreference('permitir_mensajes', value)} />
              <ToggleRow label="Progreso visible" description="Mostrar progreso a la red de apoyo." checked={form.preferences.mostrar_progreso_red_apoyo} onChange={value => updatePreference('mostrar_progreso_red_apoyo', value)} />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <SectionHeader icon={UserRound} title="Accesibilidad" description="Preferencias visuales personales." />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2 rounded-lg border border-border bg-background p-3">
                <Label>Tamaño de texto</Label>
                <Select value={form.accessibility.tamanio_texto} onValueChange={value => updateAccessibility('tamanio_texto', value as SettingsFormState['accessibility']['tamanio_texto'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="grande">Grande</SelectItem>
                    <SelectItem value="muy_grande">Muy grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ToggleRow label="Alto contraste" description="Preferencia visual para contraste alto." checked={form.accessibility.contraste_alto} onChange={value => updateAccessibility('contraste_alto', value)} />
              <ToggleRow label="Reducir movimiento" description="Evitar animaciones intensas." checked={form.accessibility.reducir_movimiento} onChange={value => updateAccessibility('reducir_movimiento', value)} />
              <ToggleRow label="Pictogramas grandes" description="Mostrar pictogramas con mayor tamaño." checked={form.accessibility.pictogramas_grandes} onChange={value => updateAccessibility('pictogramas_grandes', value)} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function CalendarList({ events }: { events: TutorHomeData['byUserId'][string]['events'] }) {
  return (
    <div className="space-y-3">
      {[...events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 20).map(event => (
        <div key={event.id} className="bg-card rounded-lg p-3 border border-border flex items-center gap-3">
          <Calendar size={16} className="text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
            <p className="text-xs text-muted-foreground">{event.date} - {event.time}</p>
          </div>
        </div>
      ))}
      {events.length === 0 && <EmptyCard text="No hay eventos en calendario." />}
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: typeof CheckCircle2; label: string; value: string }) {
  return (
    <div className="bg-card rounded-xl p-3 border border-border text-center">
      <Icon size={20} className="mx-auto text-primary" />
      <p className="font-bold text-foreground mt-1">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string | number | boolean }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-[11px] font-medium uppercase tracking-normal text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{String(value)}</p>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description }: {
  icon: typeof UserRound;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="font-heading text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="bg-card rounded-xl border border-dashed border-border p-8 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}


