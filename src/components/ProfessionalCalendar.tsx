import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  fetchProfessionalSessions,
  type ProfessionalSession,
} from '@/data/api';
import type { AgendaPatient } from '@/components/ProfessionalAgenda';
import { useToast } from '@/components/ui/use-toast';

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const weekDays = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sessionDateKey(session: ProfessionalSession) {
  return dateKey(new Date(session.fecha_sesion));
}

export default function ProfessionalCalendar({ patients, onOpenAgenda }: { patients: AgendaPatient[]; onOpenAgenda?: () => void }) {
  const { toast } = useToast();
  const today = new Date();
  const todayKey = dateKey(today);
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [sessions, setSessions] = useState<ProfessionalSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProfessionalSessions()
      .then(rows => { if (!cancelled) setSessions(rows); })
      .catch(() => toast({ title: 'No se pudo cargar el calendario profesional', variant: 'destructive' }))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [toast]);

  const patientById = useMemo(() => new Map(patients.map(patient => [patient.pertenecienteId, patient])), [patients]);
  const visibleSessions = useMemo(
    () => sessions.filter(session => patientById.has(Number(session.id_perteneciente))),
    [patientById, sessions],
  );
  const sessionsByDate = useMemo(() => {
    return visibleSessions.reduce<Record<string, ProfessionalSession[]>>((acc, session) => {
      const key = sessionDateKey(session);
      acc[key] = [...(acc[key] || []), session].sort((a, b) => a.fecha_sesion.localeCompare(b.fecha_sesion));
      return acc;
    }, {});
  }, [visibleSessions]);

  const monthDays = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return {
      blanks: Array.from({ length: startOffset }, (_, index) => index),
      days: Array.from({ length: daysInMonth }, (_, index) => {
        const date = new Date(year, month, index + 1);
        return { day: index + 1, key: dateKey(date) };
      }),
    };
  }, [cursor]);

  const selectedSessions = sessionsByDate[selectedDate] || [];
  const monthLabel = `${monthNames[cursor.getMonth()]} ${cursor.getFullYear()}`;

  const changeMonth = (offset: number) => {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + offset, 1);
    setCursor(next);
    setSelectedDate(dateKey(next));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold">Calendario profesional</h2>
          <p className="text-sm text-muted-foreground">Vista mensual de sesiones programadas</p>
        </div>
        {onOpenAgenda && <Button variant="outline" onClick={onOpenAgenda}>Ir a agenda</Button>}
      </div>

      <section className="rounded-xl border bg-card p-4">
        <div className="mb-4 grid grid-cols-[auto_1fr_auto] items-center gap-2">
          <button onClick={() => changeMonth(-1)} className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted" aria-label="Mes anterior">
            <ChevronLeft size={18} />
          </button>
          <div className="text-center font-semibold">{monthLabel}</div>
          <button onClick={() => changeMonth(1)} className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted" aria-label="Mes siguiente">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {weekDays.map(day => <div key={day} className="py-2">{day}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {monthDays.blanks.map(blank => <div key={`blank-${blank}`} className="min-h-20" />)}
          {monthDays.days.map(({ day, key }) => {
            const daySessions = sessionsByDate[key] || [];
            const selected = key === selectedDate;
            const isToday = key === todayKey;
            return (
              <button
                key={key}
                onClick={() => setSelectedDate(key)}
                className={`min-h-20 rounded-md border p-2 text-left transition ${selected ? 'border-primary bg-primary/10' : isToday ? 'border-primary/50 bg-muted/40' : 'border-border bg-background hover:bg-muted/50'}`}
              >
                <span className="text-sm font-semibold">{day}</span>
                <div className="mt-2 space-y-1">
                  {daySessions.slice(0, 2).map(session => (
                    <div key={session.id} className="truncate rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {new Date(session.fecha_sesion).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} {session.titulo}
                    </div>
                  ))}
                  {daySessions.length > 2 && <div className="text-[10px] text-muted-foreground">+{daySessions.length - 2} mas</div>}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Sesiones del dia</h3>
          {loading && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
        </div>
        {!loading && selectedSessions.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            <CalendarDays className="mx-auto mb-2" />
            No hay sesiones para este dia.
          </div>
        )}
        <div className="space-y-2">
          {selectedSessions.map(session => {
            const patient = patientById.get(Number(session.id_perteneciente));
            return (
              <div key={session.id} className="rounded-lg border bg-background p-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Clock size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{session.titulo}</p>
                    <p className="text-sm text-muted-foreground">
                      {patient?.name || 'Paciente'} · {new Date(session.fecha_sesion).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })} · {session.duracion_minutos} min
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize text-muted-foreground">{session.estado}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
