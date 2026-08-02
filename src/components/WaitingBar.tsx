// Unica responsabilidad: la barra que se vacia (Sesion 13, item 34) — un
// apoyo visual de "cuanto falta" mas concreto que un numero de minutos
// solo. `remainingSeconds` y `totalSeconds` los calcula quien la usa; este
// componente solo dibuja.
export default function WaitingBar({ totalSeconds, remainingSeconds }: { totalSeconds: number; remainingSeconds: number }) {
  const pct = totalSeconds > 0 ? Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#ede4f8]">
      <div className="h-full rounded-full bg-[#6b4c9a] transition-all duration-1000 ease-linear" style={{ width: `${pct}%` }} />
    </div>
  );
}
