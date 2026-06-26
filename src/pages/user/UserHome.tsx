import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCalendar, typeEmoji } from '@/contexts/CalendarContext';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Smile,
  Paperclip,
  Send,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { fetchPertenecienteHome, PertenecienteHomeData, PertenecienteHomeActivity } from '@/data/api';

interface Props {
  onNavigate?: (tab: string) => void;
}

const MOCK_ACTIVITIES: PertenecienteHomeActivity[] = [
  { id: 'm1', title: 'Preparar la mochila', description: 'Revisar el horario del día siguiente y preparar todos los materiales necesarios.', status: 'Pendiente', completed: false, assignedAt: 'Hoy' },
  { id: 'm2', title: 'Ordenar el escritorio', description: 'Limpiar y organizar tu espacio de estudio para mantener el orden.', status: 'En progreso', completed: false, assignedAt: 'Ayer' },
  { id: 'm3', title: 'Preparar una merienda', description: 'Preparar una merienda saludable de forma independiente paso a paso.', status: 'Pendiente', completed: false, assignedAt: 'Mañana' },
  { id: 'm4', title: 'Armar la ropa del día', description: 'Elegir y dejar lista la ropa que vas a usar mañana según el clima.', status: 'Pendiente', completed: false, assignedAt: 'Hoy' },
  { id: 'm5', title: 'Practicar respiración', description: 'Técnica de respiración guiada para momentos de ansiedad o agitación.', status: 'Pendiente', completed: false, assignedAt: 'Hoy' },
  { id: 'm6', title: 'Lavarse los dientes', description: 'Seguir los pasos para un cepillado completo después de cada comida.', status: 'Pendiente', completed: false, assignedAt: 'Hoy' },
  { id: 'm7', title: 'Hacer la cama', description: 'Tender la cama cada mañana como parte de la rutina diaria.', status: 'Pendiente', completed: false, assignedAt: 'Ayer' },
];

const emptyHome: PertenecienteHomeData = {
  perteneciente: null,
  supportLevel: 'Sin registrar',
  autonomy: 'Sin registrar',
  canSelfManage: false,
  points: 0,
  level: 1,
  experience: 0,
  activities: [],
  notifications: [],
};

function startOfWeek(d: Date) {
  const r = new Date(d);
  const day = (r.getDay() + 6) % 7;
  r.setDate(r.getDate() - day);
  r.setHours(0, 0, 0, 0);
  return r;
}

function fmt(d: Date) {
  return d.toISOString().split('T')[0];
}

const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function activityEmoji(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('mochila') || t.includes('bolso')) return '🎒';
  if (t.includes('diente') || t.includes('duchar') || t.includes('higiene')) return '🧼';
  if (t.includes('dormir') || t.includes('cama')) return '🛏️';
  if (t.includes('escritorio') || t.includes('orden') || t.includes('clasif')) return '📋';
  if (t.includes('cocina') || t.includes('merienda') || t.includes('desayuno') || t.includes('comida')) return '🍳';
  if (t.includes('compra') || t.includes('dinero') || t.includes('vuelto')) return '🛒';
  if (t.includes('respirac') || t.includes('calmar') || t.includes('relaj')) return '🧘';
  if (t.includes('emocion') || t.includes('sentir') || t.includes('reconocer')) return '💭';
  if (t.includes('saludar') || t.includes('presentarse') || t.includes('invitar')) return '👥';
  if (t.includes('transporte') || t.includes('viaje') || t.includes('salir')) return '🚌';
  if (t.includes('escuela') || t.includes('estudio') || t.includes('tarea')) return '📚';
  if (t.includes('ropa') || t.includes('vestir')) return '👕';
  if (t.includes('seguridad') || t.includes('peligro') || t.includes('avisa')) return '🛡️';
  if (t.includes('cambio') || t.includes('plan') || t.includes('anticip')) return '🔄';
  if (t.includes('ayuda') || t.includes('pedir')) return '🤝';
  if (t.includes('microondas')) return '🔥';
  return '📋';
}

function statusStyle(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('complet')) return 'bg-emerald-100 text-emerald-700';
  if (s.includes('progreso') || s.includes('en curso')) return 'bg-blue-100 text-blue-700';
  return 'bg-amber-100 text-amber-700';
}

const CARD_GAP = 16;

