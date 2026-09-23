import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function ScreenError({
  title,
  description,
  onRetry,
  onGoHome,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-[#f0e8f8] bg-white px-6 py-12 text-center shadow-sm animate-fade-in">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f5f0ff] text-[#8b5cf6]">
        <AlertTriangle size={32} aria-hidden />
      </div>
      <h2 className="font-heading text-xl font-bold text-[#3d2c5e]">
        {title || "Algo salió mal"}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#8b7aa0]">
        {description ||
          "No pudimos cargar esta sección. Podés intentar de nuevo o volver al inicio."}
      </p>
      <div className="mt-6 flex gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#f5f0ff] px-5 text-sm font-bold text-[#6b4c9a] transition-colors hover:bg-[#ece5fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6] focus-visible:ring-offset-2"
          >
            <RefreshCw size={16} aria-hidden />
            Reintentar
          </button>
        )}
        {onGoHome && (
          <button
            type="button"
            onClick={onGoHome}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#6b4c9a] px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#5a3d85] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6] focus-visible:ring-offset-2"
          >
            <Home size={16} aria-hidden />
            Ir al inicio
          </button>
        )}
      </div>
    </div>
  );
}
