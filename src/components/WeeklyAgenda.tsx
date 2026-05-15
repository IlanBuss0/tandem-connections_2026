import { useMemo, useState } from 'react';
import { calendarEvents, User } from '@/data/api';
import { useCustomActivities } from '@/contexts/CustomActivitiesContext';
import { toast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  user: User;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am - 8pm
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function startOfWeek(d: Date) {
  const r = new Date(d);
  const day = (r.getDay() + 6) % 7; // Lun = 0
  r.setDate(r.getDate() - day);
  r.setHours(0, 0, 0, 0);
  return r;
}
function fmt(d: Date) { return d.toISOString().split('T')[0]; }

export default function WeeklyAgenda({ user }: Props) {
  const { items: customActs, createOrUpdate } = useCustomActivities();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; hour: number } | null>(null);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const events = useMemo(() => {
    return calendarEvents
      .filter(e => e.userId === user.id)
      .filter(e => {
        const d = new Date(e.date);
        return d >= weekStart && d < new Date(weekStart.getTime() + 7 * 86400000);
      });
  }, [user.id, weekStart]);

  const eventByDateHour = useMemo(() => {
    const map: Record<string, typeof events> = {};
    events.forEach(e => {
      const h = parseInt(e.time.split(':')[0], 10);
      const key = `${e.date}-${h}`;
      map[key] = map[key] || [];
      map[key].push(e);
    });
    return map;
  }, [events]);

  // Actividades custom asignadas a este user
  const assignedActs = useMemo(
    () => customActs.filter(a => !a.draft && (a.assignedToIds?.includes(user.id) || true)),
    [customActs, user.id]
  );

  const goPrev = () => { const n = new Date(weekStart); n.setDate(n.getDate() - 7); setWeekStart(n); };
  const goNext = () => { const n = new Date(weekStart); n.setDate(n.getDate() + 7); setWeekStart(n); };
  const goToday = () => setWeekStart(startOfWeek(new Date()));

  const weekLabel = `${days[0].getDate()}/${days[0].getMonth() + 1} – ${days[6].getDate()}/${days[6].getMonth() + 1}`;
  const todayKey = fmt(new Date());

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
          <Clock size={16} className="text-primary" /> Agenda semanal · {user.name.split(' ')[0]}
        </h3>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={goPrev} className="h-8 w-8 p-0"><ChevronLeft size={14} /></Button>
          <Button size="sm" variant="outline" onClick={goToday} className="h-8 text-xs">Hoy</Button>
          <span className="text-xs font-medium text-foreground px-2 min-w-[100px] text-center">{weekLabel}</span>
          <Button size="sm" variant="outline" onClick={goNext} className="h-8 w-8 p-0"><ChevronRight size={14} /></Button>
        </div>
      </div>

      {/* Grid: scroll horizontal en mobile */}
      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Días header */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border sticky top-0 bg-card z-10">
            <div />
            {days.map((d, i) => {
              const isToday = fmt(d) === todayKey;
              return (
                <div key={i} className={`p-2 text-center border-l border-border ${isToday ? 'bg-primary/10' : ''}`}>
                  <p className="text-[10px] text-muted-foreground uppercase">{DAYS[i]}</p>
                  <p className={`text-sm font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>{d.getDate()}</p>
                </div>
              );
            })}
          </div>

          {/* Horas */}
          {HOURS.map(h => (
            <div key={h} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/50">
              <div className="p-1 text-[10px] text-muted-foreground text-right pr-2 border-r border-border">{h}:00</div>
              {days.map((d, i) => {
                const dateKey = fmt(d);
                const evs = eventByDateHour[`${dateKey}-${h}`] || [];
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedSlot({ date: dateKey, hour: h })}
                    className="border-l border-border min-h-[40px] p-1 hover:bg-muted/40 text-left relative group"
                  >
                    {evs.map(e => (
                      <div key={e.id} className="text-[9px] p-1 rounded mb-0.5 truncate text-white" style={{ background: e.color }}>
                        {e.title}
                      </div>
                    ))}
                    {evs.length === 0 && (
                      <span className="opacity-0 group-hover:opacity-100 text-[9px] text-primary flex items-center gap-0.5"><Plus size={10} /> asignar</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Drawer asignación */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setSelectedSlot(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-card w-full sm:w-[480px] sm:rounded-xl rounded-t-xl border border-border shadow-xl p-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h4 className="font-heading font-bold text-foreground mb-1">Asignar actividad</h4>
            <p className="text-xs text-muted-foreground mb-3">{selectedSlot.date} · {selectedSlot.hour}:00</p>

            {assignedActs.length === 0 ? (
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-sm text-foreground">No tenés actividades publicadas todavía.</p>
                <p className="text-xs text-muted-foreground mt-1">Creá una en la pestaña "Actividades" y luego asignala desde acá.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {assignedActs.map(a => (
                  <div key={a.id} className="bg-muted/40 rounded-lg p-3 flex items-start gap-3">
                    <span className="text-2xl">✨</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{a.title}</p>
                      <p className="text-[10px] text-muted-foreground">{a.steps.length} pasos · {a.duration} min · {a.difficulty}</p>
                    </div>
                    <Button
                      size="sm"
                      className="gradient-primary text-primary-foreground text-xs"
                      onClick={() => {
                        const next = Array.from(new Set([...(a.assignedToIds || []), user.id]));
                        createOrUpdate({
                          id: a.id,
                          title: a.title,
                          category: a.category,
                          objective: a.objective,
                          description: a.description,
                          difficulty: a.difficulty,
                          duration: a.duration,
                          steps: a.steps,
                          stepIcons: a.stepIcons,
                          points: a.points,
                          type: a.type,
                          completionMessage: a.completionMessage,
                          assignedTo: a.assignedTo,
                          draft: false,
                          assignedToIds: next,
                          dueDate: selectedSlot.date,
                          notes: `${a.notes ?? ''}\nProgramada: ${selectedSlot.date} ${selectedSlot.hour}:00`.trim(),
                        });
                        toast({ title: 'Actividad asignada', description: `${a.title} → ${user.name.split(' ')[0]} · ${selectedSlot.date} ${selectedSlot.hour}:00` });
                        setSelectedSlot(null);
                      }}
                    >
                      Asignar
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button variant="outline" className="w-full mt-3" onClick={() => setSelectedSlot(null)}>Cerrar</Button>
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          { label: 'Terapia', c: 'hsl(270 40% 75%)' },
          { label: 'Escuela', c: 'hsl(210 70% 55%)' },
          { label: 'Social', c: 'hsl(150 60% 45%)' },
          { label: 'Médico', c: 'hsl(0 72% 55%)' },
          { label: 'Personal', c: 'hsl(30 80% 60%)' },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1 text-muted-foreground">
            <span className="w-3 h-3 rounded" style={{ background: l.c }} /> {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
