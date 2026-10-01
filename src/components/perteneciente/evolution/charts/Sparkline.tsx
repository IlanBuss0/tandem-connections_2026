// Mini gráfico de línea para una tarjeta compacta. Escala siempre desde 0.
export default function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const lastIndex = values.length - 1;
  const xFor = (index: number) => (index / lastIndex) * 100;
  const yFor = (value: number) => 30 - (value / max) * 26;
  const d = values.map((value, index) => `${index === 0 ? 'M' : 'L'} ${xFor(index)} ${yFor(value)}`).join(' ');

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-8 w-full overflow-visible" role="img" aria-label={label}>
      <path d={d} fill="none" stroke="var(--evo-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={xFor(lastIndex)} cy={yFor(values[lastIndex])} r="3" fill="var(--evo-primary)" stroke="white" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
