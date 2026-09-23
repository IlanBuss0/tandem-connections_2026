import { useState } from 'react';
import { Download, FileText, ShieldCheck } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { useIsMobile } from '@/hooks/use-mobile';
import type { EvolutionWeek } from '@/data/usageApi';
import { buildEvolutionExport, type EvolutionChangeCard, type EvolutionExportSections } from './buildEvolutionExport';

const SECTION_OPTIONS: { id: keyof EvolutionExportSections; title: string; description: string }[] = [
  { id: 'changes', title: 'Cambios del período', description: 'Autonomía, ánimo y actividad' },
  { id: 'weekly', title: 'Semana a semana', description: 'Gráficos con sus valores' },
  { id: 'vocabulary', title: 'Informe de vocabulario', description: 'Frases y palabras más usadas' },
  { id: 'patterns', title: 'Patrones detectados', description: 'Solo los que tienen confianza' },
];

const ALL_SECTIONS: EvolutionExportSections = { changes: true, weekly: true, vocabulary: true, patterns: true };

const DIACRITICS = /[̀-ͯ]/g;
const slugify = (value: string) => value.trim().toLowerCase()
  .normalize('NFD').replace(DIACRITICS, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');

export interface EvolutionShareSheetProps {
  open: boolean;
  onClose: () => void;
  personName: string;
  userId: string;
  weeks: EvolutionWeek[];
  summaryPhrase: string;
  cards: EvolutionChangeCard[];
}

export default function EvolutionShareSheet({ open, onClose, personName, userId, weeks, summaryPhrase, cards }: EvolutionShareSheetProps) {
  const isMobile = useIsMobile();
  const [sections, setSections] = useState<EvolutionExportSections>(ALL_SECTIONS);
  const [downloading, setDownloading] = useState(false);
  const [failedSections, setFailedSections] = useState<string[] | null>(null);

  const noneSelected = !Object.values(sections).some(Boolean);

  const toggle = (id: keyof EvolutionExportSections) => setSections(current => ({ ...current, [id]: !current[id] }));

  const download = async () => {
    setDownloading(true);
    setFailedSections(null);
    try {
      const { generateEvolutionSummaryPdf } = await import('@/lib/evolutionSummaryPdf');
      const data = await buildEvolutionExport({ userId, personName, sections, changes: { phrase: summaryPhrase, cards }, weeks });
      const blob = await generateEvolutionSummaryPdf(data);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `resumen-${slugify(personName)}-${new Date().toISOString().slice(0, 10)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setFailedSections(data.failedSections);
    } catch {
      setFailedSections(['No pudimos generar el PDF. Intentá nuevamente.']);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={value => { if (!value) onClose(); }}>
      <SheetContent side={isMobile ? 'bottom' : 'right'} className={`evolution-scope ${isMobile ? 'h-[100dvh] w-full overflow-y-auto rounded-none' : 'w-full overflow-y-auto sm:max-w-[480px]'}`}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--evo-soft)] text-[var(--evo-primary)]"><FileText size={18} aria-hidden /></span>
          <div className="min-w-0">
            <SheetTitle className="font-heading text-lg font-bold text-[var(--evo-text)]">Resumen para llevar a una sesión</SheetTitle>
            <SheetDescription className="mt-1 text-sm text-[var(--evo-text-secondary)]">Elegí qué incluir. Armamos un PDF con lo mismo que ves en pantalla.</SheetDescription>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {SECTION_OPTIONS.map(option => (
            <label key={option.id} className="flex items-start gap-3 rounded-2xl border border-[var(--evo-border-1)] bg-white p-3">
              <Checkbox checked={sections[option.id]} onCheckedChange={() => toggle(option.id)} className="mt-0.5" />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[var(--evo-text)]">{option.title}</span>
                <span className="block text-xs text-[var(--evo-text-secondary)]">{option.description}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-[var(--evo-info-bg)] p-3.5 text-[var(--evo-info-text)]">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden />
          <p className="text-xs leading-5"><strong className="font-bold">No incluye</strong> notas privadas de sesión ni ubicación. Tiene información personal: compartilo solo con quien acompaña a esta persona.</p>
        </div>

        {failedSections && failedSections.length > 0 && (
          <p className="mt-3 text-xs font-semibold text-[var(--evo-support-text)]">No pudimos cargar la información. Intentá nuevamente.</p>
        )}

        <div className="mt-5 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => void download()}
            disabled={noneSelected || downloading}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--evo-primary)] px-4 text-sm font-bold text-white disabled:opacity-50"
          >
            <Download size={16} aria-hidden /> {downloading ? 'Generando…' : 'Descargar PDF'}
          </button>
          <button type="button" onClick={onClose} className="min-h-11 px-4 text-sm font-bold text-[var(--evo-text)]">Cancelar</button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
