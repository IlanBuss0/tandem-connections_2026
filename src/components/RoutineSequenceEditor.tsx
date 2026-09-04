import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MiniGame from '@/components/MiniGame';
import { fetchPictograms, fetchRoutinesForUser, type DayRoutine, type Pictogram, type User } from '@/data/api';
import { createRoutineCard, emptyRoutineSequence, snapshotRoutine, type RoutineCard, type RoutineRound, type RoutineSequenceData, type RoutineSequenceMode, validateRoutineSequence } from '@/data/routineSequence';

const MODE_LABELS: Record<RoutineSequenceMode, string> = { order: 'Armá tu rutina', next: '¿Qué viene después?', missing: 'Paso que falta', detective: 'Detective de rutinas', 'plan-b': 'Plan B' };

function defaultRounds(mode: RoutineSequenceMode, cards: RoutineCard[], stepIds: string[]): RoutineRound[] | undefined {
  if (mode === 'order') return undefined;
  const options = stepIds.slice(1, Math.min(4, stepIds.length));
  if (options.length < 2) options.push(stepIds[0]);
  if (mode === 'next') return [{ id: crypto.randomUUID(), sequenceIds: [stepIds[0]], optionIds: options, acceptedIds: [stepIds[1]] }];
  if (mode === 'missing') return [{ id: crypto.randomUUID(), sequenceIds: stepIds.filter(id => id !== stepIds[1]), optionIds: [stepIds[1], stepIds[stepIds.length - 1]], acceptedIds: [stepIds[1]] }];
  if (mode === 'detective') return [{ id: crypto.randomUUID(), sequenceIds: stepIds, conflictId: stepIds[1], conflictIds: stepIds[1] ? [stepIds[1]] : [], optionIds: [], acceptedIds: [] }];
  const alternatives = [createRoutineCard('Nueva alternativa'), createRoutineCard('Otra alternativa')];
  cards.push(...alternatives);
  return [{ id: crypto.randomUUID(), changedStepId: stepIds[0], optionIds: alternatives.map(card => card.id), acceptedIds: [alternatives[0].id], explanation: 'Esta alternativa permite adaptar la rutina de una manera posible.' }];
}

