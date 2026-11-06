import AvatarPreview from '@/components/AvatarPreview';
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Play,
  MessageSquare,
  ListTodo,
  Plus,
  Trophy,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRoutines } from "@/contexts/RoutinesContext";
import { useWallet } from "@/contexts/WalletContext";
import { useCalendar } from "@/contexts/CalendarContext";
import EmotionEntryDialog from "@/components/EmotionEntryDialog";
import EventPictogram from "@/components/EventPictogram";
import {
  fetchPertenecienteHome,
  type PertenecienteHomeActivity,
  type PertenecienteHomeData,
} from "@/data/api";
import { ACTIVITY_STATUS_CHANGED_EVENT } from "@/lib/activityEvents";
import { isPendingActivity } from "@/lib/activityStatus";
import {
  isPermissionEnabled,
  PERTENECIENTE_PERMISSIONS,
  usePermissionContext,
} from "@/hooks/usePermissions";
import { useCalendarPictograms } from "@/hooks/useCalendarPictograms";
import { localDateKey as dateKey } from "@/lib/routineDay";
import { addDays } from "date-fns";
import { useDailyActivity } from "@/hooks/useDailyActivity";

interface Props {
  onNavigate?: (tab: string, params?: Record<string, string>) => void;
}

const emptyHome: PertenecienteHomeData = {
  perteneciente: null,
  supportLevel: "Sin registrar",
  autonomy: "Sin registrar",
  canSelfManage: false,
  points: 0,
  level: 1,
  experience: 0,
  activities: [],
  notifications: [],
};

const emotions = [
  { label: "Feliz", emoji: "😄" },
  { label: "Contento", emoji: "😊" },
  { label: "Tranquilo", emoji: "😌" },
  { label: "Triste", emoji: "😢" },
  { label: "Preocupado", emoji: "😟" },
  { label: "Enojado", emoji: "😠" },
] as const;

const monthLabels = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function loadPertenecienteHome(
  userId: string,
  onActivitiesReady: (activities: PertenecienteHomeActivity[]) => void,
) {
  return fetchPertenecienteHome(userId, {
    onActivitiesReady,
    skipProfileLookups: true,
    freshActivities: true,
  });
}

function HomeAvatar({avatar,name}:{avatar?:string;name:string}) {
  const {state}=useWallet();
  return <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border border-white/80 bg-white/75 shadow-sm sm:h-28 sm:w-28 lg:h-36 lg:w-36" aria-label={'Avatar de '+name}>
    <AvatarPreview config={state.config} photo={avatar} className="!h-full !w-full"/>
  </div>;
}

function statusLabel(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("progreso") || normalized.includes("curso"))
    return "En progreso";
  if (normalized.includes("pendiente")) return "Pendiente";
  return status || "Para hacer";
}

