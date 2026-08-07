import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '@/contexts/AuthContext';
import { useCalendar } from '@/contexts/CalendarContext';
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
import { createPersonalNote, fetchPertenecienteHome, PertenecienteHomeData, PertenecienteHomeActivity } from '@/data/api';
import EventPictogram from '@/components/EventPictogram';
import { useCalendarPictograms } from '@/hooks/useCalendarPictograms';
import BelongingHomeSecondaryAccess from '@/components/belonging/BelongingHomeSecondaryAccess';
import { useEmotions } from '@/contexts/EmotionsContext';
import { useWallet } from '@/contexts/WalletContext';

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

const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function statusStyle(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('complet')) return 'bg-emerald-100 text-emerald-700';
  if (s.includes('progreso') || s.includes('en curso')) return 'bg-blue-100 text-blue-700';
  return 'bg-amber-100 text-amber-700';
}

const CARD_GAP = 16;
const primarySaveButtonClass = 'rounded-xl bg-[#6f4ca6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5a3c8a] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45';
const homeRequests = new Map<string, Promise<PertenecienteHomeData>>();

function loadPertenecienteHome(
  userId: string,
  onActivitiesReady: (activities: PertenecienteHomeActivity[]) => void,
) {
  const existing = homeRequests.get(userId);
  if (existing) return existing;
  const request = fetchPertenecienteHome(userId, { onActivitiesReady, skipProfileLookups: true })
    .finally(() => homeRequests.delete(userId));
  homeRequests.set(userId, request);
  return request;
}

gsap.registerPlugin(ScrollTrigger);