export default function UserHome({ onNavigate }: Props) {
  const { user } = useAuth();
  const { events, eventsOn } = useCalendar();
  const [home, setHome] = useState<PertenecienteHomeData>(emptyHome);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => fmt(new Date()));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSaveNote = () => {
    if (!note.trim()) return;
    // TODO: connect to backend
    setSaved(true);
    setNote('');
    setTimeout(() => setSaved(false), 2500);
  };

  useEffect(() => {
    let mounted = true;
    if (!user || user.role !== 'user') return;

    setLoading(true);
    setError('');
    fetchPertenecienteHome(user.id)
      .then(data => {
        if (!mounted) return;
        setHome(data);
      })
      .catch(() => {
        if (!mounted) return;
        setHome(emptyHome);
        setError('No pude cargar tus datos del backend local.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [user]);

  const firstName = user?.name.split(' ')[0] || user?.username || '';
  const today = new Date();
  const todayKey = fmt(today);

  const realPending = home.activities.filter(a => !a.completed);
  const showMock = !loading && realPending.length === 0;
  const pendingActivities = showMock ? MOCK_ACTIVITIES.filter(a => !a.completed) : realPending;

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    }),
    [weekStart]
  );

  const monthLabel = `${MONTHS[weekStart.getMonth()]} ${weekStart.getFullYear()}`;

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    updateScrollButtons();
    const ro = new ResizeObserver(updateScrollButtons);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      ro.disconnect();
    };
  }, [pendingActivities, updateScrollButtons]);

  const scrollCarousel = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const firstChild = el.querySelector(':scope > *') as HTMLElement | null;
    if (!firstChild) return;
    const cardWidth = firstChild.offsetWidth;
    const scrollAmount = dir === 'left' ? -(cardWidth + CARD_GAP) : (cardWidth + CARD_GAP);
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }, []);

  if (!user || user.role !== 'user') return null;

  return (
    <div className="pb-24 lg:pb-6 space-y-14">
      {/* Greeting + Quick Access */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pt-2">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-[#6b4c9a] leading-tight">
            Hola, {firstName}
          </h1>
          <p className="text-base sm:text-lg text-[#8b7aa0] mt-1.5 font-medium">
            Veamos cómo va tu día
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-3 sm:gap-4"
        >
          {[
            { id: 'chat', label: 'Chat', icon: MessageCircle, bg: 'bg-[#A4DDED]', color: 'text-[#2a7a8f]' },
            { id: 'calendar', label: 'Calendario', icon: Calendar, bg: 'bg-purple-100', color: 'text-purple-600' },
            { id: 'resources', label: 'Notas', icon: FileText, bg: 'bg-amber-100', color: 'text-amber-600' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={`flex flex-col items-center gap-2 rounded-2xl ${item.bg} transition-all duration-200 w-24 sm:w-28 py-4 shadow-sm hover:shadow-md active:scale-95`}
            >
              <div className={`flex items-center justify-center ${item.color}`}>
                <item.icon size={26} />
              </div>
              <span className="text-xs font-semibold text-[#4a4a5a]">{item.label}</span>
            </button>
          ))}
        </motion.div>
      </div>

      {/* Mi Semana */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full lg:w-[75%] mx-auto bg-white rounded-3xl shadow-lg border border-[#f0e8f8] p-4 sm:p-5"
      >
        <div className="grid grid-cols-3 items-center mb-3">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-[#8b7aa0] uppercase tracking-wide">{monthLabel}</p>
            <h2 className="text-lg sm:text-xl font-bold text-[#6b4c9a]">Mi Semana</h2>
          </div>
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => {
                const prev = new Date(weekStart);
                prev.setDate(prev.getDate() - 7);
                setWeekStart(prev);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#f5f0ff] text-[#8b7aa0] transition"
              aria-label="Semana anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setWeekStart(startOfWeek(new Date()))}
              className="text-xs font-medium text-[#6b4c9a] px-2.5 py-1 rounded-full hover:bg-[#f5f0ff] transition"
            >
              Hoy
            </button>
            <button
              onClick={() => {
                const next = new Date(weekStart);
                next.setDate(next.getDate() + 7);
                setWeekStart(next);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#f5f0ff] text-[#8b7aa0] transition"
              aria-label="Semana siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => onNavigate?.('calendar')}
              className="text-xs font-semibold text-[#6b4c9a] hover:text-[#5a3c8a] hover:underline transition shrink-0"
            >
              Calendario
            </button>
          </div>
        </div>

        <div className="flex justify-between gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {weekDays.map((d, i) => {
            const key = fmt(d);
            const isToday = key === todayKey;
            const isSelected = key === selectedDay;
            const dayEvs = eventsOn(key);
            const hasEvents = dayEvs.length > 0;

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(key)}
                className={`flex flex-1 flex-col items-center rounded-2xl border px-1 py-2.5 transition-all duration-200 ${
                  isToday
                    ? 'border-[#6b4c9a] bg-[#6b4c9a] text-white shadow-md shadow-purple-200'
                    : isSelected
                      ? 'border-[#d8c7ef] bg-[#f5f0ff] text-[#6b4c9a]'
                    : hasEvents
                      ? 'border-transparent bg-[#EFE3FF] text-[#6b4c9a]'
                        : 'border-transparent text-[#6b4c9a] hover:bg-[#f5f0ff]'
                }`}
              >
                <span className={`text-[11px] sm:text-xs font-semibold ${isToday ? 'text-white/80' : 'text-[#8b7aa0]'}`}>
                  {DAYS_SHORT[i]}
                </span>
                <span className={`text-xl sm:text-2xl font-extrabold mt-1 leading-none ${isToday ? '' : 'text-[#4a3a6a]'}`}>
                  {d.getDate()}
                </span>
                {hasEvents && (
                  <div className={`mt-1.5 flex gap-1 ${isToday ? 'text-white/80' : ''}`}>
                    {dayEvs.slice(0, 3).map(e => (
                      <span
                        key={e.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: isToday ? 'currentColor' : '#6b4c9a' }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selectedDay && eventsOn(selectedDay).length > 0 && (
          <div className="mt-5 pt-4 border-t border-[#f0e8f8] space-y-2">
            <p className="text-xs font-semibold text-[#8b7aa0] uppercase tracking-wide">
              {selectedDay === todayKey
                ? 'Hoy'
                : new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric' })}
            </p>
            {eventsOn(selectedDay).slice(0, 3).map(e => (
              <div key={e.id} className="flex items-center gap-2.5 bg-[#faf8ff] rounded-xl px-3 py-2">
                <span className="text-lg">{typeEmoji[e.type]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#4a4a5a] truncate">{e.title}</p>
                </div>
                <span className="text-xs text-[#8b7aa0] font-medium">{e.time}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Actividades Pendientes */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#6b4c9a]">
            Actividades Pendientes
          </h2>
          {pendingActivities.length > 0 && (
            <button
              onClick={() => onNavigate?.('activities')}
              className="text-sm font-semibold text-[#6b4c9a] hover:text-[#5a3c8a] hover:underline transition shrink-0"
            >
              Ver todas
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            Cargando actividades...
          </div>
        ) : pendingActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#e0d8f0] bg-white p-12 text-center">
            <Sparkles size={36} className="text-[#6b4c9a]" />
            <p className="mt-3 text-lg font-semibold text-[#4a4a5a]">No tenés actividades pendientes</p>
            <p className="mt-1 text-sm text-[#8b7aa0]">
              {home.activities.length > 0
                ? '¡Completaste todo!'
                : 'Cuando te asignen actividades, van a aparecer acá.'}
            </p>
          </div>
        ) : (
          <div className="relative group/carousel">
            {/* Scrollable container */}
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {pendingActivities.map((activity, idx) => {
                const progressVal = activity.completed
                  ? 100
                  : activity.status?.toLowerCase().includes('progreso')
                    ? 50
                    : 0;

                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="snap-start shrink-0 w-[80%] sm:w-[48%] lg:w-[31%]"
                  >
                    <div className="rounded-2xl bg-[#faf8ff] border border-[#ede4f8] p-3 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
                      <div className="bg-white rounded-xl p-4 flex-1 flex flex-col">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5f0ff] text-xl">
                            {activityEmoji(activity.title)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-[#4a4a5a] truncate">
                              {activity.title}
                            </p>
                            <p className="mt-0.5 text-xs text-[#8b7aa0] line-clamp-2 leading-relaxed">
                              {activity.description}
                            </p>
                          </div>
                        </div>
                        <div className="mt-auto pt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusStyle(activity.status)}`}>
                              {activity.status}
                            </span>
                            <span className="text-[10px] font-medium text-[#8b7aa0]">{activity.assignedAt}</span>
                          </div>
                          <Progress value={progressVal} className="h-2 bg-[#ede4f8]" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Left arrow */}
            {canScrollLeft && (
              <button
                onClick={() => scrollCarousel('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[#e0d8f0] shadow-md text-[#6b4c9a] hover:bg-[#f5f0ff] hover:text-[#5a3c8a] transition z-10"
                aria-label="Anterior"
              >
                <ChevronLeft size={20} />
              </button>
            )}

            {/* Right arrow */}
            {canScrollRight && (
              <button
                onClick={() => scrollCarousel('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[#e0d8f0] shadow-md text-[#6b4c9a] hover:bg-[#f5f0ff] hover:text-[#5a3c8a] transition z-10"
                aria-label="Siguiente"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        )}
      </motion.section>

      {/* Journal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-lg border border-[#f0e8f8] p-6 sm:p-8"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-[#6b4c9a] text-center">
          ¿Cómo te sentiste hoy?
        </h2>

        <textarea
          value={note}
          onChange={e => { setNote(e.target.value); setSaved(false); }}
          placeholder="Escribí acá lo que sentís o pensás..."
          rows={5}
          className="mt-5 w-full resize-none rounded-2xl bg-[#f7f5fa] border border-[#ede4f8] p-5 text-sm text-[#4a4a5a] placeholder:text-[#b5a8c8] outline-none focus:ring-2 focus:ring-[#6b4c9a]/20 focus:border-[#6b4c9a]/30 transition"
        />

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#b5a8c8]">
            <Smile size={18} className="hover:text-[#6b4c9a] transition cursor-pointer" />
            <Paperclip size={16} className="hover:text-[#6b4c9a] transition cursor-pointer" />
          </div>

          <div className="flex items-center gap-3">
            {saved && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs font-medium text-emerald-600"
              >
                Nota guardada
              </motion.span>
            )}
            <button
              onClick={handleSaveNote}
              disabled={!note.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#6b4c9a] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Guardar nota
              <Send size={14} />
            </button>
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
