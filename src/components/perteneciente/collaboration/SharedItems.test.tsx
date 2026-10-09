import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { expect, it, vi } from 'vitest';
import type { SharedSupportAgreement, SharedSupportObjective } from '@/data/api';
import AgreementRow from './AgreementRow';
import FeedAgreementItem from './FeedAgreementItem';
import ObjectiveRow from './ObjectiveRow';
import FeedObjectiveItem from './FeedObjectiveItem';

const agreement: SharedSupportAgreement = {
  id: 1,
  id_perteneciente: 2,
  id_usuario_creador: 3,
  texto: 'Pedir ayuda',
  completado: true,
  fecha_creacion: new Date().toISOString(),
  fecha_actualizacion: new Date().toISOString(),
};

it('conserva el tachado exclusivo del acuerdo en el feed', () => {
  const onToggle = vi.fn();
  const { rerender } = render(<AgreementRow agreement={agreement} disabled={false} onToggle={onToggle} />);
  expect(screen.getByText('Pedir ayuda')).not.toHaveClass('line-through');
  fireEvent.click(screen.getByRole('checkbox'));
  expect(onToggle).toHaveBeenCalledTimes(1);
  rerender(<FeedAgreementItem agreement={agreement} disabled={false} onToggle={onToggle} />);
  expect(screen.getByText('Pedir ayuda')).toHaveClass('line-through');
});

const objective: SharedSupportObjective = {
  id: 1,
  id_perteneciente: 2,
  id_usuario_creador: 3,
  titulo: 'Caminar',
  descripcion: null,
  progreso: 25,
  estado: 'activo',
  fecha_creacion: new Date().toISOString(),
  fecha_actualizacion: new Date().toISOString(),
};

it('permite guardar progreso y completar desde ambos contenedores', () => {
  for (const Component of [ObjectiveRow, FeedObjectiveItem]) {
    const onCommit = vi.fn();
    const onComplete = vi.fn();
    const { unmount } = render(<Component objective={objective} disabled={false} showButtons onCommit={onCommit} onComplete={onComplete} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '40' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar 40%' }));
    expect(onCommit).toHaveBeenCalledWith(40);
    fireEvent.click(screen.getByRole('button', { name: 'Completar' }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    unmount();
  }
});

it('mantiene la presentacion propia del objetivo completado en el feed', () => {
  render(<FeedObjectiveItem objective={{ ...objective, estado: 'completado' }} disabled={false} showButtons onCommit={vi.fn()} onComplete={vi.fn()} />);
  expect(screen.getByText('Objetivo completado')).toBeInTheDocument();
  expect(screen.queryByRole('slider')).not.toBeInTheDocument();
});