export default function UserHome({ onNavigate }: Props) {
  const { user } = useAuth();
  const { add: addEmotion } = useEmotions();
  const { state: wallet } = useWallet();
  const { events, eventsOn } = useCalendar();
  const [home, setHome] = useState<PertenecienteHomeData>(emptyHome);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => fmt(new Date()));
  const selectedDayEvents = useMemo(() => events.filter(event => event.date === selectedDay), [events, selectedDay]);
  const [secondaryContentReady, setSecondaryContentReady] = useState(false);
  useCalendarPictograms(secondaryContentReady ? selectedDayEvents : []);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [selectedBoardEmotion, setSelectedBoardEmotion] = useState<{ label: string; emoji: string } | null>(null);
  const [savingBoardEmotion, setSavingBoardEmotion] = useState(false);
  const [boardEmotionSaved, setBoardEmotionSaved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const reveal = () => setSecondaryContentReady(true);
    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(reveal, { timeout: 1800 });
      return () => window.cancelIdleCallback(idleId);
    }
    const timer = window.setTimeout(reveal, 600);
    return () => window.clearTimeout(timer);
  }, []);

  useGSAP(() => {
    const container = containerRef.current;
    if (!container) return;

    const heroItems = Array.from(container.querySelectorAll<HTMLElement>('[data-hero-animate]'));
    const revealSections = Array.from(container.querySelectorAll<HTMLElement>('[data-reveal-section]'));

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.from(heroItems, {
      y: 30,
      duration: 0.7,
      stagger: 0.18,
      clearProps: 'all',
    });

    revealSections.forEach(section => {
      gsap.from(section, {
        y: 24,
        duration: 0.75,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          once: true,
          toggleActions: 'play none none none',
        },
        clearProps: 'transform',
      });
    });
  }, { scope: containerRef, dependencies: [] });

  const handlePanelEnter = useCallback((index: number) => {
    const panel = panelRefs.current[index];
    if (panel) {
      gsap.to(panel, { y: -4, scale: 1.01, duration: 0.24, ease: 'power2.out' });
    }
  }, []);

  const handlePanelLeave = useCallback((index: number) => {
    const panel = panelRefs.current[index];
    if (panel) {
      gsap.to(panel, { y: 0, scale: 1, duration: 0.24, ease: 'power2.out', clearProps: 'transform' });
    }
  }, []);

  const handleSaveNote = async () => {
    if (!note.trim() || savingNote || !user) return;
    setSavingNote(true);
    try {
      await createPersonalNote(user.id, note);
      setSaved(true);
      setNote('');
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('No pudimos guardar la nota. Intentá nuevamente.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleSaveBoardEmotion = async () => {
    if (!selectedBoardEmotion || savingBoardEmotion) return;
    setSavingBoardEmotion(true);
    try {
      await addEmotion({
        emotion: selectedBoardEmotion.label,
        emoji: selectedBoardEmotion.emoji,
        intensity: 3,
        context: '',
        whatHelped: '',
      });
      setBoardEmotionSaved(true);
      setSelectedBoardEmotion(null);
      setTimeout(() => setBoardEmotionSaved(false), 2500);
    } finally {
      setSavingBoardEmotion(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (!user || user.role !== 'user') return;

    setLoading(true);
    setError('');
    loadPertenecienteHome(user.id, (activities) => {
      if (mounted) setHome(current => ({ ...current, activities }));
    })
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
  }, [user?.id, user?.role]);

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
    <div ref={containerRef} className="min-h-screen px-4 pb-6 pt-2 sm:px-6 lg:px-8">
      <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 -mt-6 sm:-mt-8">
        <div className="w-full rounded-[24px] border border-[#e8dcf8] bg-gradient-to-br from-[#f9f4ff] via-[#f4ebff] to-[#eef8fb] py-5 shadow-[0_10px_30px_#eadff6] sm:py-7">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
              <h1 data-hero-animate className="text-4xl font-black leading-[0.95] tracking-[-0.02em] text-[#2e2344] sm:text-5xl">
                Hola, {firstName}
              </h1>
              <p data-hero-animate className="max-w-2xl text-base leading-7 text-[#675a78] sm:text-lg">
                Tu día se ve más claro cuando tenés lo importante a mano.
              </p>
            </div>

            <div data-hero-animate className="flex flex-wrap justify-center gap-2 mt-6">
              {[
                { id: 'chat', label: 'Chat', icon: MessageCircle, tone: 'bg-white text-[#5c3f7f]' },
                { id: 'calendar', label: 'Calendario', icon: Calendar, tone: 'bg-[#6f4ca6] text-white' },
                { id: 'emotions', label: 'Registro personal', icon: FileText, tone: 'bg-[#fffafc] text-[#7b5fa6]' },
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
          className="rounded-[24px] border border-[#ece3f8] bg-white p-4 shadow-[0_8px_24px_#f0e8f8] sm:p-5"
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

          <div translate="no" className="notranslate flex justify-between gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                  <span translate="no" className={`notranslate text-[11px] sm:text-xs font-semibold ${isToday ? 'text-[#efe8ff]' : 'text-[#7b5fa6]'}`}>
                    {diasSemana[d.getDay()]}
                  </span>
                  <span className={`text-xl sm:text-2xl font-extrabold mt-1 leading-none ${isToday ? '' : 'text-[#4a3a6a]'}`}>
                    {d.getDate()}
                  </span>
                  {hasEvents && (
                    <div className={`mt-1.5 flex gap-1 ${isToday ? 'text-[#efe8ff]' : ''}`}>
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

          {selectedDay && selectedDayEvents.length > 0 && (
            <div className="mt-5 space-y-2 rounded-[20px] border border-[#efe8f8] bg-[#fcf9ff] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7b5fa6]">
                {selectedDay === todayKey
                  ? 'Hoy'
                  : new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric' })}
              </p>
              {selectedDayEvents.slice(0, 3).map(e => (
                <div key={e.id} className="flex items-center gap-2.5 border-b border-[#f1e8fb] px-1 py-2 last:border-b-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                    <EventPictogram event={e} size="sm" />
                  </span>
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
            className="rounded-[24px] border border-[#ece3f8] bg-white p-6 shadow-[0_8px_24px_#f0e8f8]"
          >
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7b5fa6]">Estado emocional</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#2e2344]">¿Cómo te sentiste hoy?</h3>
            </div>

            <button type="button" onClick={() => onNavigate?.('emotions')} className="text-sm font-semibold text-[#6f4ca6] transition hover:text-[#2e2344]">
              Ver más
            </button>

            <textarea
              value={note}
              onChange={e => { setNote(e.target.value); setSaved(false); }}
              placeholder="Escribí acá lo que sentís o pensás..."
              rows={3}
              className="mt-4 w-full resize-none rounded-2xl border border-[#efe8f8] bg-[#fcf9ff] p-3 text-sm text-[#4a4a5a] placeholder:text-[#8b7aa0] outline-none transition focus:ring-0"
            />

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[#8b7aa0]">
                <Smile size={18} className="cursor-pointer transition hover:text-[#6f4ca6]" />
                <Paperclip size={16} className="cursor-pointer transition hover:text-[#6f4ca6]" />
              </div>

              <div className="flex items-center gap-3">
                {saved && (
                  <span className="text-xs font-medium text-emerald-600">Nota guardada</span>
                )}
                <button
                  onClick={handleSaveNote}
                  disabled={!note.trim() || savingNote}
                  className={primarySaveButtonClass}
                >
                  {savingNote ? 'Guardando...' : 'Guardar Nota'}
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
            className="rounded-[24px] border border-[#ece3f8] bg-white p-6 shadow-[0_8px_24px_#f0e8f8]"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7b5fa6]">Tablero emocional</p>
                <h3 className="text-lg font-semibold text-[#2e2344]">Elige cómo te sentís</h3>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
              {[
                { id: 'tranquilo', label: 'Tranquilo', emoji: '😌' },
                { id: 'contento', label: 'Contento', emoji: '😊' },
                { id: 'animado', label: 'Animado', emoji: '🎉' },
                { id: 'ansioso', label: 'Ansioso', emoji: '😟' },
                { id: 'frustrado', label: 'Frustrado', emoji: '😤' },
                { id: 'motivado', label: 'Motivado', emoji: '💪' },
              ].map(e => (
                <button
                  key={e.id}
                  aria-label={e.label}
                  aria-pressed={selectedBoardEmotion?.label === e.label}
                  onClick={() => { setSelectedBoardEmotion({ label: e.label, emoji: e.emoji }); setBoardEmotionSaved(false); }}
                  className={`flex min-h-14 items-center justify-center rounded-lg border px-3 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f4ca6] focus-visible:ring-offset-2 ${selectedBoardEmotion?.label === e.label ? 'border-[#6f4ca6] bg-[#f1e8ff] ring-2 ring-[#6f4ca6]/20' : 'border-[#efe8f8] bg-[#fcf9ff] hover:bg-[#f8f2ff]'}`}
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center text-2xl leading-none" aria-hidden="true">{e.emoji}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              {boardEmotionSaved && <span className="text-xs font-medium text-emerald-600">Emoción guardada</span>}
              <button type="button" onClick={handleSaveBoardEmotion} disabled={!selectedBoardEmotion || savingBoardEmotion} className={`ml-auto ${primarySaveButtonClass}`}>
                {savingBoardEmotion ? 'Guardando...' : 'Guardar emoción'}
              </button>
            </div>
          </section>
        </div>

        {/* Próximas acciones debajo de todo, fondo transparente para integrarse */}
        <section
          data-reveal-section
          ref={el => { panelRefs.current[1] = el; }}
          className="mt-6 rounded-[24px] border border-[#ece3f8] bg-white p-6 shadow-[0_8px_24px_#f0e8f8]"
        >
          <div className="relative mb-4 pr-0 sm:pr-24">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7b5fa6]">Próximas acciones</p>
            <h3 className="text-lg font-semibold text-[#2e2344]">Lo que sigue</h3>
            <div className="absolute right-0 top-0 hidden items-center gap-2 sm:flex">
              <button type="button" onClick={() => scrollCarousel('left')} disabled={!canScrollLeft} aria-label="Actividad anterior" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e6daf5] bg-white text-[#6f4ca6] transition hover:bg-[#f5f0ff] disabled:opacity-35"><ChevronLeft size={18} /></button>
              <button type="button" onClick={() => scrollCarousel('right')} disabled={!canScrollRight} aria-label="Actividad siguiente" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e6daf5] bg-white text-[#6f4ca6] transition hover:bg-[#f5f0ff] disabled:opacity-35"><ChevronRight size={18} /></button>
            </div>
          </div>

          {loading ? (
            <div className="py-4 text-sm text-[#4a4a5a]">Cargando actividades...</div>
          ) : pendingActivities.length === 0 ? (
            <div className="py-4 text-sm text-[#4a4a5a]">No tenés actividades pendientes.</div>
          ) : (
            <div ref={scrollRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pr-[12%] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:pr-[8%] lg:pr-6">
              {pendingActivities.slice(0, 6).map((activity) => (
                <article key={activity.id} className="flex min-h-[180px] min-w-[82%] snap-start flex-col rounded-[20px] border border-[#ece3f8] bg-[#fcf9ff] p-5 shadow-sm sm:min-w-[46%] lg:min-w-[31%]">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyle(activity.status)}`}>{activity.status}</span>
                    <span className="text-[10px] font-medium text-[#8b7aa0]">{activity.assignedAt}</span>
                  </div>
                  <h4 className="mt-5 break-words text-base font-bold leading-6 text-[#3f3153]">{activity.title}</h4>
                  <p className="mt-2 line-clamp-3 break-words text-sm leading-5 text-[#756a82]">{activity.description}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <BelongingHomeSecondaryAccess
        level={'level' in user ? user.level : home.level}
        points={wallet.balance}
        avatar={user.avatar}
        onNavigate={onNavigate}
      />

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
