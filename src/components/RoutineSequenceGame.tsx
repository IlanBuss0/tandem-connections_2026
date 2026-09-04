import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import SpeakButton from '@/components/SpeakButton';
import type { RoutineCard, RoutineRound, RoutineSequenceData, RoutineSequenceResult } from '@/data/routineSequence';
import { routineScore, validateRoutineSequence } from '@/data/routineSequence';

function shuffle<T>(values: T[]): T[] { return [...values].sort(() => Math.random() - 0.5); }

function Card({ card, selected, onClick }: { card?: RoutineCard; selected?: boolean; onClick?: () => void }) {
  if (!card) return null;
  const content = <><span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/5 text-2xl">{card.imageUrl ? <img src={card.imageUrl} alt="" className="h-full w-full object-contain" /> : card.emoji || '📌'}</span><span className="min-w-0 flex-1 text-left text-sm font-semibold">{card.text}</span><SpeakButton text={card.accessibleLabel || card.text} /></>;
  return onClick ? <button type="button" onClick={onClick} aria-pressed={selected} className={`flex min-h-14 w-full items-center gap-3 rounded-xl border p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selected ? 'border-primary bg-primary/10' : 'bg-card'}`}>{content}</button> : <div className="flex min-h-14 items-center gap-3 rounded-xl border bg-card p-2">{content}</div>;
}

export default function RoutineSequenceGame({ data, onFinish }: { data: RoutineSequenceData; onFinish: (score: number, details: RoutineSequenceResult) => void }) {
  const error = validateRoutineSequence(data);
  const cards = useMemo(() => new Map(data.cards.map(card => [card.id, card])), [data.cards]);
  const [order, setOrder] = useState(() => shuffle(data.stepIds));
  const [roundIndex, setRoundIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedConflicts, setSelectedConflicts] = useState<string[]>([]);
  const [detectiveStage, setDetectiveStage] = useState<'identify' | 'replace'>('identify');
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hints, setHints] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [conflicts, setConflicts] = useState<string[]>([]);
  const startedAt = useRef(Date.now());
  const executionId = useRef(crypto.randomUUID());
  const finished = useRef(false);
  const round = data.rounds?.[roundIndex];
  const roundPrompt = data.mode === 'plan-b' && round?.changedStepId
    ? `Hoy no se puede seguir el paso “${cards.get(round.changedStepId)?.text || ''}”. ¿Qué otra alternativa existe?`
    : round?.prompt || data.prompt;

  const complete = (nextAttempts: number, nextConflicts = conflicts) => {
    if (finished.current) return;
    finished.current = true;
    const score = routineScore(mistakes + 1, hints);
    onFinish(score, { executionId: executionId.current, gameType: 'routine-sequence', mode: data.mode, score, attempts: nextAttempts, hintsUsed: hints, durationMs: Date.now() - startedAt.current, conflictStepIds: [...new Set(nextConflicts)] });
  };
  const advance = (nextAttempts: number, nextConflicts = conflicts) => {
    if (!data.rounds || roundIndex + 1 >= data.rounds.length) return complete(nextAttempts, nextConflicts);
    setRoundIndex(index => index + 1); setSelected(null); setSelectedConflicts([]); setDetectiveStage('identify'); setFeedback('');
  };
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction; if (target < 0 || target >= order.length) return;
    setOrder(current => { const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; });
  };
  const verifyOrder = () => {
    const nextAttempts = attempts + 1; setAttempts(nextAttempts);
    const ok = data.acceptedOrders.some(accepted => accepted.every((id, index) => order[index] === id));
    if (ok) { setFeedback('¡La secuencia es válida!'); window.setTimeout(() => complete(nextAttempts), 300); }
    else { setMistakes(value => value + 1); setConflicts(current => [...new Set([...current, ...order.filter((id, i) => !data.acceptedOrders.some(valid => valid[i] === id))])]); setFeedback('Todavía hay pasos para revisar. Podés volver a intentarlo.'); }
  };
  const choose = (id: string) => {
    if (!round) return;
    if (data.mode === 'detective' && detectiveStage === 'identify') { setSelected(id); return; }
    const nextAttempts = attempts + 1; setAttempts(nextAttempts);
    if (round.acceptedIds.includes(id)) { setFeedback(round.explanation || 'Esta es una opción válida.'); window.setTimeout(() => advance(nextAttempts), 350); }
    else { setMistakes(value => value + 1); setConflicts(current => [...new Set([...current, id])]); setFeedback(data.mode === 'plan-b' ? 'Esa opción puede no ayudar en este cambio. Probemos otra alternativa.' : 'Revisemos el contexto y probemos otra vez.'); }
  };
  const verifyConflict = () => {
    if (!round || !selectedConflicts.length) return;
    const nextAttempts = attempts + 1; setAttempts(nextAttempts);
    const expected = round.conflictIds?.length ? round.conflictIds : round.conflictId ? [round.conflictId] : [];
    const isCorrect = expected.length === selectedConflicts.length && expected.every(id => selectedConflicts.includes(id));
    if (isCorrect) {
      const nextConflicts = [...new Set([...conflicts, ...selectedConflicts])];
      setConflicts(nextConflicts);
      setFeedback('Encontraste todos los pasos que necesitan revisión.');
      window.setTimeout(() => advance(nextAttempts, nextConflicts), 350);
    } else {
      setMistakes(value => value + 1);
      setFeedback('Revisá la rutina: puede faltar marcar un paso o haber uno que sí puede mantenerse.');
    }
  };
  const requestHint = () => {
    if (!data.hintsEnabled || hints >= 4) return;
    const level = hints + 1; setHints(level);
    const accepted = round?.acceptedIds[0] || data.acceptedOrders[0]?.[0];
    setFeedback(level === 1 ? data.prompt : level === 2 ? 'Mirá con atención la posición destacada y lo que ocurre alrededor.' : level === 3 ? 'El paso anterior puede ayudarte a anticipar qué sigue.' : `Una respuesta posible es: ${cards.get(accepted)?.text || 'revisá el orden mostrado'}.`);
  };
  if (error) return <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>;

  return <div className="space-y-4">
    <div className="flex items-start gap-2"><p className="flex-1 font-semibold">{roundPrompt}</p><SpeakButton text={roundPrompt} /></div>
    {data.mode === 'plan-b' && <CompactRoutine stepIds={data.stepIds} changedStepId={round?.changedStepId} cards={cards} />}
    {data.mode === 'order' ? <div className="space-y-2" aria-label="Pasos de la rutina">
      {order.map((id, index) => <div key={id} className="flex items-center gap-2"><span className="w-6 text-center font-bold text-primary">{index + 1}</span><div className="flex-1"><Card card={cards.get(id)} /></div><div className="flex gap-1"><button type="button" className="min-h-11 min-w-11 rounded-lg border" aria-label={`Mover ${cards.get(id)?.text} hacia arriba`} disabled={index === 0} onClick={() => move(index, -1)}>▲</button><button type="button" className="min-h-11 min-w-11 rounded-lg border" aria-label={`Mover ${cards.get(id)?.text} hacia abajo`} disabled={index === order.length - 1} onClick={() => move(index, 1)}>▼</button></div></div>)}
      <Button className="w-full" onClick={verifyOrder}>Verificar orden</Button>
    </div> : data.mode === 'detective' ? <DetectiveRoundView round={round!} cards={cards} selectedIds={selectedConflicts} onToggle={id => setSelectedConflicts(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])} onVerify={verifyConflict} /> : <RoundView mode={data.mode} round={round!} fullOrder={data.acceptedOrders[0]} cards={cards} selected={selected} stage={detectiveStage} onSelect={choose} onVerifyConflict={verifyConflict} />}
    <div aria-live="polite" className="min-h-10 rounded-xl bg-muted/50 p-2 text-sm">{feedback}</div>
    {data.hintsEnabled && hints < 4 && <Button type="button" variant="outline" className="w-full" onClick={requestHint}>Pista {hints + 1} de 4</Button>}
  </div>;
}

