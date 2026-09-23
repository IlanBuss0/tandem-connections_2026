import { useState } from 'react';
import { LineChart as LineChartIcon } from 'lucide-react';
import type { EvolutionWeek } from '@/data/usageApi';
import { describeChange, isoWeekStart } from './evolutionHelpers';
import ChartDataTable from './charts/ChartDataTable';

export default function WeeklyLineChart({ id, title, weeks, valueOf, formatValue, unit, lineColor = 'var(--evo-primary)' }: {
  id: string; title: string; weeks: EvolutionWeek[];
  valueOf: (week: EvolutionWeek) => number | null;
  formatValue: (value: number) => string;
  unit: 'steps' | 'mood';
  lineColor?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const points = weeks.map(week => ({ key: week.week, value: valueOf(week), date: isoWeekStart(week.week) }));
  const values = points.map(point => point.value).filter((value): value is number => value !== null);
  const lastIndex = points.length - 1;
  const tableId = `${id}-table`;

  const dateLabel = (date: Date | null, key: string) => date ? date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : key;
  const rows = points.map(point => ({ label: `Semana del ${dateLabel(point.date, point.key)}`, value: point.value === null ? '—' : formatValue(point.value) }));

  if (!values.length) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--evo-border-2)] bg-white p-6 text-center">
        <LineChartIcon size={28} className="text-[var(--evo-primary)]" aria-hidden />
        <p className="mt-3 text-sm font-bold text-[var(--evo-text)]">Todavía no hay datos suficientes para este gráfico.</p>
        <p className="mt-1 text-sm text-[var(--evo-text-secondary)]">Cuando haya más de una semana de registros, lo vas a ver acá.</p>
      </div>
    );
  }

  const max = Math.max(1, ...values);
  const xFor = (index: number) => (lastIndex > 0 ? (index / lastIndex) * 100 : 50);
  const yFor = (value: number) => 88 - (value / max) * 68;

  const segments: string[] = [];
  let open = false;
  points.forEach((point, index) => {
    if (point.value === null) { open = false; return; }
    const command = `${xFor(index)} ${yFor(point.value)}`;
    if (!open) { segments.push(`M ${command}`); open = true; } else segments[segments.length - 1] += ` L ${command}`;
  });
  const areaSegments = segments.map(segment => `${segment} L 100 100 L 0 100 Z`);
  const lastPoint = points[lastIndex];
  const first = values[0];
  const last = values[values.length - 1];
  const phrase = describeChange(unit, first, last, weeks.length);
  const ariaLabel = `${title}. ${rows.map(row => `${row.label}: ${row.value}`).join('. ')}.`;

  return (
    <div className="rounded-2xl border border-[var(--evo-border-1)] bg-white p-4 lg:flex lg:items-start lg:gap-5">
      <div className="min-w-0 lg:flex-1">
        <p className="text-sm font-bold text-[var(--evo-text)]">{title}</p>
        <div className="relative mt-5 h-28" role="img" aria-label={ariaLabel}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
            <line x1="0" y1="16" x2="100" y2="16" stroke="var(--evo-border-4)" strokeWidth="1" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
            <line x1="0" y1="52" x2="100" y2="52" stroke="var(--evo-border-4)" strokeWidth="1" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
            <line x1="0" y1="88" x2="100" y2="88" stroke="var(--evo-border-2)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            {areaSegments.map((d, index) => <path key={`area-${index}`} d={d} fill={lineColor} opacity="0.09" stroke="none" />)}
            {segments.map((d, index) => <path key={index} d={d} fill="none" stroke={lineColor} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />)}
          </svg>
          {points.map((point, index) => point.value !== null && index !== lastIndex && (
            <span key={point.key} className="absolute h-[13px] w-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] bg-white" style={{ left: `${xFor(index)}%`, top: `${yFor(point.value)}%`, borderColor: lineColor }} />
          ))}
          {lastPoint.value !== null && (
            <>
              <span className="absolute h-[17px] w-[17px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white" style={{ left: `${xFor(lastIndex)}%`, top: `${yFor(lastPoint.value)}%`, background: lineColor }} />
              <span
                className="absolute flex h-6 w-12 -translate-x-1/2 -translate-y-[150%] items-center justify-center rounded-lg text-[10px] font-bold text-white"
                style={{ left: `${xFor(lastIndex)}%`, top: `${yFor(lastPoint.value)}%`, background: 'var(--evo-text)' }}
              >{formatValue(lastPoint.value)}</span>
            </>
          )}
        </div>
        <div className="mt-1 flex">
          {points.map((point, index) => (
            <span key={point.key} className="flex-1 text-center text-[11.5px] text-[var(--evo-text-secondary)]">
              {(points.length <= 8 || index % 2 === 0 || index === lastIndex) && point.date ? point.date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : ''}
            </span>
          ))}
        </div>
        <p className="mt-2 text-sm text-[var(--evo-text-secondary)]">{phrase}</p>
        <button
          type="button"
          onClick={() => setExpanded(value => !value)}
          aria-expanded={expanded}
          aria-controls={tableId}
          className="mt-2 min-h-9 text-xs font-bold text-[var(--evo-primary)] underline-offset-2 hover:underline lg:hidden"
        >{expanded ? 'Ocultar valores en tabla' : 'Ver valores en tabla'}</button>
      </div>
      <div className="mt-1 lg:mt-0 lg:w-64 lg:shrink-0">
        <ChartDataTable id={tableId} caption={unit === 'steps' ? 'Pasos de rutina por semana' : 'Ánimo positivo por semana'} rows={rows} valueHeader={unit === 'steps' ? 'Pasos' : 'Positivos'} collapsed={!expanded} />
      </div>
    </div>
  );
}
