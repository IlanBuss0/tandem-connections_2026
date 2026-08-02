import { logUsageEvent } from '@/data/usageApi';
import { speakText } from '@/lib/speech';
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
  const handleTap = (card: typeof CARDS[number]) => {
    speakText(card.label);
    void logUsageEvent({ tipoEvento: 'tarjeta_autonomia_usada', entidadTipo: 'tarjeta_autonomia', entidadId: card.id, valor: { label: card.label } });
  };

  return (
    <PictogramGrid label="Tarjetas de autonomía" className="!grid-cols-3 sm:!grid-cols-3 md:!grid-cols-3">
      {CARDS.map((card) => (
        <PictogramTile key={card.id} fallback={card.emoji} label={card.label} onClick={() => handleTap(card)} />
      ))}
    </PictogramGrid>
  );
}
