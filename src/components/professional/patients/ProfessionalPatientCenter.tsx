import { useCallback, useEffect, useMemo, useState } from 'react';
import ProfessionalNextSessionCard from './ProfessionalNextSessionCard';
import PermissionNote from './PermissionNote';
import { unfinishedAgreements } from '@/components/professional/home/homeData';
import PertenecienteDetail, { type DetailTab } from '@/components/perteneciente/PertenecienteDetail';
import ProfessionalPatientSessions, { type PatientSessionsIntent } from './ProfessionalPatientSessions';
import {
  askSharedSupportQuestion, createSharedSupportAgreement, createSharedSupportNote, createSharedSupportObjective,
  deleteSharedSupportNote, fetchAcompanamiento, fetchCalendarEventsForUser, fetchProfessionalReports, fetchSupportNetwork,
  updateSharedSupportAgreement, updateSharedSupportObjective,
  type AcompanamientoData, type Activity, type CalendarEvent, type EmotionalRecord, type GeneratedReport, type ProfessionalSession,
  type SupportNetworkMember, type User,
} from '@/data/api';
import type { PatientLink } from '@/lib/professionalPatientsModel';

type Props = {
  patient: User;
  link: PatientLink;
  currentUserId: string | number;
  activities: Activity[];
  emotions: EmotionalRecord[];
  /** Todas las sesiones del profesional; acá se filtran las de este paciente. */
  sessions: ProfessionalSession[];
  /** Con qué pestaña y atajo se abre (atajos de la Home). */
  initialTab?: DetailTab;
  sessionsIntent?: PatientSessionsIntent | null;
  onSchedule: () => void;
  onCreateActivity?: () => void;
  /** Lleva a la carpeta de este paciente en Reportes. */
  onOpenReports?: () => void;
  onSessionsChanged: () => void;
};

/**
 * Centro del paciente para el Profesional: mismo componente que ve el Tutor, cargado con los mismos
 * endpoints compartidos. Sin permiso de historial no se pide acompañamiento, red de apoyo, reportes ni eventos.
 * Un fallo o un 403 es "sin dato": nunca rompe la pantalla.
 */
export default function ProfessionalPatientCenter({
  patient, link, currentUserId, activities, emotions, sessions, initialTab, sessionsIntent,
  onSchedule, onCreateActivity, onOpenReports, onSessionsChanged,
}: Props) {
  const { pertenecienteId, canViewHistory, canSchedule, canAssignActivities } = link;
  // Entrar a Sesiones con un atajo remonta el Centro (key) para abrir esa pestaña; el atajo se consume una vez.
  const [entry, setEntry] = useState({ tab: initialTab, intent: sessionsIntent ?? undefined, key: 0 });
  const openSessions = (intent: PatientSessionsIntent) => setEntry(current => ({ tab: 'sessions', intent, key: current.key + 1 }));
  const [supportData, setSupportData] = useState<AcompanamientoData | undefined>();
  const [supportNetwork, setSupportNetwork] = useState<SupportNetworkMember[]>([]);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const reloadSupport = useCallback(async () => {
    setSupportData(await fetchAcompanamiento(pertenecienteId));
  }, [pertenecienteId]);

  const reloadReports = useCallback(async () => setReports(await fetchProfessionalReports(pertenecienteId)), [pertenecienteId]);

  useEffect(() => {
    setSupportData(undefined); setSupportNetwork([]); setReports([]); setEvents([]);
    if (!canViewHistory) return undefined;
    let cancelled = false;
    const keep = <T,>(setter: (value: T) => void) => (value: T) => { if (!cancelled) setter(value); };
    reloadSupport().catch(() => undefined);
    fetchSupportNetwork(pertenecienteId).then(keep(setSupportNetwork)).catch(() => undefined);
    fetchProfessionalReports(pertenecienteId).then(keep(setReports)).catch(() => undefined);
    fetchCalendarEventsForUser(patient.id).then(keep(setEvents)).catch(() => undefined);
    return () => { cancelled = true; };
  }, [canViewHistory, pertenecienteId, patient.id, reloadSupport]);

  const patientSessions = useMemo(() => sessions.filter(session => Number(session.id_perteneciente) === pertenecienteId), [sessions, pertenecienteId]);
  const refresh = (action: Promise<unknown>) => action.then(reloadSupport);

  return <PertenecienteDetail
    key={entry.key}
    role="professional"
    person={{ ...patient, autonomy: (patient as User & { autonomy?: string }).autonomy }}
    currentUserId={currentUserId}
    activities={activities}
    emotions={emotions}
    events={events}
    sessions={patientSessions}
    supportData={supportData}
    supportNetwork={supportNetwork}
    reports={reports}
    canViewHistory={canViewHistory}
    canManageSessions={canSchedule}
    initialTab={entry.tab}
    summaryTop={<div className="space-y-3">
      <ProfessionalNextSessionCard
        sessions={patientSessions}
        userId={patient.id}
        canViewHistory={canViewHistory}
        canSchedule={canSchedule}
        openAgreements={unfinishedAgreements(supportData)}
        onPrepare={session => openSessions({ prepare: session })}
        onOpenNote={session => openSessions({ note: session })}
        onSchedule={onSchedule}
      />
      <PermissionNote canViewHistory={canViewHistory} canSchedule={canSchedule} canAssignActivities={canAssignActivities} />
    </div>}
    onScheduleSession={onSchedule}
    onViewReports={canViewHistory ? onOpenReports ?? (() => openSessions({ reports: true })) : undefined}
    onCreateActivity={onCreateActivity}
    onCreateSharedNote={content => refresh(createSharedSupportNote(pertenecienteId, content))}
    onDeleteSharedNote={id => refresh(deleteSharedSupportNote(pertenecienteId, id))}
    onCreateObjective={input => refresh(createSharedSupportObjective(pertenecienteId, input))}
    onUpdateObjective={(id, input) => refresh(updateSharedSupportObjective(pertenecienteId, id, input))}
    onCreateAgreement={text => refresh(createSharedSupportAgreement(pertenecienteId, text))}
    onToggleAgreement={(id, completado) => refresh(updateSharedSupportAgreement(pertenecienteId, id, { completado }))}
    onAskAI={async question => (await askSharedSupportQuestion(pertenecienteId, question)).respuesta}
    sessionsSlot={<ProfessionalPatientSessions
      patientName={patient.name}
      pertenecienteId={pertenecienteId}
      sessions={patientSessions}
      canSchedule={canSchedule}
      reports={reports}
      canViewHistory={canViewHistory}
      reportPatient={{ ...patient, pertenecienteId }}
      onReportsChanged={reloadReports}
      onOpenReports={onOpenReports}
      onSchedule={onSchedule}
      onSessionsChanged={onSessionsChanged}
      intent={entry.intent}
      onIntentHandled={() => setEntry(current => ({ ...current, intent: undefined }))}
    />}
  />;
}
