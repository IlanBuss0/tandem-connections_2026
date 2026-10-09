import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { ReactElement } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import BelongingProfileAccountPanel from '@/components/belonging/BelongingProfileAccountPanel';
import { ProfessionalAccountMenu } from '@/components/professional/ProfessionalNavigation';
import { TutorAccountMenu } from '@/components/tutor/TutorNavigation';

afterEach(() => cleanup());

const user = { name: 'Juan Pered', avatar: null };

/** Los ids de Radix y el texto de rol cambian entre menús: se normalizan para comparar el markup. */
const normalize = (html: string) => html
  .replace(/radix-[^"\s>]*/g, 'ID')
  .replace(/Perteneciente|Tutor|Profesional/, 'ROL');

/** Renderiza un menú abierto y captura su marca visual para poder compararla. */
function captureMenu(node: ReactElement) {
  render(node);
  const menu = screen.getByRole('menu');
  const items = Array.from(menu.querySelectorAll('[role="menuitem"]')).map(item => ({
    text: item.textContent ?? '',
    className: item.getAttribute('class') ?? '',
    icon: item.querySelector('svg')?.getAttribute('class') ?? '',
  }));
  const captured = { html: normalize(menu.outerHTML), className: menu.className, items };
  cleanup();
  return captured;
}

const belongingMenu = () => (
  <BelongingProfileAccountPanel open onOpenChange={vi.fn()} user={user} onNavigate={vi.fn()} onLogout={vi.fn()} />
);
const tutorMenu = () => (
  <TutorAccountMenu open onOpenChange={vi.fn()} user={user} onNavigate={vi.fn()} onLogout={vi.fn()} />
);
const professionalMenu = () => (
  <ProfessionalAccountMenu open onOpenChange={vi.fn()} user={user} onNavigate={vi.fn()} onLogout={vi.fn()} />
);

it('el menú del perteneciente replica exactamente la estructura del menú del tutor', () => {
  const belonging = captureMenu(belongingMenu());
  const tutor = captureMenu(tutorMenu());

  expect(belonging.className).toBe(tutor.className);
  expect(belonging.items).toEqual(tutor.items);
  expect(belonging.items.map(item => item.text)).toEqual([
    'Mi perfil',
    'Configuración',
    'Acerca de TÁNDEM',
    'Cerrar sesión',
  ]);
  // Mismo ancho, sombra, bordes, tipografía, márgenes y separadores.
  expect(belonging.html).toBe(tutor.html);
});

it('el menú profesional conserva la misma estética y sus opciones', () => {
  const professional = captureMenu(professionalMenu());
  const tutor = captureMenu(tutorMenu());

  expect(professional.className).toBe(tutor.className);
  expect(professional.items).toEqual(tutor.items);
  expect(professional.html).toBe(tutor.html);
});

it('muestra la foto, el nombre y el rol del perteneciente sin botón "Mi perfil" en el encabezado', () => {
  render(belongingMenu());
  const menu = screen.getByRole('menu');

  expect(within(menu).getByText('Juan Pered')).toBeInTheDocument();
  expect(within(menu).getByText('Perteneciente')).toBeInTheDocument();
  expect(within(menu).queryByRole('button', { name: /Mi perfil/i })).not.toBeInTheDocument();
  expect(within(menu).getByRole('menuitem', { name: 'Mi perfil' })).toBeInTheDocument();
});

it('mantiene la navegación y el cierre de sesión del perteneciente', () => {
  const onNavigate = vi.fn();
  const onLogout = vi.fn();
  const onOpenChange = vi.fn();
  render(
    <BelongingProfileAccountPanel
      open
      onOpenChange={onOpenChange}
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
    />,
  );

  const menu = screen.getByRole('menu');

  fireEvent.click(within(menu).getByText('Mi perfil'));
  expect(onNavigate).toHaveBeenLastCalledWith('profile');

  fireEvent.click(within(menu).getByText('Configuración'));
  expect(onNavigate).toHaveBeenLastCalledWith('profile-settings');

  fireEvent.click(within(menu).getByText('Acerca de TÁNDEM'));
  expect(onNavigate).toHaveBeenLastCalledWith('about');

  fireEvent.click(within(menu).getByText('Cerrar sesión'));
  expect(onLogout).toHaveBeenCalledTimes(1);
  expect(onOpenChange).toHaveBeenLastCalledWith(false);
});

/** Verifica que "Mi perfil" y "Configuración" abran vistas independientes. */
function expectProfileAndSettingsSeparate(node: ReactElement, onNavigate: ReturnType<typeof vi.fn>) {
  render(node);
  const menu = screen.getByRole('menu');

  fireEvent.click(within(menu).getByText('Mi perfil'));
  expect(onNavigate).toHaveBeenLastCalledWith('profile');

  fireEvent.click(within(menu).getByText('Configuración'));
  expect(onNavigate).toHaveBeenLastCalledWith('profile-settings');

  fireEvent.click(within(menu).getByText('Acerca de TÁNDEM'));
  expect(onNavigate).toHaveBeenLastCalledWith('about');

  cleanup();
}

it('en el tutor y en el profesional, Configuración no lleva al mismo contenido que Mi perfil', () => {
  const tutorNavigate = vi.fn();
  expectProfileAndSettingsSeparate(
    <TutorAccountMenu open onOpenChange={vi.fn()} user={user} onNavigate={tutorNavigate} onLogout={vi.fn()} />,
    tutorNavigate,
  );

  const professionalNavigate = vi.fn();
  expectProfileAndSettingsSeparate(
    <ProfessionalAccountMenu open onOpenChange={vi.fn()} user={user} onNavigate={professionalNavigate} onLogout={vi.fn()} />,
    professionalNavigate,
  );
});
