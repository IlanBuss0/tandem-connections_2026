import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BelongingRoutineStep from './BelongingRoutineStep';

vi.mock('@/components/SpeakButton', () => ({ default: () => null }));
vi.mock('@/components/StartTaskHint', () => ({ default: () => null }));
const item = { id: 's1', title: 'Revisá el horario y guardá los útiles para mañana.', pictogramLabel: 'Preparar la mochila', pictogramImageUrl: '/mochila.png', pictogramName: 'Mochila', time: '08:00', category: 'mañana', completed: true, icon: '🎒' };

describe('Tarjeta de paso de rutina', () => {
  it('conserva legibles el nombre y la instrucción de un paso completado, con pictograma grande', () => {
    const { container } = render(<ol><BelongingRoutineStep item={item} position={3} next={false} selected={false} visual={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} /></ol>);
    expect(screen.getByText('Paso 3')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Preparar la mochila' })).toBeInTheDocument();
    expect(screen.getByText(item.title)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Mochila' })).toHaveClass('h-16', 'w-16');
    expect(screen.getByText('Completado')).toBeInTheDocument();
    expect(container.querySelector('[class*="line-through"]')).toBeNull();
  });

  it('mantiene las acciones del paso también en la vista de pictogramas', () => {
    const toggle = vi.fn(), edit = vi.fn(), remove = vi.fn();
    render(<ol><BelongingRoutineStep item={{ ...item, completed: false }} position={3} next selected={false} visual onToggle={toggle} onEdit={edit} onDelete={remove} /></ol>);
    expect(screen.getByRole('listitem')).toHaveAttribute('aria-current', 'step');
    fireEvent.click(screen.getByRole('button', { name: `Marcar completado: ${item.title}` }));
    fireEvent.click(screen.getByRole('button', { name: `Editar paso: ${item.title}` }));
    fireEvent.click(screen.getByRole('button', { name: `Eliminar paso: ${item.title}` }));
    expect(toggle).toHaveBeenCalledOnce();
    expect(edit).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
  });
});
