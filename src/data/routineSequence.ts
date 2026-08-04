export type RoutineSequenceMode = 'order' | 'next' | 'missing' | 'detective' | 'plan-b';
export type RoutineSupportLevel = 'initial' | 'intermediate' | 'advanced';

export interface RoutineCard { id: string; text: string; emoji?: string; pictogramId?: string; imageUrl?: string; accessibleLabel?: string; }
export interface RoutineRound { id: string; prompt?: string; sequenceIds?: string[]; optionIds: string[]; acceptedIds: string[]; conflictId?: string; explanation?: string; }
export interface RoutineSequenceData {
  schemaVersion: 1; mode: RoutineSequenceMode; prompt: string; supportLevel: RoutineSupportLevel;
  cards: RoutineCard[]; stepIds: string[]; acceptedOrders: string[][]; rounds?: RoutineRound[]; hintsEnabled: boolean;
  sourceRoutine?: { routineId: string; routineName: string; copiedAt: string; sourceUserId?: string };
}
export interface RoutineSequenceResult {
  executionId: string; gameType: 'routine-sequence'; mode: RoutineSequenceMode; score: number;
  attempts: number; hintsUsed: number; durationMs: number; conflictStepIds: string[];
}

export function emptyRoutineSequence(): RoutineSequenceData {
  const cards = ['Primer paso','Segundo paso','Tercer paso'].map(text => createRoutineCard(text));
  return { schemaVersion: 1, mode: 'order', prompt: 'Ordená los pasos de la rutina', supportLevel: 'initial', cards, stepIds: cards.map(card => card.id), acceptedOrders: [cards.map(card => card.id)], hintsEnabled: true };
}

export function createRoutineCard(text = '', emoji = '📌', id: string = crypto.randomUUID()): RoutineCard {
  return { id, text, emoji, accessibleLabel: text };
}
export function normalizeLegacySequence(sequence?: { prompt: string; steps: string[] }): RoutineSequenceData | null {
  if (!sequence?.steps?.length) return null;
  const cards = sequence.steps.map((text, index) => createRoutineCard(text, '📌', `legacy-step-${index + 1}`));
  const stepIds = cards.map(card => card.id);
  return { schemaVersion: 1, mode: 'order', prompt: sequence.prompt || 'Ordená los pasos', supportLevel: 'initial', cards, stepIds, acceptedOrders: [stepIds], hintsEnabled: true };
}
export function validateRoutineSequence(data?: RoutineSequenceData | null): string | null {
  if (!data || data.schemaVersion !== 1) return 'La versión de la secuencia no es válida.';
  if (!['order', 'next', 'missing', 'detective', 'plan-b'].includes(data.mode)) return 'El modo no es válido.';
  if (!data.prompt?.trim()) return 'La consigna es obligatoria.';
  if (data.stepIds.length < 3 || data.stepIds.length > 8) return 'La rutina debe tener entre 3 y 8 pasos.';
  const ids = new Set(data.cards.map(card => card.id));
  if (ids.size !== data.cards.length || data.cards.some(card => !card.id || !card.text.trim())) return 'Cada tarjeta necesita ID único y texto.';
  if (data.stepIds.some(id => !ids.has(id)) || new Set(data.stepIds).size !== data.stepIds.length) return 'Los pasos contienen referencias inválidas.';
  if (!data.acceptedOrders.length) return 'Debe existir al menos un orden válido.';
  const canonical = [...data.stepIds].sort().join('|');
  if (data.acceptedOrders.some(order => order.length !== data.stepIds.length || [...order].sort().join('|') !== canonical)) return 'Cada orden válido debe incluir todos los pasos una sola vez.';
  if (data.mode !== 'order') {
    if (!data.rounds?.length) return 'El modo necesita al menos una ronda.';
    for (const round of data.rounds) {
      if (round.optionIds.length < 2 || round.optionIds.length > 4 || new Set(round.optionIds).size !== round.optionIds.length) return 'Cada ronda necesita entre 2 y 4 opciones distintas.';
      if (!round.acceptedIds.length || round.acceptedIds.some(id => !round.optionIds.includes(id))) return 'Cada ronda necesita una respuesta aceptable incluida en sus opciones.';
      if ([...(round.sequenceIds || []), ...round.optionIds].some(id => !ids.has(id))) return 'Una ronda referencia tarjetas inexistentes.';
      if ((data.mode === 'detective' || data.mode === 'plan-b') && !round.explanation?.trim()) return 'La explicación descriptiva es obligatoria.';
      if (data.mode === 'detective' && (!round.conflictId || !(round.sequenceIds || []).includes(round.conflictId))) return 'Detective necesita identificar el paso conflictivo.';
    }
  }
  return null;
}
export function routineScore(attempts: number, hintsUsed: number): number { return Math.max(40, 100 - Math.max(0, attempts - 1) * 10 - Math.max(0, hintsUsed) * 5); }

export function snapshotRoutine(routine: { id: string; name: string; items: Array<{ title: string; icon?: string; pictogramId?: string; pictogramImageUrl?: string; pictogramLabel?: string }> }, sourceUserId: string, start: number, endInclusive: number) {
  const selected = routine.items.slice(Math.max(0, start), Math.min(routine.items.length, endInclusive + 1)).slice(0, 8);
  if (selected.length < 3) throw new Error('La instantánea necesita entre 3 y 8 pasos.');
  const cards: RoutineCard[] = selected.map(item => ({ id: crypto.randomUUID(), text: item.title, emoji: item.icon || '📌', pictogramId: item.pictogramId, imageUrl: item.pictogramImageUrl, accessibleLabel: item.pictogramLabel || item.title }));
  return { cards, stepIds: cards.map(card => card.id), sourceRoutine: { routineId: routine.id, routineName: routine.name, copiedAt: new Date().toISOString(), sourceUserId } };
}
