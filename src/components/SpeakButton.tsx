import { Volume2 } from 'lucide-react';
import { isSpeechSupported, speakText } from '@/lib/speech';

// Unica responsabilidad: un boton que lee `text` en voz alta al tocarlo.
// No sabe nada de rutinas, calendario ni del traductor — cualquier pantalla
// que tenga un texto corto para leer lo usa igual.
export default function SpeakButton({ text, className = '', size = 14 }: { text: string; className?: string; size?: number }) {
  if (!isSpeechSupported()) return null;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        speakText(text);
      }}
      aria-label={`Escuchar "${text}"`}
      title="Escuchar"
      className={`shrink-0 rounded-full p-1.5 text-[#6b4c9a] hover:bg-[#6b4c9a]/10 ${className}`}
    >
      <Volume2 size={size} />
    </button>
  );
}
