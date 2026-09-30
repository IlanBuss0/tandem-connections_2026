import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, CheckCheck, Loader2, Pencil, Plus, Repeat, X } from "lucide-react";
import { useCalendar } from "@/contexts/CalendarContext";
import {
  createProfessionalSession,
  deleteProfessionalSession,
  fetchProfessionalSessions,
  updateProfessionalSession,
  type CalendarEvent,
  type ProfessionalSession,
} from "@/data/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import ProfessionalPrivateNote from "@/components/ProfessionalPrivateNote";
import { decodePatientLink } from "@/components/PersonalEventCalendar";
import { AgendaSheet } from "@/components/agenda/AgendaSheet";
import AgendaItemMenu, { type MenuAction } from "@/components/agenda/AgendaItemMenu";
import { EventRow, SessionRow } from "@/components/agenda/AgendaDayRow";
import EventFormSheet, { type EventPayload } from "@/components/agenda/EventFormSheet";
import SeriesEditSheet from "@/components/agenda/SeriesEditSheet";
import SessionFormSheet, { type AgendaPatient, type SessionForm } from "@/components/agenda/SessionFormSheet";
import { countPastScheduled, useSeriesCompletion } from "@/hooks/useSeriesCompletion";
import { clockOf, dayLabel, localDateKey, longDate } from "@/lib/agendaFormat";
import { eventDotClass, sessionStatusDotClass } from "@/lib/sessionStatus";
import { cn } from "@/lib/utils";

export type { AgendaPatient };

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MAX_CELL_ITEMS = 3;
const LEGEND = [
  { label: "sesión programada", dot: "bg-primary" },
  { label: "completada", dot: "bg-emerald-500" },
  { label: "sin nota / ausente", dot: "bg-amber-500" },
  { label: "cancelada", dot: "bg-rose-500" },
  { label: "evento personal", dot: eventDotClass },
];

type DayItem =
  | { kind: "session"; key: string; time: string; label: string; dot: string; session: ProfessionalSession }
  | { kind: "event"; key: string; time: string; label: string; dot: string; event: CalendarEvent };

type MenuTarget = { item: DayItem; title: string; subtitle: string };

const emptyForm = (fecha: string, id_perteneciente = ""): SessionForm => ({
  id_perteneciente,
  titulo: "Sesión profesional",
  fecha,
  hora: "09:00",
  duracion_minutos: "60",
  estado: "programada",
  motivo_cancelacion: "",
  recurrence_frequency: "none",
  recurrence_count: "8",
});

