import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { AgendaSheet, SheetChip, SheetLabel, sheetInputClass } from "@/components/agenda/AgendaSheet";
import type { AgendaPatient } from "@/components/agenda/SessionFormSheet";
import { Checkbox } from "@/components/ui/checkbox";
import { initials } from "@/lib/agendaFormat";

const MAX_CHIPS = 4;
const plain = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Lista completa con buscador, para elegir varios pacientes. */
function PatientMultiSheet({ patients, selected, onToggle, onClose }: { patients: AgendaPatient[]; selected: number[]; onToggle: (id: number) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const matches = patients.filter((patient) => plain(patient.name).includes(plain(query.trim())));
  return (
    <AgendaSheet
      title="Elegir pacientes"
      onClose={onClose}
      small
      footer={
        <button type="button" onClick={onClose} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-base font-bold text-primary-foreground shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Check size={18} aria-hidden /> Listo
        </button>
      }
    >
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary" aria-hidden />
        <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre" aria-label="Buscar paciente por nombre" className={`${sheetInputClass} pl-11`} />
      </div>
      <ul className="divide-y divide-border/60">
        {matches.map((patient) => (
          <li key={patient.pertenecienteId}>
            <label className="flex min-h-12 cursor-pointer items-center gap-3 py-2 text-base font-bold text-[#2b2145]">
              <Checkbox checked={selected.includes(patient.pertenecienteId)} onCheckedChange={() => onToggle(patient.pertenecienteId)} className="h-6 w-6 rounded-lg" />
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-extrabold text-primary" aria-hidden>{initials(patient.name)}</span>
              {patient.name}
            </label>
          </li>
        ))}
        {matches.length === 0 && <li className="py-4 text-sm text-muted-foreground">No hay pacientes con ese nombre.</li>}
      </ul>
    </AgendaSheet>
  );
}

/** «Todos / Elegir»; con «Elegir», chips de selección múltiple (4 + «Ver más»). */
export default function PatientMultiChips({ patients, selected, onChange }: { patients: AgendaPatient[]; selected: number[] | null; onChange: (selected: number[] | null) => void }) {
  const [listOpen, setListOpen] = useState(false);
  const chosen = selected ?? [];
  const toggle = (id: number) => onChange(chosen.includes(id) ? chosen.filter((entry) => entry !== id) : [...chosen, id]);
  const visible = useMemo(() => {
    if (patients.length <= MAX_CHIPS) return patients;
    const firstFour = patients.slice(0, MAX_CHIPS);
    return [...firstFour, ...patients.slice(MAX_CHIPS).filter((patient) => chosen.includes(patient.pertenecienteId))];
  }, [patients, chosen]);

  return (
    <div>
      <SheetLabel>Pacientes</SheetLabel>
      <div className="flex flex-wrap gap-2">
        <SheetChip selected={selected === null} onClick={() => onChange(null)}>Todos</SheetChip>
        <SheetChip selected={selected !== null} onClick={() => selected === null && onChange([])}>Elegir</SheetChip>
      </div>
      {selected !== null && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            {visible.map((patient) => <SheetChip key={patient.pertenecienteId} selected={chosen.includes(patient.pertenecienteId)} onClick={() => toggle(patient.pertenecienteId)}>{patient.name}</SheetChip>)}
            {patients.length > MAX_CHIPS && <SheetChip selected={false} onClick={() => setListOpen(true)}>Ver más</SheetChip>}
          </div>
          {chosen.length === 0 && <p className="text-sm text-muted-foreground">Elegí al menos un paciente.</p>}
        </div>
      )}
      {listOpen && <PatientMultiSheet patients={patients} selected={chosen} onToggle={toggle} onClose={() => setListOpen(false)} />}
    </div>
  );
}
