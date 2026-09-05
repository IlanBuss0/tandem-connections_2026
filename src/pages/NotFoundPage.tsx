import { Compass, Home } from "lucide-react";

export default function NotFoundPage({
  onGoHome,
  onNavigate,
}: {
  onGoHome?: () => void;
  onNavigate?: (view: "landing" | "login" | "register") => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#FAF7FF] via-[#FAF7FF] to-white p-6 text-center">
      <div className="w-full max-w-md rounded-3xl border border-[#f0e8f8] bg-white p-8 shadow-sm animate-fade-in">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#f5f0ff] text-[#8b5cf6]">
          <Compass size={40} aria-hidden />
        </div>
        <p className="font-heading text-5xl font-extrabold tracking-tight text-[#6b4c9a]">
          404
        </p>
        <h1 className="mt-3 font-heading text-2xl font-bold text-[#3d2c5e]">
          No encontramos esa página
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#8b7aa0]">
          Parece que la dirección a la que querés ir no existe o cambió de
          lugar. No te preocupes, podemos volver a un punto seguro.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={onGoHome}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#6b4c9a] px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#5a3d85] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6] focus-visible:ring-offset-2"
          >
            <Home size={17} aria-hidden />
            Volver al inicio
          </button>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate("login")}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#e5d9f5] bg-white px-5 text-sm font-bold text-[#6b4c9a] transition-colors hover:bg-[#faf7ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6] focus-visible:ring-offset-2"
            >
              Iniciar sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
