import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, ListChecks, Pencil, Plus, X } from "lucide-react";
import type { CalendarEvent, TutorHomeLinkedUser } from "@/data/api";
import { useToast } from "@/components/ui/use-toast";
import { decodePatientLink } from "@/components/PersonalEventCalendar";
import { AgendaSheet } from "@/components/agenda/AgendaSheet";
import AgendaItemMenu from "@/components/agenda/AgendaItemMenu";
import { AVATAR_TONES, Row } from "@/components/agenda/AgendaDayRow";
import EventFormSheet, { type EventPayload } from "@/components/agenda/EventFormSheet";
import { initials, localDateKey, longDate } from "@/lib/agendaFormat";
import { eventDotClass } from "@/lib/sessionStatus";
import { personDot, personDotAt, personIndex, tutorItemKind, type TutorItemKind } from "@/lib/tutorCalendarItems";
import type { TutorAggregateEvent } from "@/lib/tutorEventAggregation";
import { cn } from "@/lib/utils";

// Mismo markup que ProfessionalCalendar, solo con lo que hace el tutor (eventos, sin sesiones).
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MAX_CELL_ITEMS = 3;
const AVATAR_TONE_BY_PERSON = [1, 2, 0, 3];
const badgeClass = "rounded-full px-2.5 py-0.5 text-xs font-bold";
const ownBadge = "bg-[#3d9bd6]/10 text-[#0c5a86]";
const personBadge = "bg-violet-100 text-violet-800";

type DayItem = { key: string; time: string; label: string; dot: string; kind: TutorItemKind; event: TutorAggregateEvent };

const firstName = (owner?: TutorHomeLinkedUser) => owner?.name.split(" ")[0] ?? "";

export default function TutorCalendar({ tutorUserId, events, tutorEvents, linkedUsers, onCreate, onUpdate, onDelete }: {
  tutorUserId: string;
  /** aggregateTutorEvents(...): eventos del tutor + de cada persona + actividades pendientes. */
  events: TutorAggregateEvent[];
  /** Eventos crudos del tutor: conservan el [paciente:ID] para editar sin perder la persona. */
  tutorEvents: CalendarEvent[];
  linkedUsers: TutorHomeLinkedUser[];
  onCreate: (payload: EventPayload) => Promise<void>;
  onUpdate: (id: string, payload: EventPayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const todayKey = localDateKey(new Date());
  const [cursor, setCursor] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1); });
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [dayOpen, setDayOpen] = useState(false);
  const [menu, setMenu] = useState<DayItem | null>(null);
  const [form, setForm] = useState<{ editing: CalendarEvent | null } | null>(null);
  const [saving, setSaving] = useState(false);

  const patients = useMemo(() => linkedUsers.map((user) => ({ id: user.id, name: user.name })), [linkedUsers]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, DayItem[]>();
    events.forEach((event) => {
      const item: DayItem = {
        key: `${event.userId}-${event.id}`,
        time: event.time,
        label: `${event.time} ${event.title}`,
        dot: personDot(event.owner, linkedUsers),
        kind: tutorItemKind(event, tutorUserId, event.owner),
        event,
      };
      map.set(event.date, [...(map.get(event.date) || []), item]);
    });
    map.forEach((list) => list.sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [events, linkedUsers, tutorUserId]);

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

  const saveEvent = async (payload: EventPayload) => {
    const editing = form?.editing;
    setSaving(true);
    try {
      if (editing) await onUpdate(editing.id, payload);
      else await onCreate(payload);
      setForm(null);
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
      await onDelete(event.id);
    } catch {
      toast({ title: "No se pudo eliminar el evento", variant: "destructive" });
    }
  };

  const legend = [{ label: "Tu agenda", dot: eventDotClass }, ...linkedUsers.map((user, index) => ({ label: firstName(user), dot: personDotAt(index) }))];
  const dayItems = itemsByDate.get(selectedDate) || [];
  const headerButton = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-base font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

  return (
    <div className="professional-surface mx-auto w-full max-w-6xl space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground" aria-hidden><CalendarDays size={28} /></span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Calendario</p>
            <h2 className="font-heading text-3xl font-bold leading-tight text-[#2b2145]">Agenda de la familia</h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 sm:flex-row-reverse">
          <button type="button" onClick={() => setForm({ editing: null })} className={cn(headerButton, "bg-primary text-primary-foreground shadow-md")}>
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
                aria-label={`${longDate(key)}, ${items.length === 0 ? "sin eventos" : `${items.length} ${items.length === 1 ? "evento" : "eventos"}`}`}
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
        {legend.map((entry, index) => (
          <li key={`${entry.label}-${index}`} className="flex items-center gap-2"><span className={cn("h-2.5 w-2.5 rounded-full", entry.dot)} aria-hidden />{entry.label}</li>
        ))}
      </ul>

      {dayOpen && (
        <AgendaSheet large title={longDate(selectedDate)} onClose={() => setDayOpen(false)}>
          {dayItems.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CalendarDays size={32} className="text-primary" aria-hidden />
              <p className="mt-3 text-base font-bold text-[#2b2145]">No hay eventos este día</p>
              <button type="button" onClick={() => { setDayOpen(false); setForm({ editing: null }); }} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary/10 px-4 text-sm font-extrabold text-primary hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Plus size={16} aria-hidden /> Agregar evento
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-border/70">
              {dayItems.map((item) => <TutorEventRow key={item.key} item={item} linkedUsers={linkedUsers} onMenu={item.kind === "mine" || item.kind === "forPerson" ? () => setMenu(item) : undefined} />)}
            </ul>
          )}
        </AgendaSheet>
      )}

      {menu && (
        <AgendaItemMenu
          title={menu.event.title}
          subtitle={`${longDate(menu.event.date)} · ${menu.kind === "forPerson" ? `Para ${firstName(menu.event.owner)}` : "Tu agenda"}`}
          onClose={() => setMenu(null)}
          actions={[
            { label: "Editar evento", icon: <Pencil size={22} />, onClick: () => setForm({ editing: tutorEvents.find((raw) => raw.id === menu.event.id) ?? menu.event }) },
            { label: "Eliminar evento", icon: <X size={22} />, danger: true, onClick: () => removeEvent(menu.event) },
          ]}
        />
      )}
      {form && (
        <EventFormSheet editing={form.editing} date={selectedDate} patients={patients} personLabel="¿Para quién es?" noPersonLabel="Para mí" saving={saving} onSave={saveEvent} onClose={() => setForm(null)} />
      )}
    </div>
  );
}

