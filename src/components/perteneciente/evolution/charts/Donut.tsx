// Anillo de porcentaje con etiqueta central (vocabulario, patrones, "Ahora" de Colaboración).
export default function Donut({ percent, centerLabel, label, size = 80, stroke = 8, radius, color = 'var(--evo-ring-support)', labelSize = 12 }: {
  percent: number; centerLabel: string; label: string; size?: number; stroke?: number; radius?: number; color?: string; labelSize?: number;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const r = radius ?? size / 2 - stroke / 2 - 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ height: size, width: size }} role="img" aria-label={label}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ height: size, width: size }} className="-rotate-90">
        <circle cx={center} cy={center} r={r} fill="none" stroke="var(--evo-track)" strokeWidth={stroke} />
        <circle
          cx={center} cy={center} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute font-bold text-[var(--evo-text)]" style={{ fontSize: labelSize }}>{centerLabel}</span>
    </div>
  );
}
