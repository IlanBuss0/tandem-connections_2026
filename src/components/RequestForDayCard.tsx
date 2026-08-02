import { useState } from 'react';
import { Send, MessageSquarePlus } from 'lucide-react';
import { logUsageEvent } from '@/data/usageApi';

// Unica responsabilidad: que el perteneciente pueda PEDIR algo para su dia
// (Sesion 17, item 29 "co-decidir, no solo recibir"). Se registra como
// evento de uso; el tutor lo ve en su timeline (Sesion 9/16) y lo agrega
// con las herramientas que ya tiene si le parece bien — no hay un motor de
// aprobacion automatica todavia, ese es un alcance mas grande.
export default function RequestForDayCard() {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await logUsageEvent({ tipoEvento: 'pedido_dia', entidadTipo: 'pedido', valor: { text: trimmed } });
    setText('');
    setSent(true);
    setTimeout(() => { setSent(false); setOpen(false); }, 2000);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full border border-[#ede4f8] bg-white px-3 py-2 text-xs font-semibold text-[#6b4c9a] hover:bg-[#f5f0ff]"
      >
        <MessageSquarePlus size={14} /> Pedir algo para mi día
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-3">
      {sent ? (
        <p className="text-center text-sm font-semibold text-green-700">¡Listo! Tu tutor lo va a ver.</p>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="¿Qué querés pedir para tu día? Ej: quiero ir a la plaza"
            className="h-16 w-full resize-none rounded-xl border border-[#ede4f8] bg-white p-2 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-[#8b7aa0] hover:bg-white">
              Cancelar
            </button>
            <button type="button" onClick={send} disabled={!text.trim()} className="flex items-center gap-1 rounded-full bg-[#6b4c9a] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
              <Send size={12} /> Pedir
            </button>
          </div>
        </>
      )}
    </div>
  );
}
