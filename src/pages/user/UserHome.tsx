import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '@/contexts/AuthContext';
import { useCalendar, typeEmoji } from '@/contexts/CalendarContext';
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

gsap.registerPlugin(ScrollTrigger);

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
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<Array<HTMLElement | null>>([]);

  useGSAP(() => {
    const container = containerRef.current;
    if (!container) return;

    const heroItems = Array.from(container.querySelectorAll<HTMLElement>('[data-hero-animate]'));
    const revealSections = Array.from(container.querySelectorAll<HTMLElement>('[data-reveal-section]'));

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.from(heroItems, {
      y: 30,
      opacity: 0,
      duration: 0.7,
      stagger: 0.18,
      clearProps: 'all',
    });

    revealSections.forEach(section => {
      gsap.from(section, {
        y: 24,
        opacity: 0,
        duration: 0.75,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          once: true,
          toggleActions: 'play none none none',
        },
        clearProps: 'transform,opacity',
      });
    });
  }, { scope: containerRef, dependencies: [loading] });

  const handlePanelEnter = useCallback((index: number) => {
    const panel = panelRefs.current[index];
    if (panel) {
      gsap.to(panel, { y: -4, scale: 1.01, opacity: 1, duration: 0.24, ease: 'power2.out' });
    }
  }, []);

  const handlePanelLeave = useCallback((index: number) => {
    const panel = panelRefs.current[index];
    if (panel) {
      gsap.to(panel, { y: 0, scale: 1, opacity: 1, duration: 0.24, ease: 'power2.out', clearProps: 'transform' });
    }
  }, []);

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

  const pendingActivities = useMemo(() => {
    const real = home.activities.filter(a => !a.completed);
    if (real.length > 0 || loading) return real;
    const demoCompleted = localStorage.getItem('tandem:demo-completed') === 'true';
    if (demoCompleted) return [];
    return [{
      id: `demo-pictogramas-${user?.id || 'anon'}`,
      title: 'Preparar una merienda con pictogramas',
      description: 'Usar apoyos visuales para seguir una rutina simple',
      status: 'Pendiente',
      completed: false,
      assignedAt: 'Hoy',
    }] as PertenecienteHomeActivity[];
  }, [home.activities, loading, user]);

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
    <div ref={containerRef} className="min-h-screen bg-transparent px-4 pb-6 pt-2 sm:px-6 lg:px-8">
      <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 -mt-6 sm:-mt-8">
        <div className="w-full rounded-[24px] border border-[#e8dcf8] bg-gradient-to-br from-[#f9f4ff] via-[#f4ebff] to-[#eef8fb] py-5 shadow-[0_10px_30px_rgba(107,76,154,0.08)] sm:py-7">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
              <div data-hero-animate className="inline-flex items-center rounded-full border border-[#dbcdf5] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7b5fa6] shadow-sm">
                Resumen de hoy
              </div>
              <h1 data-hero-animate className="text-4xl font-black leading-[0.95] tracking-[-0.02em] text-[#2e2344] sm:text-5xl">
                Hola, {firstName}
              </h1>
              <p data-hero-animate className="max-w-2xl text-base leading-7 text-[#675a78] sm:text-lg">
                Tu día se ve más claro cuando tenés lo importante a mano.
              </p>
            </div>

            <div data-hero-animate className="flex flex-wrap justify-center gap-2 mt-6">
              {[
                { id: 'chat', label: 'Chat', icon: MessageCircle, tone: 'bg-white/85 text-[#5c3f7f]' },
                { id: 'calendar', label: 'Calendario', icon: Calendar, tone: 'bg-[#6f4ca6] text-white' },
                { id: 'notes', label: 'Notas', icon: FileText, tone: 'bg-[#fffafc] text-[#7b5fa6]' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold shadow-sm transition duration-200 hover:translate-y-[-1px] hover:scale-[1.02] ${item.tone}`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 sm:mt-10 flex w-full max-w-5xl flex-col space-y-3">
        <section
          data-reveal-section
          ref={el => { panelRefs.current[0] = el; }}
          onMouseEnter={() => handlePanelEnter(0)}
          onMouseLeave={() => handlePanelLeave(0)}
          className="rounded-[24px] border border-[#ece3f8] bg-white p-4 shadow-[0_8px_24px_rgba(107,76,154,0.06)] sm:p-5"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-[#7b5fa6]">{monthLabel}</p>
              <h2 className="text-lg sm:text-xl font-bold text-[#2e2344]">Mi semana</h2>
            </div>
            <button
              onClick={() => onNavigate?.('calendar')}
              className="text-sm font-semibold text-[#6f4ca6] transition hover:text-[#2e2344]"
            >
              Ver calendario
            </button>
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
                      ? 'border-[#6f4ca6] bg-[#6f4ca6] text-white shadow-sm'
                      : isSelected
                        ? 'border-[#e7daf7] bg-[#f8f2ff] text-[#2e2344]'
                        : hasEvents
                          ? 'border-transparent bg-[#f3eaff] text-[#6f4ca6]'
                          : 'border-transparent text-[#6b6380] hover:bg-[#f8f2ff]'
                  }`}
                >
                  <span className={`text-[11px] sm:text-xs font-semibold ${isToday ? 'text-white/80' : 'text-[#7b5fa6]'}`}>
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
                          style={{ backgroundColor: isToday ? 'currentColor' : '#6f4ca6' }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDay && eventsOn(selectedDay).length > 0 && (
            <div className="mt-5 space-y-2 rounded-[20px] border border-[#efe8f8] bg-[#fcf9ff]/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7b5fa6]">
                {selectedDay === todayKey
                  ? 'Hoy'
                  : new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric' })}
              </p>
              {eventsOn(selectedDay).slice(0, 3).map(e => (
                <div key={e.id} className="flex items-center gap-2.5 border-b border-[#f1e8fb] px-1 py-2 last:border-b-0">
                  <span className="text-lg">{typeEmoji[e.type]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#4a4a5a]">{e.title}</p>
                  </div>
                  <span className="text-xs font-medium text-[#7b5fa6]">{e.time}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] items-start py-8">
          {/* Column izquierda: Estado emocional (editorial) */}
          <section
            data-reveal-section
            ref={el => { panelRefs.current[2] = el; }}
            onMouseEnter={() => handlePanelEnter(2)}
            onMouseLeave={() => handlePanelLeave(2)}
            className="py-6 bg-transparent p-0"
          >
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">Estado emocional</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-white">¿Cómo te sentiste hoy?</h3>
            </div>

            <div className="mt-4">
              <h4 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white/95">
                {note?.trim() ? note : 'Contame brevemente cómo te sentiste hoy.'}
              </h4>
            </div>

            <textarea
              value={note}
              onChange={e => { setNote(e.target.value); setSaved(false); }}
              placeholder="Escribí acá lo que sentís o pensás..."
              rows={3}
              className="mt-6 w-full resize-none bg-transparent p-0 text-sm text-slate-100 placeholder:text-slate-300 outline-none transition focus:ring-0"
            />

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[#b5a8c8]">
                <Smile size={18} className="cursor-pointer transition hover:text-[#d6bff6]" />
                <Paperclip size={16} className="cursor-pointer transition hover:text-[#d6bff6]" />
              </div>

              <div className="flex items-center gap-3">
                {saved && (
                  <span className="text-xs font-medium text-emerald-600">Nota guardada</span>
                )}
                <button
                  onClick={handleSaveNote}
                  disabled={!note.trim()}
                  className="text-sm font-semibold text-[#d6bff6] transition-opacity disabled:opacity-40"
                >
                  Guardar nota
                </button>
              </div>
            </div>
          </section>

          {/* Column derecha: Próximas acciones como Timeline */}
          <section
            data-reveal-section
            ref={el => { panelRefs.current[1] = el; }}
            onMouseEnter={() => handlePanelEnter(1)}
            onMouseLeave={() => handlePanelLeave(1)}
            className="py-6"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">Tablero emocional</p>
                <h3 className="text-lg font-semibold text-white">Elige cómo te sentís</h3>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
              {[
                { id: 'tranquilo', label: 'Tranquilo', emoji: '😌', color: 'bg-emerald-500' },
                { id: 'contento', label: 'Contento', emoji: '😊', color: 'bg-yellow-400' },
                { id: 'animado', label: 'Animado', emoji: '🎉', color: 'bg-indigo-500' },
                { id: 'ansioso', label: 'Ansioso', emoji: '😟', color: 'bg-orange-500' },
                { id: 'frustrado', label: 'Frustrado', emoji: '😤', color: 'bg-red-500' },
                { id: 'motivado', label: 'Motivado', emoji: '💪', color: 'bg-pink-500' },
              ].map(e => (
                <button
                  key={e.id}
                  onClick={() => { setNote(e.label); setSaved(false); }}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 bg-white/03 hover:bg-white/06 transition`}
                >
                  <span className={`${e.color} inline-flex h-9 w-9 items-center justify-center rounded-full text-white text-lg`}>{e.emoji}</span>
                  <span className="text-sm font-semibold text-slate-100">{e.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Próximas acciones debajo de todo, fondo transparente para integrarse */}
        <section
          data-reveal-section
          ref={el => { panelRefs.current[1] = el; }}
          className="mt-6 py-6 bg-slate-900 p-6 rounded-lg"
        >
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">Próximas acciones</p>
            <h3 className="text-lg font-semibold text-white">Lo que sigue</h3>
          </div>

          {loading ? (
            <div className="py-4 text-sm text-slate-200">Cargando actividades...</div>
          ) : pendingActivities.length === 0 ? (
            <div className="py-4 text-sm text-slate-200">No tenés actividades pendientes.</div>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-800" aria-hidden />
              {pendingActivities.slice(0, 6).map((activity, idx) => (
                <div key={activity.id} className="relative mb-8 pl-6">
                  <span className="absolute left-0 top-1.5 h-3 w-3 -translate-x-1/2 rounded-full bg-indigo-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100">{activity.title}</p>
                    <p className="mt-1 text-xs text-slate-300">{activity.description}</p>
                    <div className="mt-1 text-[10px] text-slate-400">{activity.assignedAt}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
