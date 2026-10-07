import type { HelpSpot } from '@/data/usageApi';
import type { HelpSpotsState } from './useHelpSpots';

const MAX_ROWS = 4;

const spotLabel = (spot: HelpSpot) => spot.titulo || (spot.contexto === 'comunicacion' ? 'No puedo hablar' : spot.contexto);

function SpotRow({ spot, max, highlight }: { spot: HelpSpot; max: number; highlight: boolean }) {
  const hasStep = spot.paso !== null && spot.paso !== undefined;
  const place = spotLabel(spot);
  const stepSuffix = hasStep ? ` · paso ${spot.paso}` : '';
  const label = `${place}${stepSuffix}`;
  const detail = hasStep ? spot.pasoTexto : 'Desde el botón de comunicación';
  return (
    <li className="border-t border-[var(--evo-divider,var(--evo-border-3))] py-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="flex min-w-0 text-sm font-extrabold text-[var(--evo-text)]">
          <span className="truncate">{place}</span>
          {stepSuffix && <span className="shrink-0 whitespace-pre">{stepSuffix}</span>}
        </p>
        <span className="shrink-0 text-sm font-extrabold text-[var(--evo-text)]">×{spot.cantidad}</span>
      </div>
      {detail && <p className="mt-0.5 truncate text-xs text-[var(--evo-text-secondary)]">{detail}</p>}
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--evo-track)]" role="img" aria-label={`${label}: ${spot.cantidad} ${spot.cantidad === 1 ? 'pedido' : 'pedidos'}`}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (spot.cantidad / max) * 100)}%`, background: highlight ? 'var(--evo-primary)' : 'var(--evo-before-bar)' }} />
      </div>
    </li>
  );
}

export default function HelpSpotsCard({ state }: { state: HelpSpotsState }) {
  const report = state.report;
  const spots = (report?.lugares ?? []).slice(0, MAX_ROWS);
  const max = Math.max(1, ...spots.map(spot => spot.cantidad));
  const chips = report ? [
    { icon: '🙋', label: 'Ayuda', count: report.porMotivo?.ayuda ?? 0 },
    { icon: '❓', label: 'No entiende', count: report.porMotivo?.no_entiende ?? 0 },
    { icon: '🌙', label: 'Pausa', count: report.porMotivo?.pausa ?? 0 },
  ].filter(chip => chip.count > 0) : [];
  const empty = !state.loading && !state.failed && (!report || report.total === 0 || spots.length === 0);

  return (
    <div className="rounded-[28px] border border-[rgba(217,213,247,.7)] bg-white px-4 py-3.5 shadow-[0_12px_32px_rgba(111,76,166,.09),0_2px_6px_rgba(43,33,69,.05)]">
      <h2 className="font-heading text-[22px] font-extrabold leading-[1.1] text-[var(--evo-text)]">Dónde se traba</h2>
      {report && !empty && (
        <p className="mt-1 text-[13.5px] text-[var(--evo-text-secondary)]">
          Últimos {report.dias} días · {report.total} {report.total === 1 ? 'pedido' : 'pedidos'} de ayuda
        </p>
      )}

      {state.loading && <p className="mt-3 text-sm text-[var(--evo-text-secondary)]">Calculando…</p>}
      {state.failed && <p className="mt-3 text-sm text-[var(--evo-text-secondary)]">No se pudo cargar.</p>}
      {empty && <p className="mt-3 text-sm text-[var(--evo-text-secondary)]">Todavía no pidió ayuda en este período.</p>}

      {report && !empty && (
        <>
          <ul className="mt-2">
            {spots.map((spot, index) => <SpotRow key={`${spot.contexto}-${spot.titulo}-${spot.paso}-${index}`} spot={spot} max={max} highlight={index === 0} />)}
          </ul>
          {chips.length > 0 && (
            <p className="mt-2 flex flex-wrap gap-1.5">
              {chips.map(chip => (
                <span key={chip.label} className="rounded-full bg-[var(--evo-soft)] px-2.5 py-1 text-xs font-bold text-[var(--evo-primary-text)]">
                  <span aria-hidden>{chip.icon}</span> {chip.label} {chip.count}
                </span>
              ))}
            </p>
          )}
          <p className="mt-3 border-t border-[var(--evo-divider,var(--evo-border-3))] pt-2.5 text-xs text-[var(--evo-text-secondary)]">
            Son los pasos donde más pidió ayuda. Sirve para ajustar la actividad o dejarle un Plan B.
          </p>
        </>
      )}
    </div>
  );
}
