import { useEffect, useState } from 'react';
import { MessageSquareOff, X, Volume2 } from 'lucide-react';
import { speakText } from '@/lib/speech';
import { logUsageEvent, fetchAutonomyCardUsage, type AutonomyCardUsage } from '@/data/usageApi';
import { sortByAutonomyUsage } from '@/lib/autonomyCardOrder';
import { useAuth } from '@/contexts/AuthContext';

// Unica responsabilidad: el modo "no puedo hablar" (Sesion 13, item 26 ⭐⭐
// — el diferenciador emocional mas fuerte del roadmap). Es un modo de
// CRISIS: cuando alguien no puede hablar en el momento (sobrecarga,
// ansiedad, mutismo situacional), necesita decir algo YA, con el minimo de
// pasos posible. Por eso:
// - Es un boton flotante SIEMPRE visible, no una pantalla mas que hay que
//   ir a buscar en el menu.
// - Al tocarlo, un pantalla completa con MUY pocas frases, MUY grandes,
//   UN toque = se dice. Nada de armar una frase con el comunicador (eso
//   es para cuando hay tiempo y calma, no para una crisis).
// - Frases elegidas para las situaciones mas urgentes: pedir ayuda, avisar
//   que no puede hablar ahora, pedir espacio, decir que esta bien.
const CRISIS_PHRASES = [
  { id: 'no-puedo-hablar', label: 'No puedo hablar ahora', emoji: '🤐' },
  { id: 'necesito-ayuda', label: 'Necesito ayuda', emoji: '🆘' },
  { id: 'necesito-espacio', label: 'Necesito espacio', emoji: '🚪' },
  { id: 'estoy-bien', label: 'Estoy bien, dame un momento', emoji: '🙏' },
  { id: 'si', label: 'Sí', emoji: '👍' },
  { id: 'no', label: 'No', emoji: '👎' },
] as const;

export default function CantSpeakMode() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [usage, setUsage] = useState<AutonomyCardUsage[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    fetchAutonomyCardUsage(user.id).then((result) => { if (!cancelled) setUsage(result); });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Sesion 25 (perfil de memoria): en el momento de mas necesidad, las
  // frases que mas le sirvieron antes van primero.
  const orderedPhrases = sortByAutonomyUsage(CRISIS_PHRASES, usage, 'modo_no_puedo_hablar');

  const say = (phrase: typeof CRISIS_PHRASES[number]) => {
    speakText(phrase.label);
    void logUsageEvent({ tipoEvento: 'tarjeta_autonomia_usada', entidadTipo: 'modo_no_puedo_hablar', entidadId: phrase.id, valor: { label: phrase.label } });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Modo no puedo hablar"
        title="No puedo hablar"
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#6b4c9a] text-white shadow-lg shadow-purple-300/50 hover:bg-[#5a3c8a] active:scale-95 lg:bottom-6"
      >
        <MessageSquareOff size={24} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white">
          <div className="flex items-center justify-between border-b border-[#ede4f8] p-4">
            <h2 className="text-lg font-bold text-[#6b4c9a]">Tocá para decirlo</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="rounded-full p-2 text-[#8b7aa0] hover:bg-[#f5f0ff]">
              <X size={22} />
            </button>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3">
            {orderedPhrases.map((phrase) => (
              <button
                key={phrase.id}
                type="button"
                onClick={() => say(phrase)}
                className="flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-[#d8c7ef] bg-[#faf8ff] p-4 text-center hover:border-[#6b4c9a] hover:bg-[#f5f0ff] active:scale-95"
              >
                <span className="text-5xl">{phrase.emoji}</span>
                <span className="text-base font-bold text-[#4a4a5a]">{phrase.label}</span>
                <Volume2 size={14} className="text-[#8b7aa0]" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
