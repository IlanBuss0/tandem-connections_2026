import { fetchPatternsReport, fetchVocabularyReport, type EvolutionWeek } from '@/data/usageApi';
import { labelForType, anticipationSentence } from '@/components/PatternsReportView';
import { isoWeekStart } from './evolutionHelpers';

export interface EvolutionExportSections {
  changes: boolean;
  weekly: boolean;
  vocabulary: boolean;
  patterns: boolean;
}

export interface EvolutionChangeCard {
  title: string;
  before: string;
  after: string;
  direction: 1 | 0 | -1 | null;
}

export interface EvolutionSummaryExport {
  personName: string;
  generatedAt: Date;
  changes: { phrase: string; cards: EvolutionChangeCard[] } | null;
  weekly: { rows: { week: string; steps: string; mood: string }[] } | null;
  vocabulary: { totalUtterances: number; used: { word: string; count: number }[]; neverUsed: string[] } | null;
  patterns: { lines: string[]; anticipation: string | null } | null;
  failedSections: string[];
}

const weekLabel = (week: EvolutionWeek) => {
  const date = isoWeekStart(week.week);
  return `Semana del ${date ? date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : week.week}`;
};

// Unica responsabilidad: juntar los datos ya cargados en pantalla (cambios,
// semanas) y pedir los que todavia no se pidieron (vocabulario, patrones)
// SOLO si esa sección está tildada. Si un fetch falla (fetchVocabularyReport
// / fetchPatternsReport devuelven null), esa sección va a `failedSections`
// en vez de romper el PDF entero.
export async function buildEvolutionExport(options: {
  userId: string;
  personName: string;
  sections: EvolutionExportSections;
  changes: { phrase: string; cards: EvolutionChangeCard[] };
  weeks: EvolutionWeek[];
}): Promise<EvolutionSummaryExport> {
  const { userId, personName, sections, changes, weeks } = options;
  const failedSections: string[] = [];

  const weekly = sections.weekly
    ? {
        rows: weeks.map(week => ({
          week: weekLabel(week),
          steps: String(Math.round(week.routineCompletions)),
          mood: week.positiveEmotionRatio !== null ? `${Math.round(week.positiveEmotionRatio * 100)}%` : '—',
        })),
      }
    : null;

  let vocabulary: EvolutionSummaryExport['vocabulary'] = null;
  if (sections.vocabulary) {
    const report = await fetchVocabularyReport(userId);
    if (report) vocabulary = { totalUtterances: report.totalUtterances, used: report.used, neverUsed: report.neverUsed };
    else failedSections.push('Informe de vocabulario');
  }

  let patterns: EvolutionSummaryExport['patterns'] = null;
  if (sections.patterns) {
    const report = await fetchPatternsReport(userId);
    if (report) {
      patterns = {
        lines: report.eventTypePatterns.map(p => `Cuando hay ${labelForType(p.type)}, suele registrarse una emoción difícil (${Math.round(p.negativeRatio * 100)}% de ${p.sampleSize} veces).`),
        anticipation: report.anticipationSupport
          ? `${anticipationSentence(report.anticipationSupport.helps)} Sin anticipar: ${Math.round(report.anticipationSupport.notViewedPositiveRatio * 100)}%. Con historia social: ${Math.round(report.anticipationSupport.viewedPositiveRatio * 100)}%.`
          : null,
      };
    } else failedSections.push('Patrones detectados');
  }

  return {
    personName,
    generatedAt: new Date(),
    changes: sections.changes ? changes : null,
    weekly,
    vocabulary,
    patterns,
    failedSections,
  };
}
