import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RoutineSequenceGame from './RoutineSequenceGame';
import type { RoutineSequenceData } from '@/data/routineSequence';

const cards = [
  { id: 'a', text: 'Primero', emoji: '1️⃣' },
  { id: 'b', text: 'Después', emoji: '2️⃣' },
  { id: 'c', text: 'Final', emoji: '3️⃣' },
  { id: 'd', text: 'Pedir ayuda', emoji: '🤝' },
  { id: 'e', text: 'Salir a correr', emoji: '🏃' },
  { id: 'f', text: 'Leer un libro', emoji: '📖' },
];
const common = {
  schemaVersion: 1 as const,
  prompt: 'Consigna accesible',
  supportLevel: 'initial' as const,
  cards,
  stepIds: ['a', 'b', 'c'],
  acceptedOrders: [['a', 'b', 'c']],
  hintsEnabled: true,
};

const dataFor = (mode: RoutineSequenceData['mode']): RoutineSequenceData => {
  if (mode === 'order') return { ...common, mode };
  if (mode === 'next') return { ...common, mode, rounds: [{ id: 'r1', sequenceIds: ['a'], optionIds: ['c', 'd'], acceptedIds: ['d'] }] };
  if (mode === 'missing') return { ...common, mode, rounds: [{ id: 'r1', sequenceIds: ['a', 'c'], optionIds: ['b', 'd'], acceptedIds: ['b'] }] };
  return {
    ...common,
    mode,
    rounds: [{
      id: 'r1',
      sequenceIds: mode === 'plan-b' ? [] : ['a', 'b', 'c'],
      optionIds: mode === 'plan-b' ? ['e', 'f'] : ['c', 'd'],
      acceptedIds: [mode === 'plan-b' ? 'e' : 'd'],
      changedStepId: mode === 'plan-b' ? 'b' : undefined,
      conflictId: mode === 'detective' ? 'b' : undefined,
      explanation: 'Una explicación neutral.',
    }],
  };
};

describe.each(['order', 'next', 'missing', 'detective', 'plan-b'] as const)('RoutineSequenceGame %s', (mode) => {
  it('renders an operable accessible activity', () => {
    render(<RoutineSequenceGame data={dataFor(mode)} onFinish={vi.fn()} />);
    expect(screen.getByText(mode === 'plan-b' ? /Hoy no se puede seguir el paso.*Después.*¿Qué otra alternativa existe?/ : 'Consigna accesible')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pista 1/i })).toBeInTheDocument();
    if (mode === 'order') expect(screen.getByRole('button', { name: /verificar orden/i })).toBeInTheDocument();
    if (mode === 'detective') expect(screen.getByRole('button', { name: /revisar pasos seleccionados/i })).toBeDisabled();
    if (mode === 'plan-b') expect(screen.getByLabelText('Rutina completa')).toHaveTextContent(/Primero.*Después.*Final/);
  });
});
