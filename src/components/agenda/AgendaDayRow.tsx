import type { ReactNode } from "react";
import { CalendarDays, FileText, MoreHorizontal, Pencil, Sparkles } from "lucide-react";
import { eventDotClass, sessionStatusBadgeClass, sessionStatusDotClass } from "@/lib/sessionStatus";
import { recurrenceLabels } from "@/lib/sessionRecurrence";
import { initials } from "@/lib/agendaFormat";
import { decodePatientLink } from "@/components/PersonalEventCalendar";
import type { CalendarEvent, ProfessionalSession } from "@/data/api";
import { cn } from "@/lib/utils";

export const AVATAR_TONES = ["bg-amber-100 text-amber-800", "bg-violet-100 text-violet-800", "bg-emerald-100 text-emerald-800", "bg-[#e0f2fb] text-[#0c5a86]"];

const badgeClass = "rounded-full px-2.5 py-0.5 text-xs font-bold";

function minutesUntil(session: ProfessionalSession, now: number) {
  return Math.round((new Date(session.fecha_sesion).getTime() - now) / 60000);
}

/** "En 25 min" / "En 2 h" para sesiones programadas de hoy que todavía no empezaron. */
function untilLabel(session: ProfessionalSession, now: number) {
  const minutes = minutesUntil(session, now);
  if (session.estado !== "programada" || minutes <= 0 || minutes >= 24 * 60) return undefined;
  return minutes < 60 ? `En ${minutes} min` : `En ${Math.round(minutes / 60)} h`;
}

function Row({ time, dotClass, avatar, title, badges, detail, action, onMenu, menuLabel }: {
  time: string; dotClass: string; avatar: ReactNode; title: string; badges: ReactNode; detail: string;
  action?: ReactNode; onMenu: () => void; menuLabel: string;
}) {
  return (
    <li className="flex gap-3 py-4">
      <div className="flex w-14 shrink-0 flex-col items-start gap-1 pt-1">
        <span className="text-sm font-extrabold text-[#2b2145]">{time}</span>
        <span className={cn("h-2.5 w-2.5 rounded-full", dotClass)} aria-hidden />
      </div>
      {avatar}
      <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-lg font-extrabold leading-tight text-[#2b2145] [overflow-wrap:anywhere]">{title}</p>
            {badges}
          </div>
          <p className="mt-1 text-sm text-muted-foreground [overflow-wrap:anywhere]">{detail}</p>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2 sm:mt-0">
          {action}
          <button
            type="button"
            onClick={onMenu}
            aria-label={menuLabel}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MoreHorizontal size={20} aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}

const actionClass = (primary: boolean) => cn(
  "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none",
  primary ? "bg-primary text-primary-foreground shadow-md hover:opacity-95" : "bg-primary/10 text-primary hover:bg-primary/15",
);

export function SessionRow({ session, patientName, time, now, onMenu, onOpenNote, onPrepare }: {
  session: ProfessionalSession; patientName: string; time: string; now: number;
  onMenu: () => void; onOpenNote: () => void; onPrepare?: () => void;
}) {
  const until = untilLabel(session, now);
  const inSeries = Boolean(session.recurrence_group_id);
  const frequency = session.recurrence_rule?.frequency || "none";
  const detail = [
    session.estado === "completada" ? "Terminó" : until,
    `${session.duracion_minutos} min`,
    inSeries && `${recurrenceLabels[frequency].toLowerCase()} · #${Number(session.recurrence_index || 0) + 1}`,
    session.estado === "cancelada" && session.motivo_cancelacion && `Motivo: ${session.motivo_cancelacion}`,
  ].filter(Boolean).join(" · ");
  const missingNote = session.estado === "completada" && !session.has_note;

  let action: ReactNode;
  if (session.estado === "completada") {
    action = (
      <button type="button" onClick={onOpenNote} className={actionClass(false)}>
        {missingNote ? <Pencil size={16} aria-hidden /> : <FileText size={16} aria-hidden />}
        {missingNote ? "Escribir nota" : "Ver nota"}
      </button>
    );
  } else if (session.estado === "programada" && onPrepare) {
    action = (
      <button type="button" onClick={onPrepare} className={actionClass(until !== undefined)}>
        <Sparkles size={16} aria-hidden /> Preparar sesión
      </button>
    );
  }

  return (
    <Row
      time={time}
      dotClass={sessionStatusDotClass(session)}
      avatar={<span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold", AVATAR_TONES[session.id_perteneciente % AVATAR_TONES.length])} aria-hidden>{initials(patientName)}</span>}
      title={patientName}
      badges={<>
        <span className={cn(badgeClass, "capitalize", sessionStatusBadgeClass(session.estado))}>{session.estado}</span>
        {missingNote && <span className={cn(badgeClass, "bg-amber-500/10 text-amber-700")}>Sin nota</span>}
        {inSeries && <span className={cn(badgeClass, "bg-[#3d9bd6]/10 text-[#0c5a86]")}>Serie</span>}
      </>}
      detail={detail}
      action={action}
      onMenu={onMenu}
      menuLabel={`Más acciones de la sesión de ${patientName} a las ${time}`}
    />
  );
}

export function EventRow({ event, patientName, onMenu }: { event: CalendarEvent; patientName?: string; onMenu: () => void }) {
  const description = decodePatientLink(event.description || "").cleanDescription;
  const detail = [event.type, patientName, description].filter(Boolean).join(" · ");
  return (
    <Row
      time={event.time}
      dotClass={eventDotClass}
      avatar={<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e0f2fb] text-[#0c5a86]" aria-hidden><CalendarDays size={20} /></span>}
      title={event.title}
      badges={<span className={cn(badgeClass, "bg-[#3d9bd6]/10 text-[#0c5a86]")}>Evento personal</span>}
      detail={detail}
      onMenu={onMenu}
      menuLabel={`Más acciones del evento ${event.title}`}
    />
  );
}
