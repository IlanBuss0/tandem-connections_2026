import { useEffect, useMemo, useState } from 'react';
import PersonalEventCalendar, { type ReadOnlyDayItem } from '@/components/PersonalEventCalendar';
import { useCalendar } from '@/contexts/CalendarContext';
import {
  fetchPictograms,
  fetchProfessionalSessions,
  type Pictogram,
  type ProfessionalSession,
} from '@/data/api';
import ProfessionalAgenda, { type AgendaPatient } from '@/components/ProfessionalAgenda';
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

export default function ProfessionalCalendar({ patients, initialPatientId }: { patients: AgendaPatient[]; initialPatientId?: number }) {
  const { toast } = useToast();
  const { events, addEvent, updateEvent, deleteEvent } = useCalendar();
  const [sessions, setSessions] = useState<ProfessionalSession[]>([]);
  const [sessionPictogram, setSessionPictogram] = useState<Pictogram | null>(null);
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

  useEffect(() => {
    fetchPictograms({ search: 'terapia profesional', language: 'es', limit: 1 })
      .then((items) => setSessionPictogram(items[0] || null))
      .catch(() => setSessionPictogram(null));
  }, []);

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
        pictogramImageUrl: sessionPictogram?.imageUrl,
        pictogramName: sessionPictogram?.name,
      };
    });
  };

  return (
    <div className="space-y-6">
      <PersonalEventCalendar
      heading="Calendario profesional"
      events={events}
      onCreate={addEvent}
      onUpdate={updateEvent}
      onDelete={deleteEvent}
      patients={patientOptions}
      readOnlyItemsForDate={readOnlyItemsForDate}
      readOnlyHint="Las sesiones se gestionan debajo, dentro de este Calendario."
      loading={loading}
      />
      <section className="rounded-[24px] border border-[#ece3f8] bg-white p-4 shadow-[0_8px_24px_#f0e8f8] sm:p-5">
        <ProfessionalAgenda patients={patients} initialPatientId={initialPatientId} />
      </section>
    </div>
  );
}
