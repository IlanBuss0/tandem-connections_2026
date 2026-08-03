import { useEffect, useState } from 'react';
import { logUsageEvent, fetchAutonomyCardUsage, type AutonomyCardUsage } from '@/data/usageApi';
import { sortByAutonomyUsage } from '@/lib/autonomyCardOrder';
import { speakText } from '@/lib/speech';
import { useAuth } from '@/contexts/AuthContext';
import PictogramTile from '@/components/PictogramTile';
import PictogramGrid from '@/components/PictogramGrid';

// Unica responsabilidad: tarjetas de autonomia (Sesion 10, item 27) — que
// el perteneciente pueda decir "necesito ayuda" o "explicame mas lento" con
// un solo toque, sin tener que construir la frase. Al tocar una, se lee en
// voz alta (para quien esta cerca) y queda registrada como uso (Sesion 9),
// asi el bloque F puede algun dia notar "esta persona pide ayuda seguido
// en tal contexto".
//
// Sin pictograma de catalogo por ahora (evita una llamada de red mas en
// una pantalla que ya dispara varias): el emoji grande ya es un apoyo
// visual claro para estas 3 frases puntuales.
const CARDS = [
  { id: 'necesito-ayuda', label: 'Necesito ayuda', emoji: '🙋' },
  { id: 'explicame-mas-lento', label: 'Explicame más lento', emoji: '🐢' },
  { id: 'necesito-un-momento', label: 'Necesito un momento', emoji: '⏸️' },
] as const;

export default function AutonomyCards() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<AutonomyCardUsage[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    fetchAutonomyCardUsage(user.id).then((result) => { if (!cancelled) setUsage(result); });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Sesion 25 (perfil de memoria): las que mas le sirvieron a ESTA persona
  // van primero — invisible, sin ninguna marca, solo el orden cambia.
  const orderedCards = sortByAutonomyUsage(CARDS, usage, 'tarjeta_autonomia');

  const handleTap = (card: typeof CARDS[number]) => {
    speakText(card.label);
    void logUsageEvent({ tipoEvento: 'tarjeta_autonomia_usada', entidadTipo: 'tarjeta_autonomia', entidadId: card.id, valor: { label: card.label } });
  };

  return (
    <PictogramGrid label="Tarjetas de autonomía" className="!grid-cols-3 sm:!grid-cols-3 md:!grid-cols-3">
      {orderedCards.map((card) => (
        <PictogramTile key={card.id} fallback={card.emoji} label={card.label} onClick={() => handleTap(card)} />
      ))}
    </PictogramGrid>
  );
}
