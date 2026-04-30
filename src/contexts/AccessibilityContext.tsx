import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// =================== Tipos ===================
export type ContrastMode = 'normal' | 'high' | 'inverted' | 'dark' | 'light';
export type ColorFilter = 'none' | 'desaturate' | 'monochrome' | 'protanopia' | 'deuteranopia' | 'tritanopia';
export type CursorMode = 'normal' | 'big' | 'reading-mask' | 'reading-guide';

export interface AccessibilitySettings {
  // Texto
  fontScale: number;            // 1.0 base, 0.85..1.6
  lineHeight: number;           // 1.5 base, 1.2..2.4
  letterSpacing: number;        // 0 base, 0..0.2 (em)
  wordSpacing: number;          // 0 base, 0..0.5 (em)
  textAlignLeft: boolean;
  dyslexiaFont: boolean;
  uppercase: boolean;

  // Color y visión
  contrast: ContrastMode;
  colorFilter: ColorFilter;
  saturation: number;           // 1 base, 0..2

  // Movimiento
  reduceMotion: boolean;
  pauseAnimations: boolean;

  // Enlaces y foco
  highlightLinks: boolean;
  highlightHeadings: boolean;
  highlightFocus: boolean;

  // Cursor / lectura
  cursor: CursorMode;
  bigCursor: boolean;

  // Imágenes y sonido
  hideImages: boolean;
  muteSounds: boolean;

  // Lectura asistida
  readingTooltip: boolean;      // tooltip describiendo elementos al hover
  speakOnHover: boolean;        // text-to-speech al hover

  // Espaciado
  contentSpacing: number;       // 1 base, 1..2

  // Perfil aplicado
  activeProfile: string | null;
}

export const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontScale: 1,
  lineHeight: 1.5,
  letterSpacing: 0,
  wordSpacing: 0,
  textAlignLeft: false,
  dyslexiaFont: false,
  uppercase: false,
  contrast: 'normal',
  colorFilter: 'none',
  saturation: 1,
  reduceMotion: false,
  pauseAnimations: false,
  highlightLinks: false,
  highlightHeadings: false,
  highlightFocus: false,
  cursor: 'normal',
  bigCursor: false,
  hideImages: false,
  muteSounds: false,
  readingTooltip: false,
  speakOnHover: false,
  contentSpacing: 1,
  activeProfile: null,
};

// =================== Perfiles preestablecidos ===================
export interface AccessibilityProfile {
  id: string;
  name: string;
  description: string;
  icon: string;
  patch: Partial<AccessibilitySettings>;
}

export const ACCESSIBILITY_PROFILES: AccessibilityProfile[] = [
  {
    id: 'motor',
    name: 'Discapacidad motriz',
    description: 'Cursor más grande, áreas táctiles ampliadas y navegación simplificada.',
    icon: '🖐️',
    patch: { bigCursor: true, cursor: 'big', highlightFocus: true, contentSpacing: 1.4, fontScale: 1.1 },
  },
  {
    id: 'blind',
    name: 'Ceguera',
    description: 'Optimizado para lectores de pantalla y tooltip de lectura por voz.',
    icon: '🦮',
    patch: { speakOnHover: true, readingTooltip: true, highlightFocus: true, fontScale: 1.2 },
  },
  {
    id: 'color',
    name: 'Daltonismo',
    description: 'Filtros de color para deuteranopía, protanopía y tritanopía.',
    icon: '🎨',
    patch: { colorFilter: 'deuteranopia', highlightLinks: true },
  },
  {
    id: 'dyslexia',
    name: 'Dislexia',
    description: 'Tipografía especial, mayor interlineado y separación entre palabras.',
    icon: '📖',
    patch: { dyslexiaFont: true, lineHeight: 2, letterSpacing: 0.05, wordSpacing: 0.2, textAlignLeft: true, fontScale: 1.1 },
  },
  {
    id: 'visual',
    name: 'Discapacidad visual',
    description: 'Texto más grande, alto contraste y mayor espaciado.',
    icon: '👓',
    patch: { fontScale: 1.4, contrast: 'high', highlightLinks: true, contentSpacing: 1.3, lineHeight: 1.8 },
  },
  {
    id: 'adhd',
    name: 'TDAH',
    description: 'Reduce distracciones, máscara de lectura y animaciones detenidas.',
    icon: '🎯',
    patch: { cursor: 'reading-mask', pauseAnimations: true, reduceMotion: true, highlightLinks: true },
  },
  {
    id: 'cognitive',
    name: 'Discapacidad cognitiva',
    description: 'Texto sencillo, menos animación, foco resaltado y guía de lectura.',
    icon: '🧠',
    patch: { reduceMotion: true, cursor: 'reading-guide', highlightFocus: true, fontScale: 1.15, contentSpacing: 1.2 },
  },
  {
    id: 'epilepsy',
    name: 'Epilepsia (anti-flash)',
    description: 'Pausa todas las animaciones y reduce la saturación de colores.',
    icon: '⚡',
    patch: { pauseAnimations: true, reduceMotion: true, saturation: 0.8 },
  },
];