function CompactRoutine({ stepIds, changedStepId, cards }: { stepIds: string[]; changedStepId?: string; cards: Map<string, RoutineCard> }) {
  return <div className="rounded-xl border bg-muted/30 p-2" aria-label="Rutina completa">
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Rutina completa</p>
    <div className="flex flex-wrap items-center gap-1">{stepIds.map((id, index) => { const card = cards.get(id); const changed = id === changedStepId; return <div key={id} className="flex items-center gap-1"><div className={`flex max-w-36 items-center gap-1 rounded-lg border px-2 py-1.5 text-xs ${changed ? 'border-destructive bg-destructive/10 font-semibold text-destructive' : 'bg-card'}`}><span aria-hidden="true">{card?.emoji || '📌'}</span><span className="truncate">{card?.text}</span>{changed && <span className="sr-only"> (paso que no se puede realizar)</span>}</div>{index < stepIds.length - 1 && <span className="text-muted-foreground" aria-hidden="true">→</span>}</div>; })}</div>
  </div>;
}

function DetectiveRoundView({ round, cards, selectedIds, onToggle, onVerify }: { round: RoutineRound; cards: Map<string, RoutineCard>; selectedIds: string[]; onToggle: (id: string) => void; onVerify: () => void }) {
  return <div className="space-y-3">
    <div className="space-y-2" aria-label="Pasos de la rutina para revisar">
      {(round.sequenceIds || []).map((id, index) => <Card key={`${id}-${index}`} card={cards.get(id)} selected={selectedIds.includes(id)} onClick={() => onToggle(id)} />)}
    </div>
    <Button className="w-full" disabled={!selectedIds.length} onClick={onVerify}>Revisar pasos seleccionados</Button>
  </div>;
}

function RoundView({ mode, round, fullOrder, cards, selected, stage, onSelect, onVerifyConflict }: { mode: RoutineSequenceData['mode']; round: RoutineRound; fullOrder: string[]; cards: Map<string, RoutineCard>; selected: string | null; stage: 'identify' | 'replace'; onSelect: (id: string) => void; onVerifyConflict: () => void }) {
  const visibleIds = mode === 'missing' ? fullOrder.map(id => id === round.acceptedIds[0] ? `__missing__${id}` : id) : round.sequenceIds || [];
  return <div className="space-y-3">
    {visibleIds.length > 0 && <div className="space-y-2">{visibleIds.map((id, index) => id.startsWith('__missing__') ? <div key={id} className="flex min-h-14 items-center justify-center rounded-xl border-2 border-dashed border-primary" aria-label="Paso faltante">¿Qué falta acá?</div> : <Card key={`${id}-${index}`} card={cards.get(id)} selected={selected === id} onClick={mode === 'detective' && stage === 'identify' ? () => onSelect(id) : undefined} />)}</div>}
    {mode === 'detective' && stage === 'identify' ? <Button className="w-full" disabled={!selected} onClick={onVerifyConflict}>Revisar este paso</Button> : <div className="grid gap-2 sm:grid-cols-2" aria-label="Opciones">{round.optionIds.map(id => <Card key={id} card={cards.get(id)} onClick={() => onSelect(id)} />)}</div>}
  </div>;
}
