import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Loader2,
  LogOut,
  Menu,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import ActivityManager from '@/components/ActivityManager';
import ChatScreen from '@/components/ChatScreen';
import { useCustomActivities } from '@/contexts/CustomActivitiesContext';
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
import { eventTypes, typeEmoji } from '@/contexts/CalendarContext';
import { toast } from '@/hooks/ui/use-toast';

type TabId =
  | 'overview'
  | 'stats'
  | 'agenda'
  | 'activities'
  | 'chat'
  | 'location'
  | 'emotions'
  | 'calendar'
  | 'insights'
  | 'profile'
  | 'settings';

const tabs: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
  { id: 'overview', label: 'Resumen', icon: BarChart3 },
  { id: 'stats', label: 'Estadisticas', icon: TrendingUp },
  { id: 'agenda', label: 'Agenda', icon: Clock },
  { id: 'activities', label: 'Actividades', icon: Sparkles },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'location', label: 'Ubicacion', icon: MapPin },
  { id: 'emotions', label: 'Emociones', icon: Heart },
  { id: 'calendar', label: 'Calendario', icon: Calendar },
  { id: 'insights', label: 'Tranquilidad', icon: Shield },
  { id: 'profile', label: 'Perfil', icon: UserRound },
  { id: 'settings', label: 'Config', icon: Settings },
];

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const dayNamesShort = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

