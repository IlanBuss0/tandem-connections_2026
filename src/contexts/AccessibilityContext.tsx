import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { fetchAccessibilitySettings, saveAccessibilitySettings } from '@/data/api';

export type ContrastMode = 'normal' | 'high' | 'inverted' | 'dark' | 'light';
export type ColorFilter = 'none' | 'desaturate' | 'monochrome' | 'protanopia' | 'deuteranopia' | 'tritanopia';
export type CursorMode = 'normal' | 'big' | 'reading-mask' | 'reading-guide';

export interface AccessibilitySettings {
  fontScale: number;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  textAlignLeft: boolean;
  dyslexiaFont: boolean;
  uppercase: boolean;
  contrast: ContrastMode;
  colorFilter: ColorFilter;
  saturation: number;
  smartContrast: boolean;
  reduceMotion: boolean;
  pauseAnimations: boolean;
  highlightLinks: boolean;
  highlightHeadings: boolean;
  highlightFocus: boolean;
  cursor: CursorMode;
  bigCursor: boolean;
  hideImages: boolean;
  muteSounds: boolean;
  readingTooltip: boolean;
  speakOnHover: boolean;
  pageReader: boolean;
  simplifiedNavigation: boolean;
  contentSpacing: number;
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
  smartContrast: false,
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
  pageReader: false,
  simplifiedNavigation: false,
  contentSpacing: 1,
  activeProfile: null,
};

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
    name: 'Discapacidad motora',
    description: 'Cursor grande, foco visible, areas tactiles amplias y navegacion simplificada.',
    icon: 'hand',
    patch: {
      bigCursor: true,
      cursor: 'big',
      highlightFocus: true,
      simplifiedNavigation: true,
      contentSpacing: 1.35,
      fontScale: 1.1,
    },
  },
  {
    id: 'blind',
    name: 'Ceguera',
    description: 'Lectura asistida, foco reforzado y mejor soporte para navegacion por teclado.',
    icon: 'ear',
    patch: {
      pageReader: true,
      speakOnHover: true,
      readingTooltip: true,
      highlightFocus: true,
      simplifiedNavigation: true,
    },
  },
  {
    id: 'color',
    name: 'Daltonismo',
    description: 'Filtro de color, enlaces destacados y contraste mas claro.',
    icon: 'palette',
    patch: {
      colorFilter: 'deuteranopia',
      smartContrast: true,
      highlightLinks: true,
    },
  },
  {
    id: 'dyslexia',
    name: 'Dislexia',
    description: 'Fuente legible, mayor espaciado, interlineado amplio y texto alineado.',
    icon: 'book',
    patch: {
      dyslexiaFont: true,
      lineHeight: 2,
      letterSpacing: 0.05,
      wordSpacing: 0.22,
      textAlignLeft: true,
      pauseAnimations: true,
      contentSpacing: 1.2,
    },
  },
  {
    id: 'low-vision',
    name: 'Vision baja',
    description: 'Texto grande, alto contraste, cursor grande y enlaces visibles.',
    icon: 'eye',
    patch: {
      fontScale: 1.35,
      contrast: 'high',
      cursor: 'big',
      bigCursor: true,
      highlightLinks: true,
      contentSpacing: 1.3,
      lineHeight: 1.8,
    },
  },
  {
    id: 'cognitive',
    name: 'Cognitivo y aprendizaje',
    description: 'Guia de lectura, foco claro, menos movimiento y texto mas comodo.',
    icon: 'brain',
    patch: {
      cursor: 'reading-guide',
      reduceMotion: true,
      highlightFocus: true,
      smartContrast: true,
      fontScale: 1.12,
      contentSpacing: 1.25,
      lineHeight: 1.8,
    },
  },
  {
    id: 'epilepsy',
    name: 'Convulsiones y epilepticos',
    description: 'Detiene animaciones, reduce movimiento y baja la saturacion.',
    icon: 'zap',
    patch: {
      pauseAnimations: true,
      reduceMotion: true,
      colorFilter: 'desaturate',
      saturation: 0.65,
    },
  },
  {
    id: 'adhd',
    name: 'TDAH',
    description: 'Mascara de lectura, menos movimiento y foco para reducir distracciones.',
    icon: 'target',
    patch: {
      cursor: 'reading-mask',
      pauseAnimations: true,
      reduceMotion: true,
      highlightFocus: true,
      highlightLinks: true,
      smartContrast: true,
    },
  },
];

const KEY = (uid: string) => `tandem:accessibility:${uid}`;

