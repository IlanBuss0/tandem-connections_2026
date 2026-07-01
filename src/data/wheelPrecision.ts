import type { LegacyWheelItem, WheelItem, WheelRound } from './miniGames';

export const DEFAULT_WHEEL_SETTINGS = { segments: 6, initialSpeed: 3, speedIncrease: true } as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function isLegacyWheel(wheel: WheelItem | LegacyWheelItem | undefined): wheel is LegacyWheelItem {
  return Boolean(wheel && 'words' in wheel);
}

export function normalizeWheel(wheel: WheelItem | LegacyWheelItem | undefined): WheelItem {
  if (isLegacyWheel(wheel)) {
    const words = wheel.words.map(word => word.trim()).filter(Boolean);
    const segments = clamp(words.length || 4, 4, 8);
    const source = words.length ? words : ['Opción 1'];
    return {
      settings: { segments, initialSpeed: 3, speedIncrease: false },
      rounds: words.map((word, roundIndex) => {
        const options = Array.from({ length: segments }, (_, offset) => source[(roundIndex + offset) % source.length] || '—');
        return { targetWord: word, image: word, options, correct: 0 };
      }),
    };
  }

  const settings = {
    segments: clamp(Math.round(Number(wheel?.settings?.segments) || DEFAULT_WHEEL_SETTINGS.segments), 4, 8),
    initialSpeed: clamp(Math.round(Number(wheel?.settings?.initialSpeed) || DEFAULT_WHEEL_SETTINGS.initialSpeed), 1, 5),
    speedIncrease: wheel?.settings?.speedIncrease ?? DEFAULT_WHEEL_SETTINGS.speedIncrease,
  };
  const rounds = (wheel?.rounds || []).map(round => normalizeRound(round, settings.segments));
  return { settings, rounds };
}

export function normalizeRound(round: Partial<WheelRound>, segments: number): WheelRound {
  const size = clamp(Math.round(segments), 4, 8);
  const options = Array.from({ length: size }, (_, index) => round.options?.[index] || '');
  const correct = clamp(Math.round(Number(round.correct) || 0), 0, size - 1);
  const image = round.image || options[correct] || '';
  if (image) options[correct] = image;
  return { targetWord: round.targetWord?.trim() || '', image, options, correct };
}

export function serializeWheel(wheel: WheelItem | LegacyWheelItem | undefined): string {
  const normalized = normalizeWheel(wheel);
  const header = `#segments=${normalized.settings.segments}|speed=${normalized.settings.initialSpeed}|increase=${normalized.settings.speedIncrease}`;
  return [header, ...normalized.rounds.map(round => `${round.targetWord}|${round.image}|${round.options.join(',')}|${round.correct}`)].join('\n');
}

export function parseWheel(text: string): WheelItem {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const header = lines[0]?.startsWith('#') ? lines.shift()! : '';
  const values = Object.fromEntries(header.slice(1).split('|').map(part => part.split('=')));
  const settings = {
    segments: clamp(Number(values.segments) || DEFAULT_WHEEL_SETTINGS.segments, 4, 8),
    initialSpeed: clamp(Number(values.speed) || DEFAULT_WHEEL_SETTINGS.initialSpeed, 1, 5),
    speedIncrease: values.increase === undefined ? DEFAULT_WHEEL_SETTINGS.speedIncrease : values.increase === 'true',
  };
  const rounds = lines.map(line => {
    const [targetWord = '', image = '', options = '', correct = '0'] = line.split('|');
    return normalizeRound({ targetWord, image, options: options.split(',').map(value => value.trim()), correct: Number(correct) }, settings.segments);
  });
  return { settings, rounds };
}

export function wheelValidationError(wheel: WheelItem | LegacyWheelItem | undefined): string | null {
  const normalized = normalizeWheel(wheel);
  if (!normalized.rounds.length) return 'Agregá al menos una ronda.';
  for (const [index, round] of normalized.rounds.entries()) {
    if (!round.targetWord) return `Falta la palabra objetivo en la ronda ${index + 1}.`;
    if (round.targetWord.includes('|')) return `La palabra de la ronda ${index + 1} no puede contener |.`;
    if (round.options.length !== normalized.settings.segments || round.options.some(option => !option)) return `Completá los ${normalized.settings.segments} pictogramas de la ronda ${index + 1}.`;
    if ([round.image, ...round.options].some(value => value.includes('|') || value.includes(','))) return `Los pictogramas de la ronda ${index + 1} contienen un separador no permitido.`;
  }
  return null;
}

export function selectedWheelSegment(angle: number, segments: number): number {
  const slice = 360 / segments;
  const normalized = ((-angle % 360) + 360) % 360;
  return Math.floor((normalized + slice / 2) / slice) % segments;
}

export function wheelSegmentAngles(index: number, segments: number) {
  const slice = 360 / segments;
  const center = index * slice;
  return { start: center - slice / 2, center, end: center + slice / 2 };
}

export function wheelScore(attempts: number[]): number {
  if (!attempts.length) return 0;
  return Math.round(attempts.reduce((sum, count) => sum + 100 / Math.max(1, count), 0) / attempts.length);
}
