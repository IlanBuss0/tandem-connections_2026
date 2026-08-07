import { CalendarDays, FolderOpen, Users } from 'lucide-react';

type ProfessionalHomeProps = {
  professionalName: string;
  patientCount: number;
  onNavigate: (tab: 'patients' | 'calendar' | 'documents') => void;
};

const shortcuts = [
  { id: 'patients' as const, label: 'Pacientes', description: 'Consultá perfiles, evolución y registros.', icon: Users },
  { id: 'calendar' as const, label: 'Calendario', description: 'Gestioná sesiones, turnos y eventos.', icon: CalendarDays },
  { id: 'documents' as const, label: 'Documentos', description: 'Accedé a notas y archivos profesionales.', icon: FolderOpen },
];

export default function ProfessionalHome({ professionalName, patientCount, onNavigate }: ProfessionalHomeProps) {
  return (
    <div className="space-y-8">
      <section className="rounded-[24px] border border-[#e8dcf8] bg-gradient-to-br from-[#f9f4ff] via-[#f4ebff] to-[#eef8fb] px-5 py-8 shadow-[0_10px_30px_#eadff6] sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7b5fa6]">Inicio profesional</p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-[#2e2344] sm:text-4xl">Hola, {professionalName.split(' ')[0]}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#675a78] sm:text-base">Tus pacientes y herramientas de trabajo, organizados para que encuentres rápido lo que necesitás.</p>
        <span className="mt-5 inline-flex rounded-full border border-[#dbcdf5] bg-white px-3 py-1.5 text-sm font-semibold text-[#6f4ca6] shadow-sm">{patientCount} paciente{patientCount === 1 ? '' : 's'} vinculado{patientCount === 1 ? '' : 's'}</span>
      </section>

      <section>
        <h2 className="font-heading text-xl font-bold text-[#2e2344]">Accesos principales</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {shortcuts.map((shortcut) => (
            <button key={shortcut.id} type="button" onClick={() => onNavigate(shortcut.id)} className="group rounded-[24px] border border-[#ece3f8] bg-white p-5 text-left shadow-[0_8px_24px_#f0e8f8] transition hover:-translate-y-0.5 hover:border-[#d8c7ef]">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f0ff] text-[#6f4ca6]"><shortcut.icon size={23} /></span>
              <h3 className="mt-4 font-heading text-lg font-bold text-[#2e2344]">{shortcut.label}</h3>
              <p className="mt-1 text-sm leading-5 text-[#756a82]">{shortcut.description}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-[#6f4ca6]">Abrir</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
