import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { MessageSquareOff, X, Volume2 } from 'lucide-react';
import { speakText } from '@/lib/speech';
import { logUsageEvent, fetchAutonomyCardUsage, type AutonomyCardUsage } from '@/data/usageApi';
import { sortByAutonomyUsage } from '@/lib/autonomyCardOrder';
import { useAuth } from '@/contexts/AuthContext';
import { tandemApi } from '@/services/api/tandem-api';
import { useHelpSender } from '@/components/activity-help/useHelpSender';
import { joinNames } from '@/components/activity-help/useHelpRequest';

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
//
// Dos de las frases ("Necesito ayuda" y "Necesito espacio") ademas avisan al
// tutor, en silencio y sin sacar a la persona de la pantalla: la voz va
// primero y el aviso no se espera.
type CrisisPhrase = {
  id: string;
  label: string;
  emoji: string;
  notify?: { motivo: 'ayuda' | 'pausa'; frase?: string };
};

const CRISIS_PHRASES: readonly CrisisPhrase[] = [
  { id: 'no-puedo-hablar', label: 'No puedo hablar ahora', emoji: '🤐' },
  { id: 'necesito-ayuda', label: 'Necesito ayuda', emoji: '🆘', notify: { motivo: 'ayuda' } },
  { id: 'necesito-espacio', label: 'Necesito espacio', emoji: '🚪', notify: { motivo: 'pausa', frase: 'Necesito espacio' } },
  { id: 'estoy-bien', label: 'Estoy bien, dame un momento', emoji: '🙏' },
  { id: 'si', label: 'Sí', emoji: '👍' },
  { id: 'no', label: 'No', emoji: '👎' },
];

export type CantSpeakModeHandle = { open: () => void };

type CantSpeakModeProps = { hideMobileTrigger?: boolean };

const CantSpeakMode = forwardRef<CantSpeakModeHandle, CantSpeakModeProps>(function CantSpeakMode({ hideMobileTrigger = false }, ref) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [usage, setUsage] = useState<AutonomyCardUsage[]>([]);
  const [notifiedPhraseId, setNotifiedPhraseId] = useState<string | null>(null);

  const sendNotice = useCallback((notify: NonNullable<CrisisPhrase['notify']>) => tandemApi.ayuda.request({
    contexto: 'comunicador',
    motivo: notify.motivo,
    ...(notify.frase ? { frase: notify.frase } : {}),
  }), []);
  const notice = useHelpSender(sendNotice);

  useImperativeHandle(ref, () => ({ open: () => setOpen(true) }), []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    fetchAutonomyCardUsage(user.id).then((result) => { if (!cancelled) setUsage(result); });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Sesion 25 (perfil de memoria): en el momento de mas necesidad, las
  // frases que mas le sirvieron antes van primero.
  const orderedPhrases = sortByAutonomyUsage(CRISIS_PHRASES, usage, 'modo_no_puedo_hablar');

  const say = (phrase: CrisisPhrase) => {
    speakText(phrase.label);
    void logUsageEvent({ tipoEvento: 'tarjeta_autonomia_usada', entidadTipo: 'modo_no_puedo_hablar', entidadId: phrase.id, valor: { label: phrase.label } });
    if (phrase.notify) {
      setNotifiedPhraseId(phrase.id);
      void notice.send(phrase.notify);
    }
  };

  const close = () => {
    setOpen(false);
    notice.reset();
    setNotifiedPhraseId(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Modo no puedo hablar"
        title="No puedo hablar"
        className={`fixed bottom-24 right-4 z-40 h-14 w-14 items-center justify-center rounded-full bg-[#6b4c9a] text-white shadow-lg shadow-purple-300/50 hover:bg-[#5a3c8a] active:scale-95 lg:bottom-6 ${hideMobileTrigger ? 'hidden lg:flex' : 'flex'}`}
      >
        <MessageSquareOff size={24} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white">
          <div className="flex items-center justify-between border-b border-[#ede4f8] p-4">
            <h2 className="text-lg font-bold text-[#6b4c9a]">Tocá para decirlo</h2>
            <button type="button" onClick={close} aria-label="Cerrar" className="rounded-full p-2 text-[#8b7aa0] hover:bg-[#f5f0ff]">
              <X size={22} />
            </button>
          </div>
          {/* Franja de estado del aviso: el espacio queda reservado para que las tarjetas no salten. */}
          <div role="status" aria-live="polite" className="h-[72px] shrink-0 px-4 pt-3">
            {notice.status === 'sending' && (
              <p className="flex h-full items-center rounded-2xl bg-[#f5f0ff] px-4 text-sm font-bold text-[#6b4c9a]">Avisando…</p>
            )}
            {notice.status === 'sent' && (
              <p className="flex h-full items-center rounded-2xl border border-[#A8E3C9] bg-[#DCF5EA] px-4 text-sm font-bold text-[#0B6B4A]">
                ✓ Ya le avisamos a {joinNames(notice.avisados)}
              </p>
            )}
            {notice.status === 'failed' && (
              <div className="flex h-full flex-col justify-center rounded-2xl border border-[#F3DDA0] bg-[#FFF1D9] px-4 text-[#7A5200]">
                <p className="text-sm font-bold leading-tight">No pudimos avisar</p>
                <p className="text-xs leading-tight">Mostrale esta pantalla a alguien o tocá de nuevo.</p>
              </div>
            )}
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3">
            {orderedPhrases.map((phrase) => {
              const marked = notifiedPhraseId === phrase.id;
              const sent = marked && notice.status === 'sent';
              const failed = marked && notice.status === 'failed';
              const tone = sent
                ? 'border-[#2FB585] bg-[#DCF5EA]'
                : failed
                  ? 'border-[#F6C3B5] bg-[#FDEDE8]'
                  : 'border-[#d8c7ef] bg-[#faf8ff] hover:border-[#6b4c9a] hover:bg-[#f5f0ff]';
              return (
                <button
                  key={phrase.id}
                  type="button"
                  onClick={() => say(phrase)}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-3xl border-2 p-3 text-center active:scale-95 ${tone}`}
                >
                  <span className="text-5xl leading-none">{phrase.emoji}</span>
                  <span className="text-base font-bold text-[#4a4a5a]">{phrase.label}</span>
                  {sent ? (
                    <span className="text-xs font-bold text-[#0B6B4A]">✓ Avisado</span>
                  ) : failed ? (
                    <span className="text-xs font-bold text-[#9A3A24]">Tocá de nuevo</span>
                  ) : phrase.notify ? (
                    <span className="text-xs font-semibold text-[#8b7aa0]"><span aria-hidden>🔔</span> Avisa a tu tutor</span>
                  ) : (
                    <Volume2 size={14} className="text-[#8b7aa0]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
});

export default CantSpeakMode;
