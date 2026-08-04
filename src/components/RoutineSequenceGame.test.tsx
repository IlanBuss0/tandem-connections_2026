import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RoutineSequenceGame from './RoutineSequenceGame';
import type { RoutineSequenceData } from '@/data/routineSequence';

const cards = [{ id: 'a', text: 'Primero', emoji: '1️⃣' }, { id: 'b', text: 'Después', emoji: '2️⃣' }, { id: 'c', text: 'Final', emoji: '3️⃣' }, { id: 'd', text: 'Pedir ayuda', emoji: '🤝' }];
const common = { schemaVersion: 1 as const, prompt: 'Consigna accesible', supportLevel: 'initial' as const, cards, stepIds: ['a','b','c'], acceptedOrders: [['a','b','c']], hintsEnabled: true };
const dataFor = (mode: RoutineSequenceData['mode']): RoutineSequenceData => mode === 'order' ? { ...common, mode } : {
  ...common, mode, rounds: [{ id: 'r1', sequenceIds: mode === 'plan-b' ? [] : ['a','b','c'], optionIds: ['c','d'], acceptedIds: ['d'], conflictId: mode === 'detective' ? 'b' : undefined, explanation: mode === 'detective' || mode === 'plan-b' ? 'Una explicación neutral.' : undefined }],
};

describe.each(['order','next','missing','detective','plan-b'] as const)('RoutineSequenceGame %s', (mode) => {
  it('renders an operable accessible activity', () => {
    render(<RoutineSequenceGame data={dataFor(mode)} onFinish={vi.fn()} />);
    expect(screen.getByText('Consigna accesible')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pista 1/i })).toBeInTheDocument();
    if (mode === 'order') expect(screen.getByRole('button', { name: /verificar orden/i })).toBeInTheDocument();
    if (mode === 'detective') expect(screen.getByRole('button', { name: /revisar este paso/i })).toBeDisabled();
  });
});