function normalize(raw: Partial<AccessibilitySettings> | null | undefined): AccessibilitySettings {
  return { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
}

function load(uid: string): AccessibilitySettings {
  try {
    const raw = localStorage.getItem(KEY(uid));
    if (raw) return normalize(JSON.parse(raw) as Partial<AccessibilitySettings>);
  } catch {
    return DEFAULT_SETTINGS;
  }
  return DEFAULT_SETTINGS;
}

function save(uid: string, settings: AccessibilitySettings) {
  try {
    localStorage.setItem(KEY(uid), JSON.stringify(settings));
  } catch {
    return;
  }
}

interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  update: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  applyProfile: (profileId: string) => void;
  reset: () => void;
  toggle: (key: keyof AccessibilitySettings) => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.id ?? '__guest__';
  const [settings, setSettings] = useState<AccessibilitySettings>(() => load(uid));
  const [loadedUid, setLoadedUid] = useState(uid);

  useEffect(() => {
    let cancelled = false;
    const localSettings = load(uid);
    setSettings(localSettings);
    setLoadedUid(user?.id ? '' : uid);

    if (!user?.id) {
      return () => {
        cancelled = true;
      };
    }

    fetchAccessibilitySettings(user.id, localSettings)
      .then(remoteSettings => {
        if (!cancelled) {
          setSettings(normalize(remoteSettings));
          setLoadedUid(uid);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadedUid(uid);
      });

    return () => {
      cancelled = true;
    };
  }, [uid, user?.id]);

  useEffect(() => {
    save(uid, settings);
  }, [uid, settings]);

  useEffect(() => {
    if (!user?.id || loadedUid !== uid) return;

    const timer = window.setTimeout(() => {
      saveAccessibilitySettings(user.id, settings).catch(() => undefined);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [settings, user?.id, loadedUid, uid]);

  useEffect(() => {
    applyToDom(settings);
  }, [settings]);

  const update = useCallback(<K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value, activeProfile: null }));
  }, []);

  const toggle = useCallback((key: keyof AccessibilitySettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key], activeProfile: null } as AccessibilitySettings));
  }, []);

  const applyProfile = useCallback((profileId: string) => {
    const profile = ACCESSIBILITY_PROFILES.find(item => item.id === profileId);
    if (!profile) return;

    setSettings(prev => {
      if (prev.activeProfile === profileId) {
        return DEFAULT_SETTINGS;
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
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be inside AccessibilityProvider');
  return context;
}

function applyToDom(settings: AccessibilitySettings) {
  const html = document.documentElement;
  const body = document.body;

  html.style.setProperty('--a11y-font-scale', String(settings.fontScale));
  html.style.setProperty('--a11y-line-height', String(settings.lineHeight));
  html.style.setProperty('--a11y-letter-spacing', `${settings.letterSpacing}em`);
  html.style.setProperty('--a11y-word-spacing', `${settings.wordSpacing}em`);
  html.style.setProperty('--a11y-content-spacing', String(settings.contentSpacing));
  html.style.setProperty('--a11y-saturation', String(settings.saturation));

  const flags: Record<string, boolean> = {
    'a11y-smart-contrast': settings.smartContrast,
    'a11y-contrast-high': settings.contrast === 'high',
    'a11y-contrast-inverted': settings.contrast === 'inverted',
    'a11y-contrast-dark': settings.contrast === 'dark',
    'a11y-contrast-light': settings.contrast === 'light',
    'a11y-filter-desaturate': settings.colorFilter === 'desaturate',
    'a11y-filter-monochrome': settings.colorFilter === 'monochrome',
    'a11y-filter-protanopia': settings.colorFilter === 'protanopia',
    'a11y-filter-deuteranopia': settings.colorFilter === 'deuteranopia',
    'a11y-filter-tritanopia': settings.colorFilter === 'tritanopia',
    'a11y-dyslexia': settings.dyslexiaFont,
    'a11y-uppercase': settings.uppercase,
    'a11y-text-left': settings.textAlignLeft,
    'a11y-reduce-motion': settings.reduceMotion,
    'a11y-pause-animations': settings.pauseAnimations,
    'a11y-highlight-links': settings.highlightLinks,
    'a11y-highlight-headings': settings.highlightHeadings,
    'a11y-highlight-focus': settings.highlightFocus,
    'a11y-big-cursor': settings.bigCursor || settings.cursor === 'big',
    'a11y-hide-images': settings.hideImages,
    'a11y-reading-mask': settings.cursor === 'reading-mask',
    'a11y-reading-guide': settings.cursor === 'reading-guide',
    'a11y-saturation-on': settings.saturation !== 1,
    'a11y-spacing-on': settings.contentSpacing !== 1,
    'a11y-simplified-navigation': settings.simplifiedNavigation,
  };

  Object.entries(flags).forEach(([className, enabled]) => body.classList.toggle(className, enabled));
}
