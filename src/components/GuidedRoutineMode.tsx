import { useCallback, useMemo, useState } from 'react';
import { ChevronRight, Check, X, Compass } from 'lucide-react';
import type { RoutineItem } from '@/data/api';
import { useRoutines } from '@/contexts/RoutinesContext';
import RoutinePictogram from '@/components/RoutinePictogram';
import SpeakButton from '@/components/SpeakButton';
import { tandemApi } from '@/services/api/tandem-api';
import CantContinueSheet from '@/components/activity-help/CantContinueSheet';
import StepExplainView from '@/components/activity-help/StepExplainView';
import HelpSentView from '@/components/activity-help/HelpSentView';
import ShowSomeoneView from '@/components/activity-help/ShowSomeoneView';
import CalmMode from '@/components/activity-help/CalmMode';
import { helpRecipientLabel } from '@/components/activity-help/helpRecipientLabel';
import { useHelpSender } from '@/components/activity-help/useHelpSender';
import type { HelpMotivo } from '@/components/activity-help/useHelpRequest';

// Unica responsabilidad: guiar UN paso a la vez (Sesion 18, item 31) — a
// diferencia de la grilla de "Mi dia" (que muestra TODOS los pasos juntos,
// pensada para tener panorama), este modo achica la pantalla a una sola
// cosa: la que hay que hacer ahora. Menos pasos visibles a la vez = menos
// sobrecarga en el momento de hacer las cosas, no de planificarlas.
export default function GuidedRoutineMode({ routineId, items }: { routineId: string; items: RoutineItem[] }) {
  const { toggleItem, routines } = useRoutines();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [helpView, setHelpView] = useState<null | 'sheet' | 'explain' | 'sent' | 'calm'>(null);
  const [lastMotivo, setLastMotivo] = useState<HelpMotivo>('ayuda');

  const pending = useMemo(() => items.filter((it) => !it.completed), [items]);
  const current = pending[index] || null;

  // Datos del paso para el pedido de ayuda: el numero es la posicion entre
  // TODOS los pasos de la rutina (no solo los pendientes).
  const routineName = routines.find((routine) => routine.id === routineId)?.name || 'tu rutina';
  const itemLabel = (item?: RoutineItem) => (item ? item.pictogramLabel || item.title : undefined);
  const stepText = itemLabel(current ?? undefined) ?? '';
  const stepNumber = current ? items.findIndex((it) => it.id === current.id) + 1 : 0;
  const previousItem = stepNumber > 1 ? items[stepNumber - 2] : undefined;

  const sendFn = useCallback((motivo: HelpMotivo) => {
    if (!current) return null;
    return tandemApi.ayuda.request({
      contexto: 'rutina',
      motivo,
      titulo: routineName,
      paso: stepNumber,
      totalPasos: items.length,
      pasoTexto: stepText,
    });
  }, [current, routineName, stepNumber, items.length, stepText]);
  const helpSender = useHelpSender(sendFn);
  const calmNotify = useHelpSender(sendFn);

  const sendHelp = (motivo: HelpMotivo) => {
    setLastMotivo(motivo);
    setHelpView('sent');
    void helpSender.send(motivo);
  };
  const openCalm = () => { calmNotify.reset(); setHelpView('calm'); };
  const backToStep = () => { helpSender.reset(); setHelpView(null); };

  const start = () => {
    setIndex(0);
    setHelpView(null);
    setOpen(true);
  };

  const markDoneAndNext = () => {
    if (!current) return;
    toggleItem(routineId, current.id);
    // No se avanza el indice: al completarse, `current` sale de `pending`
    // y el siguiente pendiente ocupa el mismo indice solo.
    if (pending.length <= 1) setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={start}
        disabled={pending.length === 0}
        className="flex items-center gap-1.5 rounded-full border border-[#ede4f8] bg-white px-3 py-2 text-xs font-semibold text-[#6b4c9a] hover:bg-[#f5f0ff] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Compass size={14} /> Modo guiado
      </button>
    );
  }

  if (!current) {
    setOpen(false);
    return null;
  }

  const recipientLabel = helpRecipientLabel(undefined, undefined);
  const showingHelpScreen = helpView === 'explain' || helpView === 'sent';

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-[#ede4f8] p-4">
        <span className="text-xs font-semibold text-[#8b7aa0]">Paso {index + 1} de {pending.length}</span>
        <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="rounded-full p-2 text-[#8b7aa0] hover:bg-[#f5f0ff]">
          <X size={22} />
        </button>
      </div>

      {helpView === 'explain' && (
        <div className="flex-1 overflow-y-auto px-4 pt-4">
          <StepExplainView
            activityTitle={routineName}
            stepNumber={stepNumber}
            totalSteps={items.length}
            stepText={stepText}
            previousStepText={itemLabel(previousItem)}
            nextStepText={itemLabel(pending[index + 1])}
            recipientLabel={recipientLabel}
            icon={<RoutinePictogram item={current} size="lg" />}
            onBack={backToStep}
            onContinue={backToStep}
            onAskForHelp={() => sendHelp('no_entiende')}
          />
        </div>
      )}

      {helpView === 'sent' && (
        <div className="flex-1 overflow-y-auto px-4 pt-4">
          {helpSender.status === 'failed' ? (
            <ShowSomeoneView
              activityTitle={routineName}
              stepNumber={stepNumber}
              stepText={stepText}
              onBack={backToStep}
              onRetry={() => void helpSender.send(lastMotivo)}
              onCalm={openCalm}
            />
          ) : (
            <HelpSentView
              sending={helpSender.status !== 'sent'}
              avisados={helpSender.avisados}
              activityTitle={routineName}
              stepNumber={stepNumber}
              stepText={stepText}
              onUsePlanB={() => undefined}
              onCalm={openCalm}
              onBack={backToStep}
            />
          )}
        </div>
      )}

      {!showingHelpScreen && (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-6">
            <RoutinePictogram item={current} size="lg" />
            <h2 className="text-center text-2xl font-bold text-[#4a4a5a]">{current.pictogramLabel || current.title}</h2>
            <SpeakButton text={current.pictogramLabel || current.title} size={20} />
          </div>
          <div className="border-t border-[#ede4f8] p-4">
            <div className="mx-auto flex w-full flex-col gap-3 sm:max-w-md">
              <button
                type="button"
                onClick={markDoneAndNext}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#6b4c9a] py-4 text-base font-bold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95"
              >
                <Check size={20} /> Listo, siguiente <ChevronRight size={18} />
              </button>
              <button
                type="button"
                onClick={() => setHelpView('sheet')}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-[#F6C3B5] bg-[#FDEDE8] px-4 py-2 text-base font-bold text-[#9A3A24] hover:bg-[#fbe3db] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span aria-hidden>🙋</span> No puedo seguir
              </button>
            </div>
          </div>
        </>
      )}

      {helpView === 'sheet' && (
        <CantContinueSheet
          raised
          recipientLabel={recipientLabel}
          onClose={() => setHelpView(null)}
          onUsePlanB={() => undefined}
          onNeedHelp={() => sendHelp('ayuda')}
          onNotUnderstand={() => setHelpView('explain')}
          onPause={openCalm}
        />
      )}

      {helpView === 'calm' && (
        <CalmMode
          onClose={backToStep}
          onNotify={() => void calmNotify.send('pausa')}
          notifyStatus={calmNotify.status}
          recipientLabel={recipientLabel}
        />
      )}
    </div>
  );
}
