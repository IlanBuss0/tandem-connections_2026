import type { RegisterRole } from '@/services/api';
import mBase from '@/assets/auth/m-base.svg';
import tandemLogo from '@/assets/auth/tandem-logo.svg';
import mascotPerteneciente from '@/assets/auth/mascot-perteneciente.webp';
import mascotTutor from '@/assets/auth/mascot-tutor.webp';
import mascotProfesional from '@/assets/auth/mascot-profesional.webp';

/** Logo completo oficial de TÁNDEM, vectorizado a partir del PNG original. */
export const TANDEM_LOGO_SRC = tandemLogo;

/** Tono visual del panel ilustrado. Solo cambia el fondo y sus detalles, nunca la M. */
export type AuthTone = 'base' | RegisterRole;

export type AuthPanelContent = {
  mascot: string;
  message: string;
  tone: AuthTone;
  /** Si existe, la ilustración participa de la animación compartida con la tarjeta. */
  layoutId?: string;
};

export const BASE_PANEL: AuthPanelContent = {
  mascot: mBase,
  message: 'Autonomía.\nAcompañamiento.\nConexión.',
  tone: 'base',
};

export type ProfileConfig = {
  role: RegisterRole;
  /** Nombre corto del perfil (tarjeta). */
  label: string;
  cardDescription: string;
  formTitle: string;
  formSubtitle: string;
  panelMessage: string;
  mascot: string;
};

export const PROFILE_CONFIG: Record<RegisterRole, ProfileConfig> = {
  perteneciente: {
    role: 'perteneciente',
    label: 'Perteneciente',
    cardDescription: 'Mis actividades, mi autonomía',
    formTitle: 'Crear cuenta perteneciente',
    formSubtitle: 'Tu espacio, tus actividades, tu autonomía',
    panelMessage: 'Tus actividades, tu camino',
    mascot: mascotPerteneciente,
  },
  tutor: {
    role: 'tutor',
    label: 'Tutor',
    cardDescription: 'Acompaño su desarrollo',
    formTitle: 'Crear cuenta tutor',
    formSubtitle: 'Acompañá su desarrollo, paso a paso',
    panelMessage: 'Acompañar también es avanzar',
    mascot: mascotTutor,
  },
  profesional: {
    role: 'profesional',
    label: 'Profesional',
    cardDescription: 'Impulso su crecimiento',
    formTitle: 'Crear cuenta profesional',
    formSubtitle: 'Sumate para impulsar más autonomía',
    panelMessage: 'Profesionales que impulsan autonomía',
    mascot: mascotProfesional,
  },
};

export const PROFILE_ORDER: RegisterRole[] = ['perteneciente', 'tutor', 'profesional'];

export const mascotLayoutId = (role: RegisterRole) => `auth-mascot-${role}`;

export function profilePanel(role: RegisterRole, shared = true): AuthPanelContent {
  const profile = PROFILE_CONFIG[role];
  return {
    mascot: profile.mascot,
    message: profile.panelMessage,
    tone: role,
    layoutId: shared ? mascotLayoutId(role) : undefined,
  };
}

/** Rol del backend ('user' | 'tutor' | 'professional') → perfil de registro. */
export function profileFromAccountRole(role?: string): RegisterRole | null {
  if (role === 'user') return 'perteneciente';
  if (role === 'tutor') return 'tutor';
  if (role === 'professional') return 'profesional';
  return null;
}

export function panelForAccountRole(role: string | undefined, message: string): AuthPanelContent {
  const profile = profileFromAccountRole(role);
  return profile ? { ...profilePanel(profile, false), message } : { ...BASE_PANEL, message };
}