export default function ProfessionalCalendar({
  patients,
  initialPatientId,
  onPrepareSession,
}: {
  patients: AgendaPatient[];
  initialPatientId?: number;
  onPrepareSession?: (session: ProfessionalSession) => void;
}) {
  const { toast } = useToast();
  const { events, addEvent, updateEvent, deleteEvent } = useCalendar();
  const [sessions, setSessions] = useState<ProfessionalSession[]>([]);
  const [loading, setLoading] = useState(true);
  const todayKey = localDateKey(new Date());
  const [cursor, setCursor] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1); });
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [sessionForm, setSessionForm] = useState<SessionForm | null>(null);
  const [eventForm, setEventForm] = useState<{ editing: CalendarEvent | null } | null>(null);
  const [dayOpen, setDayOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menu, setMenu] = useState<MenuTarget | null>(null);
  const [seriesEditId, setSeriesEditId] = useState<string | null>(null);
  const [noteSession, setNoteSession] = useState<ProfessionalSession | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSessions(await fetchProfessionalSessions());
    } catch {
      toast({ title: "No se pudo cargar el calendario profesional", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const { completing, markPastAsCompleted } = useSeriesCompletion(load);

  useEffect(() => {
    // Solo cuando llega un paciente preseleccionado (p.ej. "Proponer sesión" desde el paciente).
    if (initialPatientId) setSessionForm(emptyForm(todayKey, String(initialPatientId)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPatientId]);

  const patientById = useMemo(() => new Map(patients.map((patient) => [patient.pertenecienteId, patient])), [patients]);
  const patientOptions = useMemo(() => patients.map((patient) => ({ id: String(patient.pertenecienteId), name: patient.name })), [patients]);
  const visibleSessions = useMemo(
    () => sessions.filter((session) => patientById.has(Number(session.id_perteneciente))),
    [patientById, sessions],
  );
  const seriesById = useMemo(() => {
    const map = new Map<string, ProfessionalSession[]>();
    visibleSessions.forEach((session) => {
      if (session.recurrence_group_id) map.set(session.recurrence_group_id, [...(map.get(session.recurrence_group_id) || []), session]);
    });
    map.forEach((list) => list.sort((a, b) => a.fecha_sesion.localeCompare(b.fecha_sesion)));
    return map;
  }, [visibleSessions]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, DayItem[]>();
    const add = (dateKey: string, item: DayItem) => map.set(dateKey, [...(map.get(dateKey) || []), item]);
    visibleSessions.forEach((session) => {
      const date = new Date(session.fecha_sesion);
      const time = clockOf(date);
      const name = patientById.get(Number(session.id_perteneciente))?.name || "Paciente";
      add(localDateKey(date), { kind: "session", key: `s-${session.id}`, time, label: `${time} ${name}`, dot: sessionStatusDotClass(session), session });
    });
    events.forEach((event) => add(event.date, { kind: "event", key: `e-${event.id}`, time: event.time, label: `${event.time} ${event.title}`, dot: eventDotClass, event }));
    map.forEach((list) => list.sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [events, patientById, visibleSessions]);

  const monthLayout = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    return {
      blanks: (new Date(year, month, 1).getDay() + 6) % 7,
      days: Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, index) => ({ day: index + 1, key: localDateKey(new Date(year, month, index + 1)) })),
    };
  }, [cursor]);

  const goToMonth = (offset: number) => {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + offset, 1);
    setCursor(next);
    setSelectedDate(localDateKey(next));
  };
  const goToToday = () => {
    const now = new Date();
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(todayKey);
  };

  const sessionName = (session: ProfessionalSession) => patientById.get(Number(session.id_perteneciente))?.name || "Paciente";

  const openEditSession = (session: ProfessionalSession) => {
    const date = new Date(session.fecha_sesion);
    setSessionForm({
      id: session.id,
      id_perteneciente: String(session.id_perteneciente),
      titulo: session.titulo,
      fecha: localDateKey(date),
      hora: clockOf(date),
      duracion_minutos: String(session.duracion_minutos),
      estado: session.estado,
      motivo_cancelacion: session.motivo_cancelacion || "",
      recurrence_frequency: "none",
      recurrence_count: "1",
    });
  };

  const submitSession = async () => {
    const form = sessionForm;
    if (!form?.id_perteneciente || !form.titulo.trim()) return;
    setSaving(true);
    try {
      const basePayload = {
        id_perteneciente: Number(form.id_perteneciente),
        titulo: form.titulo.trim(),
        fecha_sesion: new Date(`${form.fecha}T${form.hora}:00`).toISOString(),
        duracion_minutos: Number(form.duracion_minutos),
        estado: form.estado,
        motivo_cancelacion: form.estado === "cancelada" ? form.motivo_cancelacion.trim() || null : null,
        recordatorios: [],
      };
      if (form.id) {
        // No mandar recurrence_rule al editar: el backend preserva la recurrencia
        // existente cuando el campo viene ausente; {frequency:"none"} pisaría la serie.
        await updateProfessionalSession(form.id, basePayload);
      } else {
        await createProfessionalSession({
          ...basePayload,
          recurrence_rule: form.recurrence_frequency === "none"
            ? { frequency: "none" as const }
            : { frequency: form.recurrence_frequency, count: Number(form.recurrence_count) },
        });
      }
      toast({ title: form.id ? "Sesión actualizada" : form.recurrence_frequency === "none" ? "Sesión programada" : "Sesiones recurrentes programadas" });
      setSessionForm(null);
      setSelectedDate(form.fecha);
      setCursor(new Date(`${form.fecha.slice(0, 7)}-01T12:00:00`));
      await load();
    } catch (error) {
      toast({ title: "No se pudo guardar la sesión", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteSession = async (session: ProfessionalSession) => {
    if (!window.confirm("¿Eliminar esta sesión?")) return;
    try {
      await deleteProfessionalSession(session.id);
      await load();
    } catch (error) {
      toast({ title: "No se pudo eliminar la sesión", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    }
  };

  const saveEvent = async (payload: EventPayload) => {
    const editing = eventForm?.editing;
    setSaving(true);
    try {
      if (editing) await updateEvent(editing.id, payload);
      else await addEvent(payload);
      setEventForm(null);
      setSelectedDate(payload.date);
      setCursor(new Date(`${payload.date.slice(0, 7)}-01T12:00:00`));
    } catch (error) {
      toast({ title: "No se pudo guardar el evento", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const removeEvent = async (event: CalendarEvent) => {
    if (!window.confirm("¿Eliminar evento?")) return;
    try {
      await deleteEvent(event.id);
    } catch {
      toast({ title: "No se pudo eliminar el evento", variant: "destructive" });
    }
  };

  const menuActions = (item: DayItem): MenuAction[] => {
    if (item.kind === "event") {
      return [
        { label: "Editar evento", icon: <Pencil size={22} />, onClick: () => setEventForm({ editing: item.event }) },
        { label: "Eliminar evento", icon: <X size={22} />, danger: true, onClick: () => removeEvent(item.event) },
      ];
    }
    const { session } = item;
    const groupId = session.recurrence_group_id;
    const actions: MenuAction[] = [{ label: "Editar sesión", icon: <Pencil size={22} />, onClick: () => openEditSession(session) }];
    if (groupId) {
      const pending = countPastScheduled(seriesById.get(groupId) || []);
      actions.push(
        { label: "Editar serie", icon: <Repeat size={22} />, onClick: () => setSeriesEditId(groupId) },
        {
          label: "Marcar pasadas como completadas",
          icon: completing ? <Loader2 size={22} className="animate-spin" /> : <CheckCheck size={22} />,
          disabled: pending === 0 || completing,
          hint: pending === 0 ? "No hay sesiones pasadas pendientes." : undefined,
          onClick: () => markPastAsCompleted(groupId),
        },
      );
    }
    actions.push({ label: "Eliminar sesión", icon: <X size={22} />, danger: true, onClick: () => deleteSession(session) });
    return actions;
  };

  const openMenu = (item: DayItem) => {
    if (item.kind === "event") {
      setMenu({ item, title: item.event.title, subtitle: `${longDate(item.event.date)} · Evento personal` });
      return;
    }
    const { session } = item;
    setMenu({
      item,
      title: `${sessionName(session)} · ${item.time}`,
      subtitle: `${dayLabel(new Date(session.fecha_sesion))} · ${session.duracion_minutos} min · ${session.estado.charAt(0).toUpperCase()}${session.estado.slice(1)}`,
    });
  };

  if (noteSession) {
    const name = sessionName(noteSession);
    return (
      <div className="space-y-4">
        <Button variant="ghost" className="min-h-11" onClick={() => setNoteSession(null)}>← Volver a la agenda</Button>
        <div>
          <h2 className="font-heading text-xl font-bold">Nota privada · {noteSession.titulo}</h2>
          <p className="text-sm text-muted-foreground">{name} · Solo vos podés leer esta nota.</p>
        </div>
        <ProfessionalPrivateNote session={noteSession} patientName={name} />
      </div>
    );
  }

  const dayItems = itemsByDate.get(selectedDate) || [];
  const now = Date.now();
  const seriesEdit = seriesEditId ? seriesById.get(seriesEditId) : undefined;
  const headerButton = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-base font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground" aria-hidden><CalendarDays size={28} /></span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Agenda</p>
            <h2 className="font-heading text-3xl font-bold leading-tight text-[#2b2145]">Tu calendario</h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 sm:flex-row-reverse">
          <button type="button" disabled={!patients.length} onClick={() => setSessionForm(emptyForm(selectedDate, initialPatientId ? String(initialPatientId) : ""))} className={cn(headerButton, "bg-primary text-primary-foreground shadow-md")}>
            <Plus size={18} aria-hidden /> Sesión
          </button>
          <button type="button" onClick={() => setEventForm({ editing: null })} className={cn(headerButton, "bg-primary/10 text-primary hover:bg-primary/15")}>
            <Plus size={18} aria-hidden /> Evento
          </button>
        </div>
      </header>

      <section className="rounded-3xl border border-[#f0e8f8] bg-white p-3 shadow-lg sm:p-5" aria-label="Calendario mensual">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-3">
            <button type="button" onClick={() => goToMonth(-1)} aria-label="Mes anterior" className="flex h-11 w-11 items-center justify-center rounded-full text-[#8b7aa0] transition hover:bg-[#f5f0ff] hover:text-[#6b4c9a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronLeft size={22} aria-hidden /></button>
            <h3 className="min-w-[9.5rem] text-center font-body text-sm font-bold text-[#6b4c9a] sm:text-base" aria-live="polite">{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</h3>
            <button type="button" onClick={() => goToMonth(1)} aria-label="Mes siguiente" className="flex h-11 w-11 items-center justify-center rounded-full text-[#8b7aa0] transition hover:bg-[#f5f0ff] hover:text-[#6b4c9a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronRight size={22} aria-hidden /></button>
          </div>
          <button type="button" onClick={goToToday} className="min-h-11 rounded-full px-3 text-xs font-semibold text-[#8b7aa0] transition hover:bg-[#f5f0ff] hover:text-[#6b4c9a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Hoy</button>
        </div>

        <div translate="no" className="notranslate mb-2 grid grid-cols-7 gap-1 sm:gap-2">
          {WEEKDAYS.map((day) => <div key={day} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-[#8b7aa0] sm:text-xs">{day}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {Array.from({ length: monthLayout.blanks }, (_, index) => <div key={`blank-${index}`} aria-hidden />)}
          {monthLayout.days.map(({ day, key }) => {
            const items = itemsByDate.get(key) || [];
            const selected = key === selectedDate;
            const shown = items.length > MAX_CELL_ITEMS ? items.slice(0, MAX_CELL_ITEMS) : items;
            return (
              <button
                key={key}
                type="button"
                onClick={() => { setSelectedDate(key); setDayOpen(true); }}
                aria-pressed={selected}
                aria-label={`${longDate(key)}, ${items.length === 0 ? "sin sesiones ni eventos" : `${items.length} ${items.length === 1 ? "elemento" : "elementos"}`}`}
                className={cn(
                  "flex min-h-[56px] min-w-0 flex-col items-center rounded-2xl border px-0.5 py-1.5 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-[120px] sm:items-stretch sm:rounded-2xl sm:p-2 sm:text-left",
                  key === todayKey ? "border-[#6b4c9a] bg-[#6b4c9a] text-white shadow-md shadow-purple-200" : selected ? "border-[#d8c7ef] bg-[#f5f0ff] text-[#6b4c9a] shadow-sm" : items.length ? "border-[#eadcff] bg-[#EFE3FF] text-[#6b4c9a] hover:border-[#6b4c9a]/30" : "border-transparent bg-[#faf8ff] text-[#4a3a6a] hover:bg-[#f5f0ff]",
                )}
              >
                <span className="text-sm font-extrabold leading-none sm:text-base">{day}</span>
                <span className="mt-1.5 flex gap-1 sm:hidden" aria-hidden>
                  {items.slice(0, 3).map((item) => <span key={item.key} className={cn("h-1.5 w-1.5 rounded-full", key === todayKey ? "bg-white" : item.dot)} />)}
                </span>
                <span className="mt-2 hidden min-w-0 flex-col gap-1 sm:flex" aria-hidden>
                  {shown.map((item) => (
                    <span key={item.key} className="flex min-w-0 items-center gap-1.5 text-xs font-semibold">
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", key === todayKey ? "bg-white" : item.dot)} />
                      <span className="truncate">{item.label}</span>
                    </span>
                  ))}
                  {items.length > MAX_CELL_ITEMS && <span className="text-xs font-bold">+{items.length - MAX_CELL_ITEMS} más</span>}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 px-2 text-sm text-muted-foreground" aria-label="Leyenda de colores">
        {LEGEND.map((entry) => (
          <li key={entry.label} className="flex items-center gap-2"><span className={cn("h-2.5 w-2.5 rounded-full", entry.dot)} aria-hidden />{entry.label}</li>
        ))}
      </ul>

      {dayOpen && (
        <AgendaSheet large title={longDate(selectedDate)} subtitle={loading ? "Cargando…" : undefined} onClose={() => setDayOpen(false)}>
          {dayItems.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CalendarDays size={32} className="text-primary" aria-hidden />
              <p className="mt-3 text-base font-bold text-[#2b2145]">No hay sesiones ni eventos este día</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/70">
              {dayItems.map((item) =>
                item.kind === "session" ? (
                  <SessionRow
                    key={item.key}
                    session={item.session}
                    patientName={sessionName(item.session)}
                    time={item.time}
                    now={now}
                    onMenu={() => openMenu(item)}
                    onOpenNote={() => { setDayOpen(false); setNoteSession(item.session); }}
                    onPrepare={onPrepareSession && (() => { setDayOpen(false); onPrepareSession(item.session); })}
                  />
                ) : (
                  <EventRow
                    key={item.key}
                    event={item.event}
                    patientName={patientOptions.find((option) => option.id === decodePatientLink(item.event.description || "").patientId)?.name}
                    onMenu={() => openMenu(item)}
                  />
                ),
              )}
            </ul>
          )}
        </AgendaSheet>
      )}

      {menu && <AgendaItemMenu title={menu.title} subtitle={menu.subtitle} actions={menuActions(menu.item)} onClose={() => setMenu(null)} />}
      {sessionForm && (
        <SessionFormSheet form={sessionForm} setForm={(update) => setSessionForm((prev) => prev && update(prev))} patients={patients} sessions={sessions} saving={saving} onSubmit={submitSession} onClose={() => setSessionForm(null)} />
      )}
      {eventForm && (
        <EventFormSheet editing={eventForm.editing} date={selectedDate} patients={patientOptions} saving={saving} onSave={saveEvent} onClose={() => setEventForm(null)} />
      )}
      {seriesEdit && seriesEditId && (
        <SeriesEditSheet groupId={seriesEditId} sessions={seriesEdit} onClose={() => setSeriesEditId(null)} onSeriesChanged={load} />
      )}
    </div>
  );
}
