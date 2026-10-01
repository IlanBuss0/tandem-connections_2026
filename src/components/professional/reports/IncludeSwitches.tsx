import { SheetLabel } from "@/components/agenda/AgendaSheet";
import { Switch } from "@/components/ui/switch";
import type { ReportPdfSection } from "@/data/api";

export const PDF_SECTIONS: Record<ReportPdfSection, { title: string; short: string; text: string }> = {
  ia: { short: "resumen IA", title: "Resumen escrito por la IA", text: "Un texto corto sobre cómo fue el período" },
  asistencia: { short: "asistencia", title: "Asistencia por paciente", text: "Sesiones hechas, canceladas y ausentes, y el % de asistencia" },
  detalle: { short: "detalle de sesiones", title: "Detalle de sesiones", text: "Lista de fechas y estado de cada sesión" },
};

/** Interruptores de «Qué incluir». */
export default function IncludeSwitches({ sections, value, onChange }: { sections: ReportPdfSection[]; value: ReportPdfSection[]; onChange: (value: ReportPdfSection[]) => void }) {
  const toggle = (section: ReportPdfSection, on: boolean) => onChange(sections.filter((entry) => (entry === section ? on : value.includes(entry))));
  return (
    <div>
      <SheetLabel>Qué incluir</SheetLabel>
      <ul className="divide-y divide-border/60 border-y border-border/60">
        {sections.map((section) => (
          <li key={section}>
            <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 py-2.5">
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[#2b2145]">{PDF_SECTIONS[section].title}</span>
                <span className="block text-xs text-muted-foreground">{PDF_SECTIONS[section].text}</span>
              </span>
              <Switch checked={value.includes(section)} onCheckedChange={(on) => toggle(section, on)} />
            </label>
          </li>
        ))}
      </ul>
      {value.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Prendé al menos una sección.</p>}
    </div>
  );
}