const typeBg: Record<CalendarEvent['type'], string> = {
  terapia: 'bg-purple-100 text-purple-700 border-purple-200',
  escuela: 'bg-blue-100 text-blue-700 border-blue-200',
  personal: 'bg-amber-100 text-amber-700 border-amber-200',
  médico: 'bg-red-100 text-red-700 border-red-200',
  social: 'bg-green-100 text-green-700 border-green-200',
  actividad: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

function fmt(d: Date) {
  return d.toISOString().split('T')[0];
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

export default function TutorDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<TabId>('overview');
  const [selectedUser, setSelectedUser] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [data, setData] = useState<TutorHomeData | null>(null);
  const [tutorAgendaEvents, setTutorAgendaEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    load();
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

  const insights = useMemo(() => {
    if (!mainUser) return [];
    return [
      {
        text: `${shortName(mainUser)} completo ${completedAct.length} de ${activities.length} actividades asignadas`,
        type: activities.length === 0 ? 'neutral' : adherence >= 70 ? 'positive' : 'warning',
      },
      {
        text: todayEmotions.length > 0
          ? `Hoy registro ${todayEmotions.length} estado emocional`
          : 'Todavia no hay registro emocional de hoy',
        type: todayEmotions.length > 0 ? 'positive' : 'warning',
      },
      {
        text: `${notifications.filter(n => !n.read).length} notificaciones sin leer`,
        type: notifications.some(n => !n.read) ? 'warning' : 'positive',
      },
      {
        text: mainUser.canSelfManage
          ? 'Perfil marcado como autogestionable'
          : `Nivel de apoyo: ${mainUser.supportLevel} - autonomia ${mainUser.autonomy}`,
        type: mainUser.canSelfManage ? 'positive' : 'neutral',
      },
    ] as const;
  }, [mainUser, activities.length, completedAct.length, adherence, todayEmotions.length, notifications]);

  if (!user || user.role !== 'tutor') return null;

  const primaryTabs = tabs.filter(item => ['overview', 'calendar', 'activities', 'chat', 'profile'].includes(item.id));
  const secondaryTabs = tabs.filter(item => !primaryTabs.some(primary => primary.id === item.id));

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <button
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground md:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <div className="min-w-[150px] flex-1 md:flex-none">
            <h1 className="font-heading font-bold text-gradient text-lg">TANDEM</h1>
            <p className="truncate text-xs text-muted-foreground">Panel de tutor - {user.name}</p>
          </div>
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 rounded-xl border border-border bg-background/70 p-1 md:flex">
            {primaryTabs.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setDesktopMenuOpen(false);
                }}
                className={`flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition lg:px-4 ${
                  tab === t.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-card hover:text-foreground'
                }`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </nav>
          <div className="relative hidden md:block">
            <button
              onClick={() => setDesktopMenuOpen(open => !open)}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border text-foreground transition ${
                secondaryTabs.some(item => item.id === tab)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-muted'
              }`}
              aria-label="Abrir mas secciones"
              aria-expanded={desktopMenuOpen}
            >
              <Menu size={19} />
            </button>
            {desktopMenuOpen && (
              <div className="absolute right-0 top-12 w-56 rounded-xl border border-border bg-card p-2 shadow-xl">
                <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase text-muted-foreground">Mas secciones</p>
                <div className="space-y-1">
                  {secondaryTabs.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setTab(item.id);
                        setDesktopMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                        tab === item.id ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <item.icon size={16} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => load(mainUser?.id)} disabled={loading} aria-label="Recargar">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} aria-label="Cerrar sesion">
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.button
              aria-label="Cerrar menu"
              className="absolute inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="relative h-full w-[82vw] max-w-[320px] bg-card border-r border-border p-4 shadow-xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="font-heading font-bold text-gradient">TANDEM</p>
                  <p className="text-xs text-muted-foreground">Navegacion del tutor</p>
                </div>
                <button onClick={() => setMenuOpen(false)} className="rounded-lg p-2 hover:bg-muted" aria-label="Cerrar menu">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-1">
                {tabs.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setTab(item.id); setMenuOpen(false); }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm ${
                      tab === item.id ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {linkedUsers.length > 0 && (
        <section className="border-b border-border bg-background px-4 py-4 lg:hidden">
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

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        {linkedUsers.length > 0 && (
          <aside className="hidden lg:block">
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

        {!loading && !error && !mainUser && (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Shield size={30} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold text-foreground">No hay pertenecientes vinculados</p>
            <p className="text-sm text-muted-foreground mt-1">
              El backend no devolvio vinculos activos para este tutor.
            </p>
          </div>
        )}

        {!loading && !error && mainUser && (
          <>
            <div className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
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

            {tab === 'chat' && <ChatScreen />}
            {tab === 'activities' && (
              <TutorActivitiesPanel
                mainUser={mainUser}
                linkedUsers={linkedUsers}
                activities={activities}
              />
            )}
            {tab === 'overview' && (
              <Overview
                mainUser={mainUser}
                activities={activities}
                completedCount={completedAct.length}
                todayEmotions={todayEmotions.length}
                events={events}
                adherence={adherence}
              />
            )}
            {tab === 'stats' && (
              <Stats activities={activities} emotions={emotions} events={events} adherence={adherence} />
            )}
            {tab === 'agenda' && <TutorCalendar userId={user.id} events={tutorAgendaEvents} onChanged={loadTutorAgenda} compact />}
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

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
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

function Overview({
  mainUser,
  activities,
  completedCount,
  todayEmotions,
  events,
  adherence,
}: {
  mainUser: TutorHomeLinkedUser;
  activities: TutorHomeData['byUserId'][string]['activities'];
  completedCount: number;
  todayEmotions: number;
  events: TutorHomeData['byUserId'][string]['events'];
  adherence: number;
}) {
  const activeObjectives = activities.filter(a => !a.completed).slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={CheckCircle2} label="Completadas" value={`${completedCount}/${activities.length}`} />
        <Kpi icon={TrendingUp} label="Adherencia" value={`${adherence}%`} />
        <Kpi icon={Heart} label="Emociones hoy" value={String(todayEmotions)} />
        <Kpi icon={Calendar} label="Eventos" value={String(events.length)} />
      </div>

      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" /> Actividades asignadas
        </h3>
        <div className="space-y-3">
          {activities.slice(0, 6).map(activity => (
            <div key={activity.id}>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-foreground truncate">{activity.title}</span>
                <span className={activity.completed ? 'text-success' : 'text-muted-foreground'}>
                  {activity.status}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-1">
                <div className="bg-primary h-2 rounded-full" style={{ width: activity.completed ? '100%' : '35%' }} />
              </div>
            </div>
          ))}
          {activities.length === 0 && <EmptyText text="No hay actividades asignadas desde la base." />}
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
          <Target size={16} className="text-primary" /> Seguimiento de {shortName(mainUser)}
        </h3>
        <div className="space-y-2">
          <InfoLine label="Autonomia" value={mainUser.autonomy} />
          <InfoLine label="Nivel de apoyo" value={mainUser.supportLevel} />
          <InfoLine label="Autogestion" value={mainUser.canSelfManage ? 'Habilitada' : 'Asistida'} />
          {mainUser.observation && <InfoLine label="Observacion" value={mainUser.observation} />}
        </div>
        {activeObjectives.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            Pendientes recientes: {activeObjectives.map(a => a.title).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}

function Stats({
  activities,
  emotions,
  events,
  adherence,
}: {
  activities: TutorHomeData['byUserId'][string]['activities'];
  emotions: TutorHomeData['byUserId'][string]['emotions'];
  events: TutorHomeData['byUserId'][string]['events'];
  adherence: number;
}) {
  const completed = activities.filter(a => a.completed);
  const emotionAvg = emotions.length
    ? (emotions.reduce((sum, e) => sum + e.intensity, 0) / emotions.length).toFixed(1)
    : '0';
  const byStatus = activities.reduce<Record<string, number>>((acc, activity) => {
    acc[activity.status] = (acc[activity.status] || 0) + 1;
    return acc;
  }, {});
  const bars = Object.entries(byStatus);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={CheckCircle2} label="Adherencia" value={`${adherence}%`} />
        <Kpi icon={Clock} label="Tiempo activo" value={`${completed.length * 10} min`} />
        <Kpi icon={Heart} label="Intensidad prom." value={`${emotionAvg}/5`} />
        <Kpi icon={Calendar} label="Agenda" value={String(events.length)} />
      </div>

      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
          <BarChart3 size={16} className="text-primary" /> Estado de actividades
        </h3>
        <div className="space-y-3">
          {bars.map(([status, count]) => {
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
          {bars.length === 0 && <EmptyText text="Todavia no hay actividades para medir." />}
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
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(fmt(today));
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<CalendarEvent, 'id' | 'userId' | 'color'>>({
    title: '',
    date: fmt(today),
    time: '09:00',
    type: 'personal',
    description: '',
  });

  const eventsOn = (date: string) => events.filter(event => event.date === date);

  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor, compact]);

  const dayEvents = eventsOn(selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  const monthLabel = `${monthNames[cursor.getMonth()]} ${cursor.getFullYear()}`;

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', date: selectedDate, time: '09:00', type: 'personal', description: '' });
    setShowForm(true);
  };

  const openEdit = (event: CalendarEvent) => {
    setEditing(event);
    setForm({
      title: event.title,
      date: event.date,
      time: event.time,
      type: event.type,
      description: event.description,
    });
    setShowForm(true);
  };

  const submit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, color: typeColorForEvent(form.type) };
      if (editing) await updateCalendarEvent(editing.id, payload);
      else await createCalendarEvent(userId, payload);
      setShowForm(false);
      setSelectedDate(form.date);
      await onChanged();
      toast({ title: editing ? 'Evento actualizado' : 'Evento creado' });
    } catch {
      toast({ title: 'No se pudo guardar el evento', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (eventId: string) => {
    if (!confirm('Eliminar evento?')) return;
    try {
      await deleteCalendarEvent(eventId);
      await onChanged();
      toast({ title: 'Evento eliminado' });
    } catch {
      toast({ title: 'No se pudo eliminar el evento', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">{compact ? 'Agenda' : 'Calendario'}</h2>
          <p className="text-muted-foreground text-sm">{monthLabel}</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg gradient-primary text-primary-foreground text-sm">
          <Plus size={16} /> Evento
        </button>
      </div>

      <div className="flex items-center justify-between bg-card rounded-xl border border-border p-2">
        <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-muted text-foreground">
          <ChevronLeft size={18} />
        </button>
        <button onClick={() => { setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDate(fmt(today)); }} className="text-sm font-semibold text-foreground px-3 py-1 rounded-lg hover:bg-muted">
          {monthLabel}
        </button>
        <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-muted text-foreground">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border p-2 sm:p-3">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNamesShort.map(day => (
            <div key={day} className="text-[10px] sm:text-xs font-semibold text-center text-muted-foreground py-1">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((day, i) => {
            const ds = fmt(day);
            const isCurrentMonth = day.getMonth() === cursor.getMonth();
            const isToday = ds === fmt(today);
            const isSelected = ds === selectedDate;
            const dayEventsForCell = eventsOn(ds);
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(ds)}
                className={`relative aspect-square sm:aspect-auto sm:min-h-[72px] p-1 sm:p-1.5 rounded-lg border text-left transition-all flex flex-col ${
                  isSelected ? 'border-primary ring-2 ring-primary/30 bg-primary/5' :
                  isToday ? 'border-primary/40 bg-primary/5' :
                  isCurrentMonth ? 'border-border bg-background hover:border-primary/30' :
                  'border-transparent bg-muted/30 text-muted-foreground'
                }`}
              >
                <span className={`text-xs sm:text-sm font-semibold ${isToday ? 'text-primary' : ''}`}>{day.getDate()}</span>
                <div className="flex flex-col gap-0.5 mt-0.5 overflow-hidden">
                  {dayEventsForCell.slice(0, 2).map(event => (
                    <span key={event.id} className="hidden sm:block text-[9px] truncate px-1 rounded" style={{ backgroundColor: event.color, color: 'white' }}>
                      {typeEmoji[event.type]} {event.title}
                    </span>
                  ))}
                  {dayEventsForCell.length > 0 && (
                    <span className="sm:hidden flex gap-0.5 absolute bottom-1 left-1/2 -translate-x-1/2">
                      {dayEventsForCell.slice(0, 3).map(event => (
                        <span key={event.id} className="w-1 h-1 rounded-full" style={{ backgroundColor: event.color }} />
                      ))}
                    </span>
                  )}
                  {dayEventsForCell.length > 2 && <span className="hidden sm:block text-[9px] text-muted-foreground">+{dayEventsForCell.length - 2}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card rounded-xl p-4 border border-primary/30 shadow-sm space-y-3 overflow-hidden">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-foreground">{editing ? 'Editar evento' : 'Nuevo evento'}</h4>
              <button onClick={() => setShowForm(false)}><X size={16} className="text-muted-foreground" /></button>
            </div>
            <input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Titulo del evento" className="w-full p-2 rounded-lg border border-border bg-background text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))} className="p-2 rounded-lg border border-border bg-background text-sm" />
              <input type="time" value={form.time} onChange={e => setForm(prev => ({ ...prev, time: e.target.value }))} className="p-2 rounded-lg border border-border bg-background text-sm" />
            </div>
            <select value={form.type} onChange={e => setForm(prev => ({ ...prev, type: e.target.value as CalendarEvent['type'] }))} className="w-full p-2 rounded-lg border border-border bg-background text-sm">
              {eventTypes.map(type => <option key={type} value={type}>{typeEmoji[type]} {type}</option>)}
            </select>
            <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Descripcion opcional" className="w-full p-2 rounded-lg border border-border bg-background text-sm resize-none h-16" />
            <button disabled={saving} onClick={submit} className="w-full py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-1 disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {editing ? 'Guardar cambios' : 'Crear evento'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h3 className="font-heading font-semibold text-foreground mb-3">
          {selectedDate === fmt(today) ? 'Hoy' : new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h3>
        {dayEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-card rounded-xl border border-dashed border-border">
            <p className="text-sm">No hay eventos para este dia</p>
            <button onClick={openCreate} className="mt-3 inline-flex items-center gap-1 text-primary hover:underline text-sm"><Plus size={14} /> Agregar uno</button>
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`group p-4 rounded-xl border ${typeBg[event.type] || 'bg-card border-border'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{typeEmoji[event.type] || '•'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{event.title}</p>
                    {event.description && <p className="text-xs mt-1 opacity-80">{event.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs opacity-70">
                      <span className="flex items-center gap-1"><Clock size={12} /> {event.time}</span>
                      <span className="capitalize">- {event.type}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(event)} className="p-1.5 rounded hover:bg-white/40" title="Editar"><Pencil size={14} /></button>
                    <button onClick={() => remove(event.id)} className="p-1.5 rounded hover:bg-white/40" title="Eliminar"><Trash2 size={14} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
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
          <Button variant="outline" size="sm" onClick={loadProfile} disabled={loading} className="gap-2">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Actualizar
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
        <InfoItem label="Telefono" value={profile?.usuario?.telefono ? String(profile.usuario.telefono) : 'Sin registrar'} />
        <InfoItem label="Nacimiento" value={birthDate} />
        <InfoItem label="Ingreso" value={joinedAt} />
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 font-heading font-semibold text-foreground">
          <UserRound size={16} className="text-primary" />
          Perfil de autonomia
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoItem label="Nivel de apoyo" value={profile?.supportLevel || fallback.supportLevel} />
          <InfoItem label="Autonomia" value={profile?.autonomy || fallback.autonomy} />
          <InfoItem label="Autogestion" value={(profile?.canSelfManage ?? fallback.canSelfManage) ? 'Habilitada' : 'Asistida'} />
        </div>
        {(profile?.observation || fallback.observation) && (
          <div className="mt-3 rounded-lg bg-muted/40 p-3">
            <p className="text-[11px] font-medium uppercase text-muted-foreground">Observacion</p>
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
          <h2 className="text-2xl font-heading font-bold text-foreground">Configuracion del perteneciente</h2>
          <p className="text-sm text-muted-foreground">Datos personales, autonomia, privacidad y accesibilidad.</p>
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
          Cargando configuracion...
        </div>
      ) : (
        <>
          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <SectionHeader icon={UserRound} title="Datos personales" description="Informacion visible para la cuenta y red de apoyo." />
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
                <Label>Telefono</Label>
                <Input inputMode="numeric" value={form.telefonoText} onChange={e => handlePhoneChange(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fecha de nacimiento</Label>
                <Input type="date" value={form.usuario.fecha_nacimiento || ''} onChange={e => updateUsuario('fecha_nacimiento', e.target.value || null)} />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <SectionHeader icon={Shield} title="Perfil perteneciente" description="Configuracion de apoyo, autonomia y observaciones." />
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
                <Label>Autonomia operativa</Label>
                <Select value={String(form.perteneciente.id_autonomia_operativa || '')} onValueChange={value => updatePerteneciente('id_autonomia_operativa', Number(value))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar autonomia" /></SelectTrigger>
                  <SelectContent>
                    {(settings?.autonomies || []).map(autonomy => <SelectItem key={autonomy.id} value={String(autonomy.id)}>{autonomy.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <ToggleRow
                  label="Autogestion habilitada"
                  description="Permite completar acciones personales sin aprobacion previa."
                  checked={form.perteneciente.puede_autogestionarse}
                  onChange={value => updatePerteneciente('puede_autogestionarse', value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Observacion general</Label>
                <Textarea value={form.perteneciente.observacion_general || ''} onChange={e => updatePerteneciente('observacion_general', e.target.value)} rows={4} />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <SectionHeader icon={Settings} title="Preferencias y privacidad" description="Controles guardados en configuracion del usuario." />
            <div className="grid gap-3 md:grid-cols-2">
              <ToggleRow label="Notificaciones" description="Recibir avisos importantes." checked={form.preferences.recibir_notificaciones} onChange={value => updatePreference('recibir_notificaciones', value)} />
              <ToggleRow label="Recordatorios" description="Avisos de actividades pendientes." checked={form.preferences.recordatorios_actividad} onChange={value => updatePreference('recordatorios_actividad', value)} />
              <ToggleRow label="Resumen semanal" description="Guardar preferencia de reporte semanal." checked={form.preferences.resumen_semanal} onChange={value => updatePreference('resumen_semanal', value)} />
              <ToggleRow label="Compartir ubicacion" description="Permitir uso de ubicacion con apoyo autorizado." checked={form.preferences.compartir_ubicacion} onChange={value => updatePreference('compartir_ubicacion', value)} />
              <ToggleRow label="Mensajes" description="Permitir mensajes dentro de TANDEM." checked={form.preferences.permitir_mensajes} onChange={value => updatePreference('permitir_mensajes', value)} />
              <ToggleRow label="Progreso visible" description="Mostrar progreso a la red de apoyo." checked={form.preferences.mostrar_progreso_red_apoyo} onChange={value => updatePreference('mostrar_progreso_red_apoyo', value)} />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <SectionHeader icon={UserRound} title="Accesibilidad" description="Preferencias visuales personales." />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2 rounded-lg border border-border bg-background p-3">
                <Label>Tamanio de texto</Label>
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
              <ToggleRow label="Pictogramas grandes" description="Mostrar pictogramas con mayor tamano." checked={form.accessibility.pictogramas_grandes} onChange={value => updateAccessibility('pictogramas_grandes', value)} />
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
