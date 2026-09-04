import { Mic, MicOff } from 'lucide-react';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';

// Unica responsabilidad: el boton de microfono que dicta texto a un
// buscador (Sesion 21, item 49 "búsqueda por voz"). Si el navegador no
// soporta Web Speech API (isVoiceSearchSupported === false), no se
// renderiza nada — mejor ausente que un boton roto.
export default function VoiceSearchButton({ onResult, className = '' }: { onResult: (text: string) => void; className?: string }) {
  const { listening, start, stop, supported } = useVoiceSearch(onResult);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => (listening ? stop() : start())}
      aria-pressed={listening}
      aria-label={listening ? 'Detener búsqueda por voz' : 'Buscar por voz'}
      title={listening ? 'Detener búsqueda por voz' : 'Buscar por voz'}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
        listening ? 'bg-[#6b4c9a] text-white animate-pulse' : 'text-[#8b7aa0] hover:bg-[#f5f0ff] hover:text-[#6b4c9a]'
      } ${className}`}
    >
      {listening ? <MicOff size={15} /> : <Mic size={15} />}
    </button>
  );
}
