import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { expect, it, vi } from 'vitest';
import ReportReader from './ReportReader';

it('muestra contenido, aviso y acciones provistas por el contenedor', () => {
  render(
    <ReportReader
      title="Reporte"
      subtitle="Juan"
      content="Primera linea\nSegunda linea"
      onClose={vi.fn()}
      notice={<p>Revisar antes de enviar</p>}
      footer={<button type="button">Descargar PDF</button>}
    />,
  );
  expect(screen.getByText('Primera linea', { exact: false })).toHaveClass('whitespace-pre-wrap');
  expect(screen.getByText('Revisar antes de enviar')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Descargar PDF' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Enviar al tutor' })).not.toBeInTheDocument();
});
