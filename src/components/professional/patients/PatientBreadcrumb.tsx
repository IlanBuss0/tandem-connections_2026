import { ChevronRight } from 'lucide-react';

/** Ruta y botón "Volver" en desktop (≥1024), mismo patrón que TutorBreadcrumb. En mobile vuelve la flecha del header. */
export default function PatientBreadcrumb({ patientName, onBack }: { patientName?: string; onBack: () => void }) {
  return <nav aria-label="Ruta de navegación" className="mb-5 hidden min-h-11 items-center gap-2 text-sm lg:flex">
    <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-2 font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronRight size={17} className="rotate-180" aria-hidden />Volver</button>
    <span className="text-muted-foreground">TÁNDEM</span><ChevronRight size={15} className="text-muted-foreground" aria-hidden />
    <span className="text-muted-foreground">Pacientes</span><ChevronRight size={15} className="text-muted-foreground" aria-hidden />
    <span className="font-semibold text-foreground" aria-current="page">{patientName || 'Paciente'}</span>
  </nav>;
}