export default function RoutineSequenceEditor({ value, onChange, assignableUsers, onSourceUserChange }: { value?: RoutineSequenceData; onChange: (value: RoutineSequenceData) => void; assignableUsers: User[]; onSourceUserChange: (id?: string) => void }) {
  const data = value || emptyRoutineSequence();
  const [preview, setPreview] = useState(false);
  const [sourceUserId, setSourceUserId] = useState(data.sourceRoutine?.sourceUserId || '');
  const [routines, setRoutines] = useState<DayRoutine[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState('');
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(7);
  const [pictoCardId, setPictoCardId] = useState<string | null>(null);
  const [pictoQuery, setPictoQuery] = useState('');
  const [pictograms, setPictograms] = useState<Pictogram[]>([]);
  const cards = useMemo(() => new Map(data.cards.map(card => [card.id, card])), [data.cards]);
  const update = (patch: Partial<RoutineSequenceData>) => onChange({ ...data, ...patch });
  const updateCard = (id: string, patch: Partial<RoutineCard>) => update({ cards: data.cards.map(card => card.id === id ? { ...card, ...patch } : card) });

  useEffect(() => { if (!sourceUserId) { setRoutines([]); return; } fetchRoutinesForUser(sourceUserId).then(setRoutines); }, [sourceUserId]);
  useEffect(() => { if (!pictoQuery.trim()) { setPictograms([]); return; } const timer = window.setTimeout(() => fetchPictograms({ search: pictoQuery, limit: 8 }).then(items => setPictograms(items.slice(0, 8))).catch(() => setPictograms([])), 300); return () => clearTimeout(timer); }, [pictoQuery]);

  const setMode = (mode: RoutineSequenceMode) => { const nextCards = data.cards.filter(card => data.stepIds.includes(card.id)); update({ mode, cards: nextCards, rounds: defaultRounds(mode, nextCards, data.stepIds) }); };
  const addCard = () => { if (data.stepIds.length >= 8) return; const card = createRoutineCard('Nuevo paso'); const nextCards = [...data.cards.filter(item => data.stepIds.includes(item.id)), card]; const stepIds = [...data.stepIds, card.id]; update({ cards: nextCards, stepIds, acceptedOrders: [stepIds], rounds: defaultRounds(data.mode, nextCards, stepIds) }); };
  const removeCard = (id: string) => { if (data.stepIds.length <= 3) return; const stepIds = data.stepIds.filter(item => item !== id); const nextCards = data.cards.filter(card => card.id !== id); update({ cards: nextCards, stepIds, acceptedOrders: [stepIds], rounds: defaultRounds(data.mode, nextCards, stepIds) }); };
  const move = (index: number, direction: -1 | 1) => { const target = index + direction; if (target < 0 || target >= data.stepIds.length) return; const stepIds = [...data.stepIds]; [stepIds[index], stepIds[target]] = [stepIds[target], stepIds[index]]; update({ stepIds, acceptedOrders: [stepIds, ...data.acceptedOrders.filter(order => order.join('|') !== data.stepIds.join('|'))] }); };
  const importRoutine = () => {
    const routine = routines.find(item => item.id === selectedRoutineId); if (!routine) return;
    const start = Math.max(0, Math.min(rangeStart, routine.items.length - 1)); const end = Math.min(routine.items.length, Math.max(start + 3, rangeEnd + 1));
    let snapshot; try { snapshot = snapshotRoutine(routine, sourceUserId, start, end - 1); } catch { return; }
    onChange({ ...data, ...snapshot, acceptedOrders: [snapshot.stepIds], rounds: defaultRounds(data.mode, snapshot.cards, snapshot.stepIds) });
    onSourceUserChange(sourceUserId);
  };
  const error = validateRoutineSequence(data);

  return <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
    <div className="grid gap-3 sm:grid-cols-3"><label className="text-xs font-semibold">Modo<select className="mt-1 h-10 w-full rounded-md border bg-background px-2" value={data.mode} onChange={event => setMode(event.target.value as RoutineSequenceMode)}>{Object.entries(MODE_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label className="text-xs font-semibold">Nivel de apoyo<select className="mt-1 h-10 w-full rounded-md border bg-background px-2" value={data.supportLevel} onChange={event => update({ supportLevel: event.target.value as RoutineSequenceData['supportLevel'] })}><option value="initial">Inicial</option><option value="intermediate">Intermedio</option><option value="advanced">Avanzado</option></select></label><label className="flex items-end gap-2 pb-2 text-xs font-semibold"><input type="checkbox" checked={data.hintsEnabled} onChange={event => update({ hintsEnabled: event.target.checked })} /> Permitir pistas</label></div>
    <label className="text-xs font-semibold">Consigna<Input className="mt-1" value={data.prompt} onChange={event => update({ prompt: event.target.value })} /></label>
    {assignableUsers.length > 0 && <div className="space-y-2 rounded-lg border bg-background p-3"><p className="text-sm font-bold">Copiar una rutina real</p><div className="grid gap-2 sm:grid-cols-2"><select className="h-10 rounded-md border px-2" value={sourceUserId} onChange={event => { setSourceUserId(event.target.value); setSelectedRoutineId(''); onSourceUserChange(undefined); }}><option value="">Elegí un perteneciente</option>{assignableUsers.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}</select><select className="h-10 rounded-md border px-2" value={selectedRoutineId} onChange={event => { setSelectedRoutineId(event.target.value); const routine = routines.find(item => item.id === event.target.value); setRangeStart(0); setRangeEnd(Math.min(7, (routine?.items.length || 1) - 1)); }}><option value="">Elegí una rutina</option>{routines.map(routine => <option key={routine.id} value={routine.id}>{routine.name} ({routine.items.length})</option>)}</select></div>{selectedRoutineId && <div className="flex flex-wrap items-end gap-2"><label className="text-xs">Desde<Input type="number" min={1} value={rangeStart + 1} onChange={event => setRangeStart(Math.max(0, Number(event.target.value) - 1))} /></label><label className="text-xs">Hasta<Input type="number" min={3} max={routines.find(item => item.id === selectedRoutineId)?.items.length || 8} value={rangeEnd + 1} onChange={event => setRangeEnd(Number(event.target.value) - 1)} /></label><Button type="button" onClick={importRoutine}>Crear instantánea</Button></div>}<p className="text-xs text-muted-foreground">Elegí un tramo contiguo de 3 a 8 pasos. La copia sólo podrá asignarse a este perteneciente.</p></div>}
    <div className="space-y-2"><div className="flex items-center justify-between"><p className="text-sm font-bold">Tarjetas ({data.stepIds.length}/8)</p><Button type="button" size="sm" variant="outline" onClick={addCard} disabled={data.stepIds.length >= 8}>Agregar paso</Button></div>{data.stepIds.map((id, index) => { const card = cards.get(id)!; return <div key={id} className="grid gap-2 rounded-lg border bg-background p-2 sm:grid-cols-[auto_1fr_80px_auto]"><div className="flex gap-1"><button type="button" className="min-h-11 min-w-11 rounded border" disabled={index === 0} onClick={() => move(index, -1)}>▲</button><button type="button" className="min-h-11 min-w-11 rounded border" disabled={index === data.stepIds.length - 1} onClick={() => move(index, 1)}>▼</button></div><Input value={card.text} aria-label={`Texto del paso ${index + 1}`} onChange={event => updateCard(id, { text: event.target.value, accessibleLabel: event.target.value })} /><Input value={card.emoji || ''} aria-label={`Emoji del paso ${index + 1}`} onChange={event => updateCard(id, { emoji: event.target.value })} /><div className="flex gap-1"><Button type="button" size="sm" variant="outline" onClick={() => setPictoCardId(pictoCardId === id ? null : id)}>Pictograma</Button><Button type="button" size="sm" variant="ghost" disabled={data.stepIds.length <= 3} onClick={() => removeCard(id)}>×</Button></div>{pictoCardId === id && <div className="space-y-2 sm:col-span-4"><Input placeholder="Buscar pictograma" value={pictoQuery} onChange={event => setPictoQuery(event.target.value)} /><div className="grid grid-cols-4 gap-2">{pictograms.map(pictogram => <button type="button" key={pictogram.id} className="rounded border p-1 text-xs" onClick={() => { updateCard(id, { pictogramId: String(pictogram.id), imageUrl: pictogram.imageUrl, accessibleLabel: pictogram.name }); setPictoCardId(null); }}><img src={pictogram.imageUrl} alt="" className="mx-auto h-12 w-12 object-contain" />{pictogram.name}</button>)}</div></div>}</div>; })}</div>
    {data.mode === 'order' && data.acceptedOrders.length > 1 && <div className="space-y-1 rounded-lg border bg-background p-3"><p className="text-xs font-bold">Órdenes alternativos aceptados</p>{data.acceptedOrders.slice(1).map((order, index) => <div key={order.join('|')} className="flex items-center gap-2 text-xs"><span className="flex-1">{order.map(id => cards.get(id)?.text).join(' → ')}</span><Button type="button" size="sm" variant="ghost" onClick={() => update({ acceptedOrders: data.acceptedOrders.filter((_, orderIndex) => orderIndex !== index + 1) })}>Quitar</Button></div>)}</div>}
    {data.mode !== 'order' && <RoundEditor data={data} onChange={onChange} />}
    <div className="flex items-center justify-between"><p role={error ? 'alert' : undefined} className={`text-xs ${error ? 'text-destructive' : 'text-green-700'}`}>{error || 'Configuración válida'}</p><Button type="button" variant="outline" disabled={Boolean(error)} onClick={() => setPreview(value => !value)}>{preview ? 'Cerrar vista previa' : 'Vista previa jugable'}</Button></div>
    {preview && !error && <div className="rounded-xl border bg-background p-4"><MiniGame gameType="routine-sequence" gameData={{ routineSequence: data }} onFinish={() => setPreview(false)} /></div>}
  </div>;
}

function NextRoundEditor({ data, onChange }: { data: RoutineSequenceData; onChange: (data: RoutineSequenceData) => void }) {
  const cards = new Map(data.cards.map(card => [card.id, card]));
  const rounds = data.rounds || [];
  const updateRound = (index: number, patch: Partial<RoutineRound>) => onChange({
    ...data,
    rounds: rounds.map((round, roundIndex) => roundIndex === index ? { ...round, ...patch } : round),
  });
  const addRound = () => {
    const promptStepId = data.stepIds[0] || '';
    const optionIds = data.stepIds.filter(id => id !== promptStepId).slice(0, 3);
    onChange({
      ...data,
      rounds: [...rounds, {
        id: crypto.randomUUID(),
        prompt: '',
        sequenceIds: promptStepId ? [promptStepId] : [],
        optionIds,
        acceptedIds: optionIds.slice(0, 1),
      }],
    });
  };

  return <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-bold">Rondas: ¿Qué viene después?</p>
        <p className="text-[10px] text-muted-foreground">Separá el paso que funciona como enunciado de las opciones de respuesta.</p>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={addRound}>Agregar ronda</Button>
    </div>
    {rounds.map((round, index) => {
      const promptStepId = round.sequenceIds?.[0] || '';
      const optionCards = data.cards.filter(card => card.id !== promptStepId);
      return <div key={round.id} className="space-y-3 rounded-lg border bg-background p-3">
        <div className="flex gap-2">
          <Input placeholder="Consigna opcional de la ronda" value={round.prompt || ''} onChange={event => updateRound(index, { prompt: event.target.value })} />
          <Button type="button" variant="ghost" disabled={rounds.length === 1} onClick={() => onChange({ ...data, rounds: rounds.filter((_, roundIndex) => roundIndex !== index) })}>Quitar</Button>
        </div>
        <label className="block text-xs font-semibold">
          Paso de consigna
          <span className="mt-1 block text-[10px] font-normal text-muted-foreground">Es el paso que se muestra primero y sobre el que se pregunta qué viene después.</span>
          <select
            aria-label={`Paso de consigna de la ronda ${index + 1}`}
            className="mt-1 h-10 w-full rounded-md border bg-background px-2"
            value={promptStepId}
            onChange={event => {
              const nextPromptStepId = event.target.value;
              const optionIds = round.optionIds.filter(id => id !== nextPromptStepId);
              updateRound(index, {
                sequenceIds: nextPromptStepId ? [nextPromptStepId] : [],
                optionIds,
                acceptedIds: round.acceptedIds.filter(id => optionIds.includes(id)),
              });
            }}
          >
            <option value="">Elegí el paso de consigna</option>
            {data.cards.map(card => <option key={card.id} value={card.id}>{card.text}</option>)}
          </select>
        </label>
        <div>
          <p className="text-xs font-semibold">Opciones de pasos</p>
          <p className="mb-1 text-[10px] text-muted-foreground">Elegí entre 2 y 4. El paso de consigna no puede repetirse como opción.</p>
          <div className="grid gap-1 sm:grid-cols-2">
            {optionCards.map(card => <label key={card.id} className="flex min-h-11 items-center gap-2 rounded border p-2 text-xs">
              <input
                type="checkbox"
                checked={round.optionIds.includes(card.id)}
                disabled={!round.optionIds.includes(card.id) && round.optionIds.length >= 4}
                onChange={event => {
                  const optionIds = event.target.checked ? [...round.optionIds, card.id] : round.optionIds.filter(id => id !== card.id);
                  updateRound(index, { optionIds, acceptedIds: round.acceptedIds.filter(id => optionIds.includes(id)) });
                }}
              />
              {card.text}
            </label>)}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold">Opción correcta</p>
          <div className="mt-1 grid gap-1 sm:grid-cols-2">
            {round.optionIds.map(id => <label key={id} className="flex min-h-11 items-center gap-2 rounded border p-2 text-xs">
              <input type="radio" name={`next-correct-${round.id}`} checked={round.acceptedIds[0] === id} onChange={() => updateRound(index, { acceptedIds: [id] })} />
              {cards.get(id)?.text}
            </label>)}
          </div>
        </div>
      </div>;
    })}
  </div>;
}

function MissingRoundEditor({ data, onChange }: { data: RoutineSequenceData; onChange: (data: RoutineSequenceData) => void }) {
  const cards = new Map(data.cards.map(card => [card.id, card]));
  const rounds = data.rounds || [];
  const updateRound = (index: number, patch: Partial<RoutineRound>) => onChange({
    ...data,
    rounds: rounds.map((round, roundIndex) => roundIndex === index ? { ...round, ...patch } : round),
  });
  const addRound = () => {
    const missingStepId = data.stepIds[0] || '';
    const distractorId = data.stepIds.find(id => id !== missingStepId);
    onChange({
      ...data,
      rounds: [...rounds, {
        id: crypto.randomUUID(),
        prompt: '',
        sequenceIds: data.stepIds.filter(id => id !== missingStepId),
        optionIds: [missingStepId, distractorId].filter(Boolean),
        acceptedIds: missingStepId ? [missingStepId] : [],
      }],
    });
  };

  return <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-bold">Rondas: Paso que falta</p>
        <p className="text-[10px] text-muted-foreground">Elegí explícitamente qué paso se oculta en cada ronda.</p>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={addRound}>Agregar ronda</Button>
    </div>
    {rounds.map((round, index) => {
      const missingStepId = round.acceptedIds[0] || '';
      return <div key={round.id} className="space-y-3 rounded-lg border bg-background p-3">
        <div className="flex gap-2">
          <Input placeholder="Consigna opcional de la ronda" value={round.prompt || ''} onChange={event => updateRound(index, { prompt: event.target.value })} />
          <Button type="button" variant="ghost" disabled={rounds.length === 1} onClick={() => onChange({ ...data, rounds: rounds.filter((_, roundIndex) => roundIndex !== index) })}>Quitar</Button>
        </div>
        <label className="block text-xs font-semibold">
          Paso que se va a ocultar
          <span className="mt-1 block text-[10px] font-normal text-muted-foreground">Este paso desaparece de la secuencia y se convierte automáticamente en la respuesta correcta.</span>
          <select
            aria-label={`Paso que se va a ocultar en la ronda ${index + 1}`}
            className="mt-1 h-10 w-full rounded-md border bg-background px-2"
            value={missingStepId}
            onChange={event => {
              const nextMissingId = event.target.value;
              const previousMissingId = round.acceptedIds[0];
              const distractors = round.optionIds.filter(id => id !== previousMissingId && id !== nextMissingId);
              updateRound(index, {
                sequenceIds: data.stepIds.filter(id => id !== nextMissingId),
                optionIds: nextMissingId ? [nextMissingId, ...distractors].slice(0, 4) : distractors,
                acceptedIds: nextMissingId ? [nextMissingId] : [],
              });
            }}
          >
            <option value="">Elegí el paso que falta</option>
            {data.stepIds.map(id => <option key={id} value={id}>{cards.get(id)?.text}</option>)}
          </select>
        </label>
        <div>
          <p className="text-xs font-semibold">Opciones de pasos</p>
          <p className="mb-1 text-[10px] text-muted-foreground">El paso oculto ya está incluido. Elegí entre 1 y 3 distractores.</p>
          <div className="grid gap-1 sm:grid-cols-2">
            {data.cards.map(card => {
              const isMissing = card.id === missingStepId;
              const checked = round.optionIds.includes(card.id);
              return <label key={card.id} className={`flex min-h-11 items-center gap-2 rounded border p-2 text-xs ${isMissing ? 'border-primary/30 bg-primary/5' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isMissing || (!checked && round.optionIds.length >= 4)}
                  onChange={event => {
                    const optionIds = event.target.checked ? [...round.optionIds, card.id] : round.optionIds.filter(id => id !== card.id);
                    updateRound(index, { optionIds });
                  }}
                />
                <span>{card.text}{isMissing ? ' · respuesta correcta' : ''}</span>
              </label>;
            })}
          </div>
        </div>
      </div>;
    })}
  </div>;
}

function DetectiveRoundEditor({ data, onChange }: { data: RoutineSequenceData; onChange: (data: RoutineSequenceData) => void }) {
  const current = data.rounds?.[0] || {
    id: crypto.randomUUID(),
    sequenceIds: data.stepIds,
    optionIds: [],
    acceptedIds: [],
    conflictIds: [],
  };
  const selectedIds = current.conflictIds?.length
    ? current.conflictIds
    : current.conflictId
      ? [current.conflictId]
      : [];
  const updateSelected = (conflictIds: string[]) => onChange({
    ...data,
    rounds: [{
      ...current,
      sequenceIds: data.stepIds,
      conflictId: conflictIds[0],
      conflictIds,
      optionIds: [],
      acceptedIds: [],
      explanation: undefined,
    }],
  });

  return <div className="space-y-3 rounded-lg border bg-background p-3">
    <div>
      <p className="text-sm font-bold">Pasos incorrectos o inseguros</p>
      <p className="mt-1 text-xs text-muted-foreground">Seleccioná uno o varios pasos de la rutina. No se mostrarán opciones de reemplazo.</p>
    </div>
    <div className="grid gap-2 sm:grid-cols-2">
      {data.stepIds.map((id, index) => {
        const card = data.cards.find(item => item.id === id);
        const checked = selectedIds.includes(id);
        return <label key={id} className={`flex min-h-14 items-center gap-3 rounded-lg border p-3 text-sm ${checked ? 'border-destructive/40 bg-destructive/5' : 'border-border'}`}>
          <input
            type="checkbox"
            checked={checked}
            onChange={event => updateSelected(event.target.checked ? [...selectedIds, id] : selectedIds.filter(item => item !== id))}
          />
          <span className="text-lg" aria-hidden="true">{card?.emoji || '📌'}</span>
          <span><span className="block text-[10px] text-muted-foreground">Paso {index + 1}</span>{card?.text}</span>
        </label>;
      })}
    </div>
    {!selectedIds.length && <p className="text-xs text-destructive">Seleccioná al menos un paso incorrecto.</p>}
  </div>;
}

function RoundEditor({ data, onChange }: { data: RoutineSequenceData; onChange: (data: RoutineSequenceData) => void }) {
  if (data.mode === 'next') return <NextRoundEditor data={data} onChange={onChange} />;
  if (data.mode === 'missing') return <MissingRoundEditor data={data} onChange={onChange} />;
  if (data.mode === 'detective') return <DetectiveRoundEditor data={data} onChange={onChange} />;
  if (data.mode === 'plan-b') return <PlanBRoundEditor data={data} onChange={onChange} />;
  const cards = new Map(data.cards.map(card => [card.id, card])); const rounds = data.rounds || [];
  const updateRound = (index: number, patch: Partial<RoutineRound>) => onChange({ ...data, rounds: rounds.map((round, i) => i === index ? { ...round, ...patch } : round) });
  return <div className="space-y-3"><div className="flex items-center justify-between"><p className="text-sm font-bold">Rondas y respuestas</p><Button type="button" size="sm" variant="outline" onClick={() => onChange({ ...data, rounds: [...rounds, { ...rounds[rounds.length - 1], id: crypto.randomUUID(), prompt: '' }] })}>Agregar ronda</Button></div>{rounds.map((round, index) => <div key={round.id} className="space-y-2 rounded-lg border bg-background p-3"><div className="flex gap-2"><Input placeholder="Consigna de la ronda" value={round.prompt || ''} onChange={event => updateRound(index, { prompt: event.target.value })} /><Button type="button" variant="ghost" disabled={rounds.length === 1} onClick={() => onChange({ ...data, rounds: rounds.filter((_, i) => i !== index) })}>Quitar</Button></div>{data.mode === 'detective' && <label className="text-xs">Paso incorrecto o inseguro<select className="ml-2 h-9 rounded border" value={round.conflictId} onChange={event => updateRound(index, { conflictId: event.target.value })}>{round.sequenceIds?.map(id => <option key={id} value={id}>{cards.get(id)?.text}</option>)}</select></label>}<p className="text-xs font-semibold">Opciones (elegí entre 2 y 4)</p><div className="grid gap-1 sm:grid-cols-2">{data.cards.map(card => <label key={card.id} className="flex min-h-11 items-center gap-2 rounded border p-2 text-xs"><input type="checkbox" checked={round.optionIds.includes(card.id)} disabled={!round.optionIds.includes(card.id) && round.optionIds.length >= 4} onChange={event => { const optionIds = event.target.checked ? [...round.optionIds, card.id] : round.optionIds.filter(id => id !== card.id); updateRound(index, { optionIds, acceptedIds: round.acceptedIds.filter(id => optionIds.includes(id)) }); }} />{card.text}</label>)}</div><p className="text-xs font-semibold">Respuestas aceptables</p><div className="grid gap-1 sm:grid-cols-2">{round.optionIds.map(id => <label key={id} className="flex min-h-11 items-center gap-2 rounded border p-2 text-xs"><input type="checkbox" checked={round.acceptedIds.includes(id)} onChange={event => updateRound(index, { acceptedIds: event.target.checked ? [...round.acceptedIds, id] : round.acceptedIds.filter(item => item !== id) })} />{cards.get(id)?.text}</label>)}</div>{(data.mode === 'detective' || data.mode === 'plan-b') && <textarea className="w-full rounded border p-2 text-sm" value={round.explanation || ''} placeholder="Explicación breve, descriptiva y no culpabilizante" onChange={event => updateRound(index, { explanation: event.target.value })} />}</div>)}</div>;
}

function PlanBRoundEditor({ data, onChange }: { data: RoutineSequenceData; onChange: (data: RoutineSequenceData) => void }) {
  const rounds = data.rounds || [];
  const cards = new Map(data.cards.map(card => [card.id, card]));
  const updateRound = (index: number, patch: Partial<RoutineRound>) => onChange({ ...data, rounds: rounds.map((round, i) => i === index ? { ...round, ...patch } : round) });
  const addRound = () => {
    const alternatives = [createRoutineCard('Nueva alternativa'), createRoutineCard('Otra alternativa')];
    onChange({ ...data, cards: [...data.cards, ...alternatives], rounds: [...rounds, { id: crypto.randomUUID(), changedStepId: data.stepIds[0], optionIds: alternatives.map(card => card.id), acceptedIds: [alternatives[0].id], explanation: '' }] });
  };
  const updateAlternative = (id: string, text: string) => onChange({ ...data, cards: data.cards.map(card => card.id === id ? { ...card, text, accessibleLabel: text } : card) });
  const addAlternative = (roundIndex: number) => {
    const card = createRoutineCard('Nueva alternativa');
    onChange({ ...data, cards: [...data.cards, card], rounds: rounds.map((round, index) => index === roundIndex ? { ...round, optionIds: [...round.optionIds, card.id] } : round) });
  };
  const removeAlternative = (roundIndex: number, id: string) => onChange({
    ...data,
    cards: data.cards.filter(card => card.id !== id),
    rounds: rounds.map((round, index) => index === roundIndex ? { ...round, optionIds: round.optionIds.filter(optionId => optionId !== id), acceptedIds: round.acceptedIds.filter(acceptedId => acceptedId !== id) } : round),
  });

  return <div className="space-y-3">
    <div className="flex items-center justify-between"><div><p className="text-sm font-bold">Rondas de Plan B</p><p className="text-[10px] text-muted-foreground">Elegí el paso que cambia y agregá alternativas que no formen parte de la rutina.</p></div><Button type="button" size="sm" variant="outline" onClick={addRound}>Agregar ronda</Button></div>
    {rounds.map((round, index) => <div key={round.id} className="space-y-3 rounded-lg border bg-background p-3">
      <div className="flex items-end gap-2"><label className="flex-1 text-xs font-semibold">Paso que hoy no se puede realizar<select className="mt-1 h-10 w-full rounded-md border bg-background px-2" value={round.changedStepId || ''} onChange={event => updateRound(index, { changedStepId: event.target.value })}><option value="">Elegí un paso</option>{data.stepIds.map(id => <option key={id} value={id}>{cards.get(id)?.text}</option>)}</select></label><Button type="button" variant="ghost" disabled={rounds.length === 1} onClick={() => onChange({ ...data, rounds: rounds.filter((_, i) => i !== index) })}>Quitar</Button></div>
      {round.changedStepId && <p className="rounded-lg bg-primary/5 p-2 text-sm">Hoy no se puede seguir el paso <strong>“{cards.get(round.changedStepId)?.text}”</strong>. ¿Qué otra alternativa existe?</p>}
      <div className="rounded-lg border bg-muted/30 p-2" aria-label="Vista compacta de la rutina"><p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Rutina completa</p><div className="flex flex-wrap items-center gap-1">{data.stepIds.map((id, stepIndex) => { const card = cards.get(id); const changed = id === round.changedStepId; return <div key={id} className="flex items-center gap-1"><div className={`flex max-w-36 items-center gap-1 rounded-md border px-2 py-1 text-xs ${changed ? 'border-destructive bg-destructive/10 text-destructive' : 'bg-background'}`}><span aria-hidden="true">{card?.emoji || '📌'}</span><span className="truncate">{card?.text}</span>{changed && <span className="sr-only"> (paso que no se puede realizar)</span>}</div>{stepIndex < data.stepIds.length - 1 && <span className="text-muted-foreground" aria-hidden="true">→</span>}</div>; })}</div></div>
      <div className="flex items-center justify-between"><p className="text-xs font-semibold">Alternativas nuevas (2 a 4)</p><Button type="button" size="sm" variant="outline" disabled={round.optionIds.length >= 4} onClick={() => addAlternative(index)}>Agregar alternativa</Button></div>
      <div className="space-y-2">{round.optionIds.map(id => <div key={id} className="flex items-center gap-2"><Input aria-label="Texto de la alternativa" placeholder="Ej.: Salir a correr" value={cards.get(id)?.text || ''} onChange={event => updateAlternative(id, event.target.value)} /><label className="flex min-h-10 items-center gap-1 text-xs"><input type="radio" name={`plan-b-correct-${round.id}`} checked={round.acceptedIds[0] === id} onChange={() => updateRound(index, { acceptedIds: [id] })} /> Correcta</label><Button type="button" size="sm" variant="ghost" disabled={round.optionIds.length <= 2} onClick={() => removeAlternative(index, id)}>Quitar</Button></div>)}</div>
      <textarea className="w-full rounded border p-2 text-sm" value={round.explanation || ''} placeholder="Explicación breve de por qué la alternativa funciona" onChange={event => updateRound(index, { explanation: event.target.value })} />
    </div>)}
  </div>;
}