/** Fila de `AgendaDayRow` con badge según de quién es el evento. Los de la persona son solo lectura (sin ⋯). */
function TutorEventRow({ item, linkedUsers, onMenu }: { item: DayItem; linkedUsers: TutorHomeLinkedUser[]; onMenu?: () => void }) {
  const { event, kind } = item;
  const name = firstName(event.owner);
  const description = decodePatientLink(event.description || "").cleanDescription;
  const badge = {
    mine: <span className={cn(badgeClass, ownBadge)}>Tu agenda</span>,
    forPerson: <span className={cn(badgeClass, ownBadge)}>Para {name}</span>,
    personAgenda: <span className={cn(badgeClass, personBadge)}>Agenda de {name}</span>,
    personActivity: <span className={cn(badgeClass, personBadge)}>Actividad de {name}</span>,
  }[kind];
  const tone = AVATAR_TONES[AVATAR_TONE_BY_PERSON[Math.max(0, personIndex(event.owner, linkedUsers)) % 4]];
  const avatar = event.owner
    ? <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold", tone)} aria-hidden>{initials(event.owner.name)}</span>
    : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e0f2fb] text-[#0c5a86]" aria-hidden><CalendarDays size={20} /></span>;
  const note = onMenu ? undefined : (
    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#8b7aa0]">
      <ListChecks size={14} aria-hidden /> {kind === "personActivity" ? `Actividad pendiente de ${name}` : `Está en la agenda de ${name}`} · solo para ver
    </p>
  );
  return (
    <Row
      time={event.time}
      dotClass={item.dot}
      avatar={avatar}
      title={event.title}
      badges={badge}
      detail={[kind === "personActivity" ? "Actividad asignada" : event.type, description].filter(Boolean).join(" · ")}
      note={note}
      onMenu={onMenu}
      menuLabel={`Más acciones del evento ${event.title}`}
    />
  );
}
