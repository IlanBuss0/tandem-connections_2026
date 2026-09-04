import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, FileText, Folder, Loader2, UserRound } from 'lucide-react';
import { fetchTutorReports, type GeneratedReport } from '@/data/api';

type ProfessionalGroup = {
  id: number;
  name: string;
  reports: GeneratedReport[];
  patients: PatientGroup[];
};

type PatientGroup = {
  id: number;
  name: string;
  reports: GeneratedReport[];
};

function reportTime(report: GeneratedReport) {
  const value = report.fecha_envio || report.fecha_generacion;
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? time : 0;
}

function reportDate(report: GeneratedReport) {
  return new Date(report.fecha_envio || report.fecha_generacion);
}

function monthKey(report: GeneratedReport) {
  const date = reportDate(report);
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}

function groupReports(reports: GeneratedReport[]): ProfessionalGroup[] {
  const professionals = new Map<number, { name: string; reports: GeneratedReport[] }>();
  reports.forEach(report => {
    const current = professionals.get(report.id_profesional) || { name: report.profesional_nombre || 'Profesional', reports: [] };
    current.reports.push(report);
    professionals.set(report.id_profesional, current);
  });

  return [...professionals.entries()].map(([id, professional]) => {
    const patients = new Map<number, PatientGroup>();
    professional.reports.forEach(report => {
      const current = patients.get(report.id_perteneciente) || { id: report.id_perteneciente, name: report.paciente_nombre || 'Perteneciente', reports: [] };
      current.reports.push(report);
      patients.set(report.id_perteneciente, current);
    });
    return {
      id,
      name: professional.name,
      reports: professional.reports.sort((a, b) => reportTime(b) - reportTime(a)),
      patients: [...patients.values()].map(patient => ({ ...patient, reports: patient.reports.sort((a, b) => reportTime(b) - reportTime(a)) })),
    };
  }).sort((a, b) => reportTime(b.reports[0]) - reportTime(a.reports[0]));
}

export default function TutorReportsPanel() {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [professionalId, setProfessionalId] = useState<number | null>(null);
  const [patientId, setPatientId] = useState<number | null>(null);

  useEffect(() => {
    fetchTutorReports().then(setReports).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => groupReports(reports), [reports]);
  const professional = groups.find(group => group.id === professionalId);
  const patient = professional?.patients.find(group => group.id === patientId);

  if (loading) return <div className="flex items-center justify-center rounded-3xl border bg-card p-10 text-muted-foreground"><Loader2 className="mr-2 animate-spin" size={18} aria-hidden />Cargando reportes...</div>;
  if (error) return <Empty title="No pudimos cargar los reportes" text="Intentá nuevamente dentro de unos minutos." />;
  if (!reports.length) return <Empty title="Todavía no recibiste reportes" text="Cuando un profesional te mande un reporte de progreso, va a aparecer acá." />;

  if (!professional) return <div className="space-y-5">
    <Header title="Reportes profesionales" subtitle="Elegí un profesional para consultar los reportes que te envió." />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{groups.map(group => <FolderButton key={group.id} icon={<Initials name={group.name} />} title={group.name} detail={`${group.patients.length} ${group.patients.length === 1 ? 'persona' : 'personas'} · ${group.reports.length} ${group.reports.length === 1 ? 'reporte' : 'reportes'}`} onClick={() => setProfessionalId(group.id)} />)}</div>
  </div>;

  if (!patient) return <div className="space-y-5">
    <BackButton onClick={() => setProfessionalId(null)}>Todos los profesionales</BackButton>
    <Header title={professional.name} subtitle="Reportes organizados por persona vinculada." icon={<Initials name={professional.name} />} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{professional.patients.map(group => <FolderButton key={group.id} icon={<span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><UserRound size={21} aria-hidden /></span>} title={group.name} detail={`${group.reports.length} ${group.reports.length === 1 ? 'reporte recibido' : 'reportes recibidos'}`} onClick={() => setPatientId(group.id)} />)}</div>
  </div>;

  const months = patient.reports.reduce((result, report) => {
    const key = monthKey(report);
    (result[key] ||= []).push(report);
    return result;
  }, {} as Record<string, GeneratedReport[]>);

  return <div className="space-y-5">
    <BackButton onClick={() => setPatientId(null)}>{professional.name}</BackButton>
    <Header title={patient.name} subtitle={`Reportes enviados por ${professional.name}, ordenados por mes y fecha.`} icon={<span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><UserRound size={23} aria-hidden /></span>} />
    <div className="space-y-4">{Object.entries(months).map(([month, monthReports], monthIndex) => <details key={month} open={monthIndex === 0} className="group overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><CalendarDays size={20} aria-hidden /></span><span className="min-w-0 flex-1"><span className="block capitalize font-bold">{month}</span><span className="block text-xs text-muted-foreground">{monthReports.length} {monthReports.length === 1 ? 'reporte' : 'reportes'}</span></span><ChevronRight className="text-muted-foreground transition-transform group-open:rotate-90" aria-hidden /></summary>
      <div className="border-t border-border/70 px-3 py-2 sm:px-5">{monthReports.map(report => <ReportItem key={report.id} report={report} />)}</div>
    </details>)}</div>
  </div>;
}

function ReportItem({ report }: { report: GeneratedReport }) {
  const date = reportDate(report);
  const dateLabel = Number.isNaN(date.getTime()) ? 'Sin fecha' : date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  return <details className="group/report border-b border-border/70 last:border-0"><summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-primary"><FileText size={19} aria-hidden /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{report.titulo || 'Reporte de seguimiento'}</span><span className="block capitalize text-xs text-muted-foreground">{dateLabel} · {report.id_tipo === 'programado' ? 'Programado' : 'Manual'}</span></span><ChevronRight size={17} className="text-muted-foreground transition-transform group-open/report:rotate-90" aria-hidden /></summary><div className="mb-3 ml-0 rounded-2xl bg-muted/35 p-4 text-sm whitespace-pre-wrap sm:ml-[52px]">{report.contenido}</div></details>;
}

function Header({ title, subtitle, icon }: { title: string; subtitle: string; icon?: React.ReactNode }) { return <header className="flex items-center gap-4">{icon}<div><h1 className="font-heading text-2xl font-bold sm:text-3xl">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p></div></header>; }
function BackButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronLeft size={18} aria-hidden />{children}</button>; }
function FolderButton({ icon, title, detail, onClick }: { icon: React.ReactNode; title: string; detail: string; onClick: () => void }) { return <button type="button" onClick={onClick} className="flex min-h-24 items-center gap-3 rounded-3xl border border-border/80 bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{icon}<span className="min-w-0 flex-1"><span className="block truncate font-bold">{title}</span><span className="mt-1 block text-xs text-muted-foreground">{detail}</span></span><Folder size={21} className="shrink-0 text-primary" aria-hidden /></button>; }
function Initials({ name }: { name: string }) { return <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary" aria-hidden>{name.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase()}</span>; }
function Empty({ title, text }: { title: string; text: string }) { return <div className="rounded-3xl border border-dashed p-10 text-center"><FileText className="mx-auto mb-3 text-primary" aria-hidden /><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{text}</p></div>; }