// =================== Storage ===================
const KEY = (uid: string) => `tandem:accessibility:${uid}`;

function load(uid: string): AccessibilitySettings {
  try {
    const raw = localStorage.getItem(KEY(uid));
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (_) { /* noop */ }
  return DEFAULT_SETTINGS;
}
function save(uid: string, s: AccessibilitySettings) {
  try { localStorage.setItem(KEY(uid), JSON.stringify(s)); } catch (_) { /* noop */ }
}

// =================== Context ===================
interface Ctx {
  settings: AccessibilitySettings;
  update: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  applyProfile: (profileId: string) => void;
  reset: () => void;
  toggle: (key: keyof AccessibilitySettings) => void;
}

const AccessibilityContext = createContext<Ctx | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.id ?? '__guest__';
  const [settings, setSettings] = useState<AccessibilitySettings>(() => load(uid));

  // Recargar cuando cambia el usuario (login/logout)
  useEffect(() => { setSettings(load(uid)); }, [uid]);

  // Persistir
  useEffect(() => { save(uid, settings); }, [uid, settings]);

  // Aplicar al <html>
  useEffect(() => { applyToDom(settings); }, [settings]);

  const update = useCallback(<K extends keyof AccessibilitySettings>(k: K, v: AccessibilitySettings[K]) => {
    setSettings(prev => ({ ...prev, [k]: v, activeProfile: null }));
  }, []);

  const toggle = useCallback((k: keyof AccessibilitySettings) => {
    setSettings(prev => ({ ...prev, [k]: !prev[k], activeProfile: null } as AccessibilitySettings));
  }, []);

  const applyProfile = useCallback((profileId: string) => {
    const profile = ACCESSIBILITY_PROFILES.find(p => p.id === profileId);
    if (!profile) return;
    setSettings(prev => {
      // Si está activo, lo desactiva
      if (prev.activeProfile === profileId) {
        return { ...DEFAULT_SETTINGS, activeProfile: null };
      }
      return { ...DEFAULT_SETTINGS, ...profile.patch, activeProfile: profileId };
    });
  }, []);

  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  return (
    <AccessibilityContext.Provider value={{ settings, update, applyProfile, reset, toggle }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const c = useContext(AccessibilityContext);
  if (!c) throw new Error('useAccessibility must be inside AccessibilityProvider');
  return c;
}

// =================== Aplicación al DOM ===================
function applyToDom(s: AccessibilitySettings) {
  const html = document.documentElement;
  const body = document.body;

  // CSS variables
  html.style.setProperty('--a11y-font-scale', String(s.fontScale));
  html.style.setProperty('--a11y-line-height', String(s.lineHeight));
  html.style.setProperty('--a11y-letter-spacing', `${s.letterSpacing}em`);
  html.style.setProperty('--a11y-word-spacing', `${s.wordSpacing}em`);
  html.style.setProperty('--a11y-content-spacing', String(s.contentSpacing));
  html.style.setProperty('--a11y-saturation', String(s.saturation));

  const flags: Record<string, boolean> = {
    'a11y-contrast-high': s.contrast === 'high',
    'a11y-contrast-inverted': s.contrast === 'inverted',
    'a11y-contrast-dark': s.contrast === 'dark',
    'a11y-contrast-light': s.contrast === 'light',
    'a11y-filter-desaturate': s.colorFilter === 'desaturate',
    'a11y-filter-monochrome': s.colorFilter === 'monochrome',
    'a11y-filter-protanopia': s.colorFilter === 'protanopia',
    'a11y-filter-deuteranopia': s.colorFilter === 'deuteranopia',
    'a11y-filter-tritanopia': s.colorFilter === 'tritanopia',
    'a11y-dyslexia': s.dyslexiaFont,
    'a11y-uppercase': s.uppercase,
    'a11y-text-left': s.textAlignLeft,
    'a11y-reduce-motion': s.reduceMotion,
    'a11y-pause-animations': s.pauseAnimations,
    'a11y-highlight-links': s.highlightLinks,
    'a11y-highlight-headings': s.highlightHeadings,
    'a11y-highlight-focus': s.highlightFocus,
    'a11y-big-cursor': s.bigCursor || s.cursor === 'big',
    'a11y-hide-images': s.hideImages,
    'a11y-reading-mask': s.cursor === 'reading-mask',
    'a11y-reading-guide': s.cursor === 'reading-guide',
    'a11y-saturation-on': s.saturation !== 1,
    'a11y-spacing-on': s.contentSpacing !== 1,
  };
  Object.entries(flags).forEach(([cls, on]) => body.classList.toggle(cls, on));
}
