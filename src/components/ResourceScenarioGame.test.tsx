import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ResourceScenarioGame from './ResourceScenarioGame';

describe('ResourceScenarioGame', () => {
  it('applies a choice, warns at a resource limit and reports the score', () => {
    const onFinish = vi.fn();
    render(<ResourceScenarioGame data={{
      startNodeId: 'start',
      resources: [{ id: 'energy', name: 'Energía', icon: '⚡', min: 0, max: 10, initial: 9 }],
      nodes: [
        { id: 'start', prompt: 'Elegí', terminal: false, options: [
          { id: 'rest', label: 'Descansar', feedback: 'Buena elección', score: 80, resourceDeltas: { energy: 5 }, nextNodeId: 'end' },
          { id: 'continue', label: 'Seguir', score: 40, resourceDeltas: { energy: -2 }, nextNodeId: 'end' },
        ] },
        { id: 'end', prompt: 'Llegaste al final', terminal: true, options: [] },
      ],
    }} onFinish={onFinish} />);

    fireEvent.click(screen.getByRole('button', { name: /Descansar/ }));
    expect(screen.getByText('Buena elección')).toBeInTheDocument();
    expect(screen.getByText('Energía llegó a su límite.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    expect(screen.getByText('Resultado: 80/100')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Finalizar actividad/ }));
    expect(onFinish).toHaveBeenCalledWith(80);
  });
});
