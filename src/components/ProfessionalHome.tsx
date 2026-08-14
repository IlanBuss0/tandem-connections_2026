import { CalendarDays, ChevronRight, FileText, Users } from 'lucide-react';
import type { ProfessionalSession, User } from '@/data/api';

type HomeTab = 'patients' | 'calendar' | 'documents';
type Props = {
  professionalName: string;
  patients: User[];
  sessions: ProfessionalSession[];
  patientPertenecienteIds: Record<string, number>;
  onNavigate: (tab: HomeTab) => void;
  onOpenPatient: (userId: string) => void;
};

function avatar(user?: User, size = 'h-9 w-9') {
  if (!user) return <span className={`${size} rounded-full bg-muted`} aria-hidden />;
  const value = user.avatar?.trim();
  const image = value && (/^(https?:|data:image\/|\/)/.test(value) || /\.(png|jpe?g|webp|svg)$/i.test(value));
  return <span className={`inline-flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary`} aria-hidden>{image ? <img src={value} alt="" loading="lazy" className="h-full w-full object-cover" /> : value || user.name.slice(0, 1)}</span>;
}

function parseTime(value?: string) {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? time : 0;
}

export default function ProfessionalHome(props: Props) {
  const patientsByPerteneciente = new Map(Object.entries(props.patientPertenecienteIds).map(([userId, id]) => [id, props.patients.find(patient => patient.id === userId)]));
  const upcoming = props.sessions
    .filter(session => session.estado === 'programada' && parseTime(session.fecha_sesion) >= Date.now() - 3_600_000)
    .sort((a, b) => a.fecha_sesion.localeCompare(b.fecha_sesion));
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = upcoming.filter(session => session.fecha_sesion.slice(0, 10) === today).length;
  const firstName = props.professionalName.replace(/^Lic\.?\s*/i, '').split(' ')[0];

  return <div className="space-y-8">
    <section className="rounded-[24px] border border-[#e8dcf8] bg-gradient-to-br from-[#f9f4ff] via-[#f4ebff] to-[#eef8fb] px-5 py-7 text-center shadow-[0_10px_30px_#eadff6] sm:px-8 sm:py-9">
      <h1 className="font-heading text-3xl font-black tracking-[-0.02em] text-[#2e2344] sm:text-4xl">Hola, Lic. {firstName}</h1>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#675a78] sm:text-base">Lo importante de tu práctica, a mano para empezar el día.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <QuickAction icon={Users} label="Pacientes" onClick={() => props.onNavigate('patients')} />
        <QuickAction icon={CalendarDays} label="Calendario" primary onClick={() => props.onNavigate('calendar')} />
        <QuickAction icon={FileText} label="Documentos" onClick={() => props.onNavigate('documents')} />
      </div>
    </section>

    <div className="grid items-start gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <Panel title="Próximas sesiones" icon={CalendarDays} action="Ver calendario" onAction={() => props.onNavigate('calendar')}>
        <p className="mb-3 text-sm text-muted-foreground">{todayCount ? `${todayCount} ${todayCount === 1 ? 'sesión programada para hoy' : 'sesiones programadas para hoy'}` : 'No hay sesiones programadas para hoy.'}</p>
        <div className="divide-y divide-[#f1e8fb]">{upcoming.slice(0, 4).map(session => <button key={session.id} type="button" onClick={() => props.onNavigate('calendar')} className="grid min-h-16 w-full grid-cols-[58px_1fr_auto] items-center gap-3 py-2 text-left transition hover:bg-[#fcf9ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f4ca6]"><span className="text-xs font-bold text-[#6f4ca6]">{new Date(session.fecha_sesion).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#3f3153]">{session.titulo}</span><span className="block truncate text-xs text-[#756a82]">{patientsByPerteneciente.get(Number(session.id_perteneciente))?.name || 'Paciente'} · {session.duracion_minutos} min</span></span><ChevronRight size={18} className="text-[#7b5fa6]" aria-hidden /></button>)}{!upcoming.length && <Empty text="Todavía no hay próximas sesiones." />}</div>
      </Panel>

      <Panel title="Pacientes" icon={Users} action="Ver pacientes" onAction={() => props.onNavigate('patients')}>
        <div className="space-y-1">{props.patients.slice(0, 5).map(patient => <button key={patient.id} type="button" onClick={() => props.onOpenPatient(patient.id)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-2 text-left transition hover:bg-[#fcf9ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f4ca6]"><span>{avatar(patient)}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#3f3153]">{patient.name}</span><span className="block truncate text-xs text-[#756a82]">Ver seguimiento</span></span><ChevronRight size={18} className="text-[#7b5fa6]" aria-hidden /></button>)}{!props.patients.length && <Empty text="Todavía no hay pacientes vinculados." />}</div>
      </Panel>
    </div>
  </div>;
}

function QuickAction({ icon: Icon, label, primary = false, onClick }: { icon: typeof Users; label: string; primary?: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f4ca6] focus-visible:ring-offset-2 ${primary ? 'bg-[#6f4ca6] text-white' : 'bg-white text-[#5c3f7f]'}`}><Icon size={16} aria-hidden />{label}</button>;
}

function Panel({ title, icon: Icon, action, onAction, children }: { title: string; icon: typeof Users; action: string; onAction: () => void; children: React.ReactNode }) {
  return <section className="rounded-[24px] border border-[#ece3f8] bg-white p-4 shadow-[0_8px_24px_#f0e8f8] sm:p-5"><header className="mb-4 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f1e8ff] text-[#6f4ca6]"><Icon size={20} aria-hidden /></span><h2 className="min-w-0 flex-1 text-lg font-bold text-[#2e2344]">{title}</h2><button type="button" onClick={onAction} className="min-h-10 rounded-xl px-2 text-sm font-semibold text-[#6f4ca6] transition hover:bg-[#f8f2ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f4ca6]">{action}</button></header>{children}</section>;
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-[#e8dcf8] bg-[#fcf9ff] p-3 text-sm text-[#756a82]">{text}</p>;
}
