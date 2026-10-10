import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, it, vi } from 'vitest';
import { ProfessionalDrawer, ProfessionalQuickMenu } from './ProfessionalNavigation';

afterEach(() => cleanup());

it('filtra navegacion y acciones segun permisos profesionales', () => {
  render(
    <>
      <ProfessionalDrawer
        open active="home" permissions={{ sessions: false, activities: false, chat: false }}
        onClose={vi.fn()} onNavigate={vi.fn()} onLogout={vi.fn()}
      />
      <ProfessionalQuickMenu
        open onOpenChange={vi.fn()} compactProgress={0}
        permissions={{ sessions: false, activities: false, chat: false }} onAction={vi.fn()}
      />
    </>,
  );
  expect(screen.queryByRole('button', { name: 'Calendario y sesiones' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Chats' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Crear actividad' })).not.toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Recursos y herramientas' })).toHaveLength(2);
});
