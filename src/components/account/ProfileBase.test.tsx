import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { ReactElement } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { ShieldCheck, Users } from 'lucide-react';
import { ProfileBase, type ProfileBaseProps } from './ProfileLayout';

afterEach(() => cleanup());

const avatar: ReactElement = <div data-testid="hero-avatar" />;
const onSettings = vi.fn();

const pertenecienteProps = (): ProfileBaseProps => ({
  hero: {
    avatar,
    name: 'Juan Pered',
    username: 'juanp',
    roleLabel: 'Perteneciente',
    secondary: <span>monedas</span>,
    metrics: [{ label: 'Nivel', value: 2 }, { label: 'Puntos', value: 30 }, { label: 'Experiencia', value: 100 }],
    onSettings,
  },
  data: {
    items: [
      { label: 'Correo', value: 'juan@tandem.app' },
      { label: 'Teléfono', value: '11 2233 4455' },
      { label: 'Fecha de nacimiento', value: '1/1/2000' },
      { label: 'Usuario', value: '@juanp' },
    ],
  },
  roleSection: {
    title: 'Mi autonomía',
    description: 'Tu configuración de apoyo',
    icon: ShieldCheck,
    children: <p>Nivel de apoyo</p>,
  },
  relations: {
    title: 'Mi red de apoyo',
    description: 'Tutores y profesionales vinculados',
    icon: Users,
    items: [{ id: 1, name: 'Pablo Rodríguez', detail: 'Tutor · Activo' }],
    emptyText: 'Todavía no hay vínculos de apoyo.',
  },
});

const tutorProps = (): ProfileBaseProps => ({
  hero: {
    avatar,
    name: 'Pablo Rodríguez',
    username: 'pablor',
    roleLabel: 'Tutor',
    metrics: [{ label: 'Vinculados', value: 1 }, { label: 'Correo', value: 'Verificado' }],
    onSettings,
  },
  data: {
    items: [
      { label: 'Correo', value: 'pablo@tandem.app' },
      { label: 'Teléfono', value: '11 9999 8888' },
      { label: 'Usuario', value: '@pablor' },
      { label: 'Relación', value: 'Padre' },
    ],
  },
  relations: {
    title: 'Personas vinculadas',
    description: 'Personas que acompañás actualmente',
    icon: Users,
    action: <button type="button">Ver todos</button>,
    items: [{ id: 1, name: 'Juan Pered', detail: 'Medio · Asistida · Activo' }],
    emptyText: 'Todavía no hay pertenecientes vinculados.',
  },
});

/** Huella visual compartida: botones, badges y tarjetas deben ser idénticos entre roles. */
function captureVisuals(roleLabel: string, relationsTitle: string) {
  const dataCard = screen.getByRole('heading', { level: 2, name: 'Mis datos' }).closest('section');
  const relationsCard = screen.getByRole('heading', { level: 2, name: relationsTitle }).closest('section');
  return {
    settingsButton: screen.getByRole('button', { name: 'Configuración' }).className,
    roleBadge: screen.getByText(roleLabel).className,
    dataCard: dataCard?.className ?? '',
    dataCells: Array.from(dataCard?.querySelectorAll('div[class*="rounded-2xl"]') ?? []).map(cell => cell.className),
    relationsCard: relationsCard?.className ?? '',
    relationItems: Array.from(relationsCard?.querySelectorAll('div[class*="rounded-2xl"]') ?? []).map(item => item.className),
  };
}

it('ordena el perfil en encabezado, mis datos, sección del rol y red de apoyo', () => {
  render(<ProfileBase {...pertenecienteProps()} />);

  expect(screen.getByRole('heading', { level: 1, name: 'Juan Pered' })).toBeInTheDocument();
  expect(screen.getByText('Perteneciente')).toBeInTheDocument();
  expect(screen.getByTestId('hero-avatar')).toBeInTheDocument();
  expect(screen.getAllByRole('heading', { level: 2 }).map(heading => heading.textContent)).toEqual([
    'Mis datos',
    'Mi autonomía',
    'Mi red de apoyo',
  ]);
});

it('mantiene la misma estética de tarjetas, badges y botones en tutor y perteneciente', () => {
  render(<ProfileBase {...pertenecienteProps()} />);
  const perteneciente = captureVisuals('Perteneciente', 'Mi red de apoyo');

  cleanup();
  render(<ProfileBase {...tutorProps()} />);
  const tutor = captureVisuals('Tutor', 'Personas vinculadas');

  expect(tutor.settingsButton).toBe(perteneciente.settingsButton);
  expect(tutor.roleBadge).toBe(perteneciente.roleBadge);
  expect(tutor.dataCard).toBe(perteneciente.dataCard);
  expect(tutor.dataCells).toEqual(perteneciente.dataCells);
  expect(tutor.relationsCard).toBe(perteneciente.relationsCard);
  expect(tutor.relationItems).toEqual(perteneciente.relationItems);
});

it('el perfil sin sección específica del rol mantiene "Mis datos" y la red de apoyo', () => {
  render(<ProfileBase {...tutorProps()} />);

  expect(screen.getAllByRole('heading', { level: 2 }).map(heading => heading.textContent)).toEqual([
    'Mis datos',
    'Personas vinculadas',
  ]);
  expect(screen.getByRole('button', { name: 'Ver todos' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { level: 2, name: 'Mi autonomía' })).not.toBeInTheDocument();
});

it('ubica las secciones extra del rol entre los datos y la red de apoyo con la misma tarjeta', () => {
  render(
    <ProfileBase
      {...pertenecienteProps()}
      extraSections={[{ title: 'Perfil público', description: 'Contenido del directorio', icon: ShieldCheck, children: <p>Presentación</p> }]}
    />,
  );

  expect(screen.getAllByRole('heading', { level: 2 }).map(heading => heading.textContent)).toEqual([
    'Mis datos',
    'Mi autonomía',
    'Perfil público',
    'Mi red de apoyo',
  ]);
  const dataCard = screen.getByRole('heading', { level: 2, name: 'Mis datos' }).closest('section');
  const extraCard = screen.getByRole('heading', { level: 2, name: 'Perfil público' }).closest('section');
  expect(extraCard?.className).toBe(dataCard?.className);
});