export default function UserHome({ onNavigate }: Props) {
  const { user } = useAuth();
  const { todayRoutine } = useRoutines();
  const { state: wallet } = useWallet();
  const { events } = useCalendar();
  const { context: permissionContext } = usePermissionContext();
  const [home, setHome] = useState<PertenecienteHomeData>(emptyHome);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(() => dateKey(new Date()));
  const selectedDate = new Date(`${selectedDay}T12:00:00`);
  const changeDay = (offset: number) => setSelectedDay(current => dateKey(addDays(new Date(`${current}T12:00:00`), offset)));
  const selectedDayEvents = useMemo(
    () => events.filter((event) => event.date === selectedDay),
    [events, selectedDay],
  );
  useCalendarPictograms(selectedDayEvents);

  const canRegisterEmotions = isPermissionEnabled(
    permissionContext?.perteneciente?.permisos_efectivos?.permisos,
    PERTENECIENTE_PERMISSIONS.REGISTRAR_EMOCIONES,
    true,
  );

  const openEmotion = (emotion: string) => {
    if (canRegisterEmotions) setSelectedEmotion(emotion);
    else onNavigate?.("emotions");
  };

  const pendingActivities = useMemo(
    () => home.activities.filter(isPendingActivity),
    [home.activities],
  );
  const routineItems = todayRoutine?.items ?? [];
  const visibleRoutineItems = routineItems.filter(item => !item.completed).slice(0, 3);
  const visibleActivities = pendingActivities.slice(0, Math.max(0, 3 - visibleRoutineItems.length));
  const daily = useDailyActivity(user?.id, home.activities, loadedKey, visibleActivities.map(item => item.id));
  const recommendedActivity = daily.result?.status === 'pending' ? daily.result.activity : undefined;

  useEffect(() => {
    let mounted = true;
    let requestId = 0;
    if (!user || user.role !== "user") return;
    const refresh = () => {
      const ticket = ++requestId;
      setLoading(true);
      setError("");
      setLoadedKey(null);
      void loadPertenecienteHome(user.id, (activities) => {
        if (mounted && ticket === requestId) setHome((current) => ({ ...current, activities }));
      })
        .then((data) => {
          if (mounted && ticket === requestId) {
            setHome(data);
            setLoadedKey(`${user.id}:${daily.day}`);
          }
        })
        .catch(() => {
          if (mounted && ticket === requestId) {
            setHome(emptyHome);
            setError(
              "No pudimos cargar todos tus datos. Intentá nuevamente en unos minutos.",
            );
          }
        })
        .finally(() => {
          if (mounted && ticket === requestId) setLoading(false);
        });
    };
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    refresh();
    window.addEventListener(ACTIVITY_STATUS_CHANGED_EVENT, refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      mounted = false;
      window.removeEventListener(ACTIVITY_STATUS_CHANGED_EVENT, refresh);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user, daily.day, reload]);
  const canStartActivity = isPermissionEnabled(
    permissionContext?.perteneciente?.permisos_efectivos?.permisos,
    PERTENECIENTE_PERMISSIONS.COMPLETAR_ACTIVIDADES,
    false,
  );
  const points = wallet.balance || home.points;

  if (!user || user.role !== "user") return null;
  const firstName = user.name.split(" ")[0] || user.username;
  const level = "level" in user ? user.level : home.level;

  return (
    <main className="min-h-screen bg-[#faf8ff] px-4 pb-8 pt-2 text-left sm:px-6 sm:pb-10 sm:pt-3 lg:px-10 lg:pb-12">
      <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-4 sm:gap-5 lg:gap-6">
        <section className="relative flex min-h-[140px] items-center overflow-hidden rounded-[24px] border border-[#dfcff1] bg-gradient-to-br from-[#f7f2ff] via-[#f2e9ff] to-[#eaf7fb] px-5 py-5 shadow-[0_10px_30px_rgba(82,55,120,0.11)] sm:min-h-[160px] sm:px-8 sm:py-6 lg:min-h-[190px] lg:px-10">
          <span
            className="absolute -left-12 -top-16 h-40 w-40 rounded-full bg-white/55 blur-sm"
            aria-hidden
          />
          <span
            className="absolute -bottom-20 right-[18%] h-44 w-44 rounded-full bg-[#d8c5f2]/35 blur-md"
            aria-hidden
          />
          <span
            className="absolute bottom-0 left-0 h-1 w-2/5 rounded-r-full bg-gradient-to-r from-[#6f4ca6] to-[#9b7bc5]"
            aria-hidden
          />
          <div className="relative z-10 min-w-0 flex-1 pr-2 sm:pr-6">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#7b5fa6] sm:text-xs">
              Tu espacio de hoy
            </p>
            <h1 className="text-[24px] font-extrabold leading-tight text-[#2e2344] sm:text-[28px] lg:text-[32px]">
              ¡Hola, {firstName}! <span aria-hidden>👋</span>
            </h1>
            <p className="mt-3 max-w-xl text-[13px] font-medium leading-5 text-[#675a78] sm:text-[15px] sm:leading-6 lg:text-base">
              Cada día es una nueva oportunidad para crecer y disfrutar.
            </p>
          </div>
          <div className="flex w-[36%] max-w-[180px] justify-center sm:w-[30%] lg:w-[26%]">
            <HomeAvatar avatar={user.avatar} name={user.name} />
          </div>
          <span
            className="absolute right-[30%] top-5 text-xl text-[#c9aef0]"
            aria-hidden
          >
            ♥
          </span>
          <span
            className="absolute bottom-4 right-5 text-sm text-[#d9c5f4]"
            aria-hidden
          >
            ✦
          </span>
        </section>

        <section className="rounded-[20px] border border-[#e9def5] bg-white p-4 shadow-[0_6px_20px_rgba(75,50,110,0.07)] sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7b5fa6] sm:text-xs">
                {monthLabels[selectedDate.getMonth()]}{" "}
                {selectedDate.getFullYear()}
              </p>
              <h2 className="text-[18px] font-bold text-[#2e2344] sm:text-[20px]">
                Mi semana
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.("calendar", { date: selectedDay })}
              className="text-xs font-bold text-[#6f4ca6] transition hover:text-[#2e2344] sm:text-sm"
            >
              Ver calendario
            </button>
          </div>

          <div className="mt-4 grid gap-4">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#ddccf0] bg-[#f7f2ff] p-2 sm:p-3">
              <button type="button" aria-label="Día anterior" onClick={() => changeDay(-1)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#6b4c9a] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]">
                <ChevronLeft size={24} aria-hidden />
              </button>
              <div className="min-w-0 text-center" aria-live="polite" aria-atomic="true">
                <p className="text-base font-bold capitalize text-[#3f3153] sm:text-xl">
                  {selectedDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                {selectedDay === dateKey(new Date()) && <span className="text-xs font-semibold text-[#6b4c9a]">Hoy</span>}
              </div>
              <button type="button" aria-label="Día siguiente" onClick={() => changeDay(1)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#6b4c9a] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]">
                <ChevronRight size={24} aria-hidden />
              </button>
            </div>

            <div className="min-h-[76px] rounded-[16px] border border-[#eee5f7] bg-[#fcfaff] px-3 py-2.5">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7b5fa6]">
                {selectedDay === dateKey(new Date())
                  ? "Hoy"
                  : new Date(`${selectedDay}T12:00:00`).toLocaleDateString(
                      "es-AR",
                      { weekday: "long", day: "numeric" },
                    )}
              </p>
              {selectedDayEvents.length ? (
                selectedDayEvents.slice(0, 2).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onNavigate?.("calendar", { date: selectedDay })}
                    className="flex min-h-9 w-full items-center gap-2 border-b border-[#eee5f7] text-left last:border-0"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center">
                      <EventPictogram event={event} size="sm" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-bold text-[#4a3a6a] sm:text-sm">
                      {event.title}
                    </span>
                    <span className="text-[10px] font-semibold text-[#7b5fa6] sm:text-xs">
                      {event.time}
                    </span>
                  </button>
                ))
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate?.("calendar", { date: selectedDay })}
                  className="flex min-h-10 w-full items-center text-left text-xs text-[#756a82]"
                >
                  No hay eventos para este día.
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-stretch lg:gap-6">
          <section className="mx-auto w-full max-w-[900px] rounded-[20px] border border-[#e9def5] bg-white p-4 shadow-[0_6px_20px_rgba(75,50,110,0.07)] sm:p-5 lg:h-full lg:max-w-none">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-bold leading-tight text-[#2e2344] sm:text-[19px] lg:text-[21px]">
                  ¿Cómo te sentís hoy?
                </h2>
                <p className="mt-1 text-xs text-[#756a82] sm:text-[13px]">
                  Elegí el emoji que mejor te represente
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.("emotions")}
                aria-label="Abrir registro personal"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7c3aed] text-white transition hover:bg-[#6f4ca6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2"
              >
                <Plus size={20} aria-hidden />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-1 sm:gap-3 lg:grid-cols-3 [&>button:nth-child(1)]:bg-[#fff7dc] [&>button:nth-child(2)]:bg-[#edf8e9] [&>button:nth-child(3)]:bg-[#eef5ff] [&>button:nth-child(4)]:bg-[#f0edff] [&>button:nth-child(5)]:bg-[#fff1e8] [&>button:nth-child(6)]:bg-[#ffeded]">
              {emotions.map((emotion) => (
                <button
                  key={emotion.label}
                  type="button"
                  onClick={() => openEmotion(emotion.label)}
                  aria-label={`Me siento ${emotion.label}`}
                  className="flex min-h-12 items-center justify-center rounded-[14px] text-[30px] leading-none transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] sm:min-h-[58px] sm:text-[34px] lg:text-[38px]"
                >
                  <span aria-hidden>{emotion.emoji}</span>
                </button>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="next-today-title"
            className="mx-auto w-full max-w-[950px] lg:max-w-none"
          >
            <div className="mb-3 flex items-center justify-between gap-4 px-1">
              <h2
                id="next-today-title"
                className="text-[18px] font-bold text-[#2e2344] sm:text-[19px] lg:text-[21px]"
              >
                Lo que sigue hoy
              </h2>
              <button
                type="button"
                onClick={() =>
                  onNavigate?.(todayRoutine ? "calendar" : "activities")
                }
                className="text-xs font-bold text-[#6f4ca6] transition hover:text-[#2e2344] sm:text-sm"
              >
                Ver todo
              </button>
            </div>
            <div className="overflow-hidden rounded-[20px] border border-[#e9def5] bg-gradient-to-r from-[#fcfaff] via-white to-white px-4 py-2 shadow-[0_7px_22px_rgba(75,50,110,0.07)] sm:px-5">
              {loading && routineItems.length === 0 ? (
                <p className="py-5 text-sm text-[#756a82]">
                  Cargando tus actividades...
                </p>
              ) : visibleRoutineItems.length === 0 &&
                visibleActivities.length === 0 ? (
                <button
                  type="button"
                  onClick={() => onNavigate?.("activities")}
                  className="flex min-h-16 w-full items-center gap-3 text-left text-sm font-medium text-[#675a78]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#f5f0ff] text-[#6f4ca6]">
                    <CheckCircle2 size={21} />
                  </span>
                  No tenés actividades pendientes para hoy.
                  <ChevronRight className="ml-auto" size={18} />
                </button>
              ) : (
                <div>
                  {visibleRoutineItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        onNavigate?.("calendar", {
                          routineId: todayRoutine!.id,
                          itemId: item.id,
                          focus: "routine",
                        })
                      }
                      className="group grid min-h-[64px] w-full grid-cols-[44px_1px_44px_minmax(0,1fr)_20px] items-center gap-2 border-b border-[#f1e9f8] text-left last:border-0 sm:min-h-[70px] sm:grid-cols-[58px_1px_50px_minmax(0,1fr)_24px] sm:gap-3 lg:min-h-[76px]"
                    >
                      <span className="text-[11px] font-bold text-[#4a3a6a] sm:text-xs">
                        {item.time || "Hoy"}
                      </span>
                      <span
                        className="relative h-full bg-[#ded0f1]"
                        aria-hidden
                      >
                        <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7c3aed]" />
                      </span>
                      <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[14px] bg-[#f5f0ff] text-2xl">
                        {item.pictogramImageUrl ? (
                          <img
                            src={item.pictogramImageUrl}
                            alt=""
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <span aria-hidden>{item.icon || "📌"}</span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-[#3f3153] sm:text-[15px]">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-[#7b7185] sm:text-xs">
                          Pendiente
                        </span>
                      </span>
                      <ChevronRight
                        size={18}
                        className="text-[#9b8aaa] transition group-hover:translate-x-0.5 group-hover:text-[#6f4ca6]"
                        aria-hidden
                      />
                    </button>
                  ))}
                  {visibleActivities.map((activity) => (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() =>
                        onNavigate?.("activities", { activityId: activity.id })
                      }
                      className="group grid min-h-[64px] w-full grid-cols-[44px_1px_44px_minmax(0,1fr)_20px] items-center gap-2 border-b border-[#f1e9f8] text-left last:border-0 sm:min-h-[70px] sm:grid-cols-[58px_1px_50px_minmax(0,1fr)_24px] sm:gap-3 lg:min-h-[76px]"
                    >
                      <span className="text-[11px] font-bold text-[#4a3a6a] sm:text-xs">
                        {activity.assignedAt || "Hoy"}
                      </span>
                      <span
                        className="relative h-full bg-[#ded0f1]"
                        aria-hidden
                      >
                        <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7c3aed]" />
                      </span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#f5f0ff] text-[#6f4ca6]">
                        <ListTodo size={21} aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-[#3f3153] sm:text-[15px]">
                          {activity.title}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-[#7b7185] sm:text-xs">
                          {statusLabel(activity.status)}
                        </span>
                      </span>
                      <ChevronRight
                        size={18}
                        className="text-[#9b8aaa] transition group-hover:translate-x-0.5 group-hover:text-[#6f4ca6]"
                        aria-hidden
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(260px,0.65fr)] lg:items-stretch lg:gap-6">
          <section aria-labelledby="recommended-activity-title" className="overflow-hidden rounded-[24px] border border-[#ddccf0] bg-gradient-to-br from-white via-[#fdfbff] to-[#eee5fa] p-4 shadow-[0_10px_28px_rgba(75,50,110,0.10)] sm:p-6">
            <h2 id="recommended-activity-title" className="text-lg font-bold text-[#2e2344] sm:text-xl">
              {daily.result?.status === 'completed' ? '¡Completaste tu actividad de hoy!' : daily.result?.status === 'empty' ? '¡Estás al día!' : 'Actividad del día'}
            </h2>
            {recommendedActivity ? (
              <div className="mt-4 grid items-center gap-5 sm:grid-cols-[140px_minmax(0,1fr)]">
                <div className="flex min-h-36 items-center justify-center rounded-3xl border border-[#e5d8f3] bg-[#f5f0ff] p-5 text-6xl text-[#6b4c9a]">
                  {recommendedActivity.previewIcon?.startsWith("http") ? (
                    <img src={recommendedActivity.previewIcon} alt="" className="h-28 w-28 object-contain" />
                  ) : recommendedActivity.previewIcon && !/^\d+$/.test(recommendedActivity.previewIcon) ? recommendedActivity.previewIcon : <ListTodo size={72} aria-hidden />}
                </div>
                <div className="min-w-0">
                  {recommendedActivity.category && <p className="text-xs font-semibold capitalize text-[#6b4c9a]">{recommendedActivity.category}</p>}
                  <h3 className="mt-1 text-lg font-bold text-[#3f3153]">{recommendedActivity.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#675a78]">{recommendedActivity.description}</p>
                  <button type="button" disabled={!canStartActivity} onClick={() => onNavigate?.("activities", { activityId: recommendedActivity.id, start: "true" })} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#6b4c9a] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#5a3c8a] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2 disabled:opacity-50">
                    <Play size={16} aria-hidden /> Comenzar actividad
                  </button>
                  {!canStartActivity && <p className="mt-2 text-xs text-[#675a78]">Tu tutor deshabilitó completar actividades por ahora.</p>}
                </div>
              </div>
            ) : daily.result?.status === 'completed' || daily.result?.status === 'empty' ? (
              <div className="mt-4 space-y-4">
                <CheckCircle2 size={40} className="text-[#6b4c9a]" aria-hidden />
                <p className="text-sm leading-6 text-[#675a78]">{daily.result.status === 'completed' ? '¡Muy bien! Si tenés ganas de seguir jugando, podés explorar más actividades.' : 'Ya completaste todas tus actividades disponibles. Podés volver a jugar alguna cuando quieras.'}</p>
                <button type="button" onClick={() => onNavigate?.('activities')} className="min-h-11 rounded-full bg-[#6b4c9a] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#5a3c8a] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2">
                  {daily.result.status === 'completed' ? 'Explorar actividades' : 'Ver actividades'}
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-sm leading-6 text-[#675a78]">
                <p role={error || daily.error ? 'alert' : 'status'}>{error || daily.error || 'Buscando tu actividad del día...'}</p>
                {(error || daily.error) && <button type="button" onClick={() => { daily.retry(); if (error) setReload(value => value + 1); }} className="min-h-11 rounded-full border border-[#ddccf0] px-5 font-semibold text-[#6b4c9a] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]">Reintentar</button>}
              </div>
            )}
          </section>

          <section className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-5 lg:grid-cols-1 lg:content-stretch">
            <button
              type="button"
              onClick={() => onNavigate?.("pictograms", { mode: "traductor" })}
              className="group flex min-h-[82px] cursor-pointer items-center gap-4 rounded-[18px] border border-[#e5d8f3] bg-gradient-to-r from-[#f7f1ff] to-white p-4 text-left shadow-[0_6px_18px_rgba(75,50,110,0.07)] transition hover:-translate-y-0.5 hover:border-[#d3bfe9] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#7c3aed] text-white">
                <MessageSquare size={22} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-[#2e2344] sm:text-base">
                  ¿Querés comunicar algo?
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#675a78] sm:text-[13px]">
                  Escribí lo que querés decir y transformalo en pictogramas.
                </span>
                <span className="mt-2 block text-xs font-bold text-[#6b4c9a] group-hover:underline">
                  Abrir traductor
                </span>
              </span>
              <ChevronRight
                size={18}
                className="shrink-0 text-[#9b8aaa] transition group-hover:translate-x-0.5"
                aria-hidden
              />
            </button>
            {points > 0 && (
              <button
                type="button"
                onClick={() => onNavigate?.("achievements")}
                className="flex min-h-[82px] items-center gap-3 rounded-[18px] border border-[#ece3f8] bg-white px-5 py-4 text-left shadow-[0_4px_16px_rgba(75,50,110,0.05)] transition hover:border-[#d9c7ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] sm:min-w-[190px] lg:min-w-0"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#fff6df] text-[#b88018]">
                  <Trophy size={20} aria-hidden />
                </span>
                <span>
                  <span className="block text-xs font-semibold text-[#756a82]">
                    Puntos · Nivel {level}
                  </span>
                  <span className="mt-0.5 block text-base font-extrabold text-[#3f3153]">
                    {points} pts
                  </span>
                </span>
              </button>
            )}
          </section>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-[16px] border border-red-100 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <EmotionEntryDialog
          emotion={selectedEmotion}
          onClose={() => setSelectedEmotion(null)}
        />
      </div>
    </main>
  );
}
