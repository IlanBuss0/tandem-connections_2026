import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { expect, it } from 'vitest';
import PictogramImage from './PictogramImage';

it('recupera la imagen al cambiar la URL despues de un error', () => {
  const props = { alt: 'Actividad', imageClassName: 'h-8', fallbackClassName: 'h-5' };
  const { rerender } = render(<PictogramImage {...props} url="/uno.png" />);
  fireEvent.error(screen.getByRole('img', { name: 'Actividad' }));
  expect(screen.queryByRole('img', { name: 'Actividad' })).not.toBeInTheDocument();
  rerender(<PictogramImage {...props} url="/dos.png" />);
  expect(screen.getByRole('img', { name: 'Actividad' })).toHaveAttribute('src', '/dos.png');
});
