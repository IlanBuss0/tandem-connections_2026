import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Lightbulb,
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

const homeRequests = new Map<string, Promise<PertenecienteHomeData>>();
const weekDayLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
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

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentWeek() {
  const start = new Date();
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function loadPertenecienteHome(
  userId: string,
  onActivitiesReady: (activities: PertenecienteHomeActivity[]) => void,
) {
  const existing = homeRequests.get(userId);
  if (existing) return existing;
  const request = fetchPertenecienteHome(userId, {
    onActivitiesReady,
    skipProfileLookups: true,
  }).finally(() => homeRequests.delete(userId));
  homeRequests.set(userId, request);
  return request;
}

function isImageAvatar(value: string) {
  return (
    /^(https?:|data:image\/|\/|\.\/|\.\.\/)/.test(value) ||
    /\.(png|jpe?g|webp|gif|svg)$/i.test(value)
  );
}

function HomeAvatar({
  avatar,
  name,
  compact = false,
}: {
  avatar?: string;
  name: string;
  compact?: boolean;
}) {
  const cleanAvatar = avatar?.trim();
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-white/75 shadow-sm ${compact ? "h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24" : "h-24 w-24 sm:h-28 sm:w-28 lg:h-36 lg:w-36"}`}
      aria-label={`Avatar de ${name}`}
    >
      {cleanAvatar && isImageAvatar(cleanAvatar) ? (
        <img src={cleanAvatar} alt="" className="h-full w-full object-cover" />
      ) : cleanAvatar ? (
        <span
          className={
            compact
              ? "text-4xl sm:text-5xl"
              : "text-6xl sm:text-7xl lg:text-8xl"
          }
          aria-hidden
        >
          {cleanAvatar}
        </span>
      ) : (
        <UserRound className="h-1/2 w-1/2 text-[#7b5fa6]" aria-hidden />
      )}
    </div>
  );
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
  const { events, eventsOn } = useCalendar();
  const { context: permissionContext } = usePermissionContext();
  const [home, setHome] = useState<PertenecienteHomeData>(emptyHome);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(() => dateKey(new Date()));
  const weekDays = useMemo(currentWeek, []);
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

  useEffect(() => {
    let mounted = true;
    if (!user || user.role !== "user") return;
    const refresh = () => {
      setLoading(true);
      setError("");
      void loadPertenecienteHome(user.id, (activities) => {
        if (mounted) setHome((current) => ({ ...current, activities }));
      })
        .then((data) => {
          if (mounted) setHome(data);
        })
        .catch(() => {
          if (mounted) {
            setHome(emptyHome);
            setError(
              "No pudimos cargar todos tus datos. Intentá nuevamente en unos minutos.",
            );
          }
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    };
    refresh();
    window.addEventListener(ACTIVITY_STATUS_CHANGED_EVENT, refresh);
    return () => {
      mounted = false;
      window.removeEventListener(ACTIVITY_STATUS_CHANGED_EVENT, refresh);
    };
  }, [user]);

  const pendingActivities = useMemo(
    () => home.activities.filter(isPendingActivity),
    [home.activities],
  );
  const routineItems = todayRoutine?.items ?? [];
  const completedRoutineItems = routineItems.filter(
    (item) => item.completed,
  ).length;
  const dayProgress = routineItems.length
    ? Math.round((completedRoutineItems / routineItems.length) * 100)
    : home.activities.length
      ? Math.round(
          (home.activities.filter((activity) => activity.completed).length /
            home.activities.length) *
            100,
        )
      : 0;
  const visibleRoutineItems = routineItems
    .filter((item) => !item.completed)
    .slice(0, 3);
  const visibleActivities = pendingActivities.slice(
    0,
    Math.max(0, 3 - visibleRoutineItems.length),
  );
  const goalSteps = routineItems.slice(0, 5);
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
                {monthLabels[weekDays[0].getMonth()]}{" "}
                {weekDays[0].getFullYear()}
              </p>
              <h2 className="text-[18px] font-bold text-[#2e2344] sm:text-[20px]">
                Mi semana
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.("calendar")}
              className="text-xs font-bold text-[#6f4ca6] transition hover:text-[#2e2344] sm:text-sm"
            >
              Ver calendario
            </button>
          </div>

          <div className="mt-4 grid gap-4">
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {weekDays.map((day) => {
                const key = dateKey(day);
                const dayEvents = eventsOn(key);
                const isToday = key === dateKey(new Date());
                const isSelected = key === selectedDay;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDay(key)}
                    className={`flex min-h-[66px] flex-col items-center justify-center rounded-[14px] border px-1 py-2 transition sm:min-h-[76px] ${isToday ? "border-[#6f4ca6] bg-[#6f4ca6] text-white shadow-sm" : isSelected ? "border-[#d9c7ed] bg-[#f5f0ff] text-[#3f3153]" : "border-transparent bg-[#fcfaff] text-[#675a78] hover:bg-[#f5f0ff]"}`}
                  >
                    <span
                      className={`text-[10px] font-bold sm:text-xs ${isToday ? "text-white/80" : "text-[#7b5fa6]"}`}
                    >
                      {weekDayLabels[day.getDay()]}
                    </span>
                    <span className="mt-1 text-lg font-extrabold leading-none sm:text-xl">
                      {day.getDate()}
                    </span>
                    <span className="mt-1.5 flex h-1.5 gap-1" aria-hidden>
                      {dayEvents.slice(0, 3).map((event) => (
                        <span
                          key={event.id}
                          className={`h-1.5 w-1.5 rounded-full ${isToday ? "bg-white/80" : "bg-[#8b65bd]"}`}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
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
                    onClick={() => onNavigate?.("calendar")}
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
                  onClick={() => onNavigate?.("calendar")}
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
          <section className="relative overflow-hidden rounded-[24px] border border-[#ddccf0] bg-gradient-to-br from-white via-[#fdfbff] to-[#eee5fa] p-4 shadow-[0_10px_28px_rgba(75,50,110,0.10)] sm:p-6 lg:p-7">
            <span
              className="absolute -right-16 -top-20 h-52 w-52 rounded-full border-[28px] border-white/55"
              aria-hidden
            />
            <span
              className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#7c3aed] via-[#a987d0] to-[#7fc997]"
              aria-hidden
            />
            <div className="relative">
              <h2 className="text-[18px] font-bold text-[#2e2344] sm:text-[20px] lg:text-[22px]">
                Mi día: un paso más cerca
              </h2>
              <p className="mt-1 text-xs text-[#756a82] sm:text-sm">
                Estás avanzando muy bien hoy
              </p>
            </div>
            <div className="relative mt-5 grid grid-cols-[minmax(100px,0.72fr)_minmax(0,1.45fr)] items-center gap-4 sm:grid-cols-[0.7fr_1.65fr_auto] sm:gap-6 lg:grid-cols-[0.65fr_1.8fr_auto] lg:gap-10">
              <div className="flex flex-col items-center">
                <div
                  className="relative flex h-24 w-24 items-center justify-center rounded-full sm:h-28 sm:w-28"
                  style={{
                    background: `conic-gradient(#6f4ca6 0 ${dayProgress}%, #7fc997 ${dayProgress}% ${Math.min(100, dayProgress + 10)}%, #e7dcf5 ${Math.min(100, dayProgress + 10)}% 100%)`,
                  }}
                >
                  <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-white text-xl font-extrabold text-[#4a3a6a] sm:h-[86px] sm:w-[86px] sm:text-2xl">
                    {dayProgress}%
                  </div>
                </div>
                <p className="mt-2 text-center text-[11px] font-bold text-[#4a3a6a] sm:text-xs">
                  Mi día en equilibrio
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  todayRoutine &&
                  onNavigate?.("calendar", { routineId: todayRoutine.id })
                }
                disabled={!todayRoutine}
                className="min-w-0 rounded-[18px] border border-white/80 bg-white/65 p-3 text-left shadow-sm backdrop-blur-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] disabled:cursor-default sm:p-4"
              >
                <span className="flex items-center gap-2 text-xs font-bold text-[#6f4ca6] sm:text-sm">
                  <span aria-hidden>🎯</span> Mi próxima meta
                </span>
                <span className="mt-1.5 block text-sm font-extrabold leading-5 text-[#3f3153] sm:text-base">
                  {todayRoutine?.name || "Tu próxima rutina aparecerá acá"}
                </span>
                <span className="mt-1 block text-[11px] font-semibold text-[#7b7185] sm:text-xs">
                  {routineItems.length
                    ? `${completedRoutineItems}/${routineItems.length} pasos`
                    : "Sin pasos para hoy"}
                </span>
                <span className="mt-3 block h-2 overflow-hidden rounded-full bg-[#e8ddf5]">
                  <span
                    className="block h-full rounded-full bg-[#7c3aed] transition-[width]"
                    style={{ width: `${dayProgress}%` }}
                  />
                </span>
              </button>
              <div className="col-span-2 flex justify-center sm:col-auto">
                <HomeAvatar avatar={user.avatar} name={user.name} compact />
              </div>
            </div>
            {goalSteps.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  onNavigate?.("calendar", { routineId: todayRoutine!.id })
                }
                className="relative mt-5 grid w-full grid-cols-5 gap-2 rounded-[18px] border border-white/80 bg-white/55 px-2 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] sm:gap-3 sm:px-4"
              >
                {goalSteps.map((item) => (
                  <span key={item.id} className="min-w-0 text-center">
                    <span
                      className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full ${item.completed ? "bg-[#dff3e6] text-[#3f9b61]" : "bg-[#f1ebf8] text-[#9b8aaa]"}`}
                    >
                      {item.completed ? (
                        <Check size={16} strokeWidth={3} />
                      ) : (
                        <Circle size={13} />
                      )}
                    </span>
                    <span className="mt-1.5 block truncate text-[9px] font-semibold text-[#675a78] sm:text-[11px]">
                      {item.title}
                    </span>
                  </span>
                ))}
              </button>
            )}
          </section>

          <section className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-5 lg:grid-cols-1 lg:content-stretch">
            <button
              type="button"
              onClick={() => onNavigate?.("emotions")}
              className="group flex min-h-[82px] items-center gap-4 rounded-[18px] border border-[#e5d8f3] bg-gradient-to-r from-[#f7f1ff] to-white p-4 text-left shadow-[0_6px_18px_rgba(75,50,110,0.07)] transition hover:-translate-y-0.5 hover:border-[#d3bfe9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#7c3aed] text-white">
                <Lightbulb size={22} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-[#2e2344] sm:text-base">
                  Consejo del día
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#675a78] sm:text-[13px]">
                  Respirá profundo, tomate tu tiempo y hacé lo mejor que puedas.
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
