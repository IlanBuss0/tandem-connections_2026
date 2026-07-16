import { useEffect, useMemo, useState } from 'react';
import PersonalEventCalendar, { type ReadOnlyDayItem } from '@/components/PersonalEventCalendar';
import { useCalendar } from '@/contexts/CalendarContext';
import {
  fetchProfessionalSessions,
  type ProfessionalSession,
} from '@/data/api';
import type { AgendaPatient } from '@/components/ProfessionalAgenda';
import { useToast } from '@/components/ui/use-toast';
import { sessionStatusBadgeClass } from '@/lib/sessionStatus';

function fmt(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sessionDateKey(session: ProfessionalSession) {
  return fmt(new Date(session.fecha_sesion));
}

export default function ProfessionalCalendar({ patients, onOpenAgenda }: { patients: AgendaPatient[]; onOpenAgenda?: () => void }) {
  const { toast } = useToast();
  const { events, addEvent, updateEvent, deleteEvent } = useCalendar();
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

  const patientOptions = useMemo(
    () => patients.map(patient => ({ id: String(patient.pertenecienteId), name: patient.name })),
    [patients],
  );

  const readOnlyItemsForDate = (dateKey: string): ReadOnlyDayItem[] => {
    return (sessionsByDate[dateKey] || []).map(session => {
      const patient = patientById.get(Number(session.id_perteneciente));
      const time = new Date(session.fecha_sesion).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      return {
        id: `session-${session.id}`,
        title: `${time} · ${session.titulo}`,
        subtitle: `${patient?.name || 'Paciente'} · ${session.duracion_minutos} min`,
        time,
        badgeLabel: session.estado,
        badgeClassName: sessionStatusBadgeClass(session.estado),
      };
    });
  };

  return (
    <PersonalEventCalendar
      heading="Calendario profesional"
      events={events}
      onCreate={addEvent}
      onUpdate={updateEvent}
      onDelete={deleteEvent}
      patients={patientOptions}
      readOnlyItemsForDate={readOnlyItemsForDate}
      readOnlyHint="Las sesiones se gestionan desde Agenda."
      loading={loading}
      headerAction={onOpenAgenda ? { label: 'Ir a agenda', onClick: onOpenAgenda } : undefined}
    />
  );
}
