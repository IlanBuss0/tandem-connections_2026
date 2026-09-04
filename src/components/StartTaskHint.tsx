import { Play } from 'lucide-react';
import { speakText } from '@/lib/speech';
import { logUsageEvent } from '@/data/usageApi';

// Unica responsabilidad: bajar la energia de arranque de una tarea (Sesion
// 13, item 32) — en vez de "hace todo el paso", ofrece "el primer
// pasito nada mas". No parte la tarea de verdad (eso pediria saber que es
// cada paso especificamente, con IA o curaduria manual); en cambio da el
// empujon generico que mas ayuda a arrancar: enfocar en un solo minuto.
export default function StartTaskHint({ stepTitle }: { stepTitle: string }) {
  const start = () => {
    const message = `Arrancá con lo más chiquito: solo el primer minuto de "${stepTitle}".`;
    speakText(message);
    void logUsageEvent({ tipoEvento: 'tarjeta_autonomia_usada', entidadTipo: 'arrancar_tarea', entidadId: stepTitle, valor: { stepTitle } });
  };

  return (
    <button
      type="button"
      onClick={start}
      className="flex items-center gap-1 rounded-full border border-[#6b4c9a]/30 px-2 py-1 text-[10px] font-semibold text-[#6b4c9a] hover:bg-[#f5f0ff]"
    >
      <Play size={10} /> Empezar
    </button>
  );
}
