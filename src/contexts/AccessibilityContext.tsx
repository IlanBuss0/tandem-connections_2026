import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { fetchAccessibilitySettings, saveAccessibilitySettings } from '@/data/api';

export type ContrastMode = 'normal' | 'high' | 'inverted' | 'dark' | 'light';
export type ColorBlindnessMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
export type ColorFilter = ColorBlindnessMode | 'desaturate' | 'monochrome';
export type CursorMode = 'normal' | 'big' | 'reading-mask' | 'reading-guide';

export interface AccessibilitySettings {
  fontScale: number;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  textAlignLeft: boolean;
  dyslexiaFont: boolean;
  dyslexiaTextSize: boolean;
  dyslexiaSpacing: boolean;
  dyslexiaLineHeight: boolean;
  dyslexiaLeftAlign: boolean;
  uppercase: boolean;
  contrast: ContrastMode;
  colorFilter: ColorFilter;
  saturation: number;
  smartContrast: boolean;
  reduceMotion: boolean;
  pauseAnimations: boolean;
  information: boolean;
  largeClickArea: boolean;
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
  dyslexiaTextSize: false,
  dyslexiaSpacing: false,
  dyslexiaLineHeight: false,
  dyslexiaLeftAlign: false,
  uppercase: false,
  contrast: 'normal',
  colorFilter: 'none',
  saturation: 1,
  smartContrast: false,
  reduceMotion: false,
  pauseAnimations: false,
  information: false,
  largeClickArea: false,
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
    description: 'Detiene animaciones, muestra información, amplía áreas clickeables y agranda el cursor.',
    icon: 'hand',
    patch: {
      bigCursor: true,
      cursor: 'big',
      pauseAnimations: true,
      information: true,
      largeClickArea: true,
    },
  },
  {
    id: 'blind',
    name: 'Ceguera',
    description: 'Lectura asistida, foco reforzado y mejor soporte para navegación por teclado.',
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
    },
  },
  {
    id: 'dyslexia',
    name: 'Dislexia',
    description: 'Fuente legible, mayor espaciado, interlineado amplio y texto alineado.',
    icon: 'book',
    patch: {
      dyslexiaFont: true,
      dyslexiaTextSize: true,
      dyslexiaSpacing: true,
      dyslexiaLineHeight: true,
      dyslexiaLeftAlign: true,
    },
  },
  {
    id: 'low-vision',
    name: 'Visión baja',
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
    description: 'Guía de lectura, foco claro, menos movimiento y texto más cómodo.',
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
    name: 'Convulsiones y epilépticos',
    description: 'Detiene animaciones, reduce movimiento y baja la saturación.',
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

export function canPersistAccessibilitySettings(userId: string | null | undefined): userId is string {
  return Boolean(userId);
}

export function nextColorBlindnessMode(current: ColorFilter): ColorBlindnessMode {
  const sequence: ColorBlindnessMode[] = ['none', 'deuteranopia', 'protanopia', 'tritanopia'];
  const index = sequence.indexOf(current as ColorBlindnessMode);
  if (index === -1) return 'deuteranopia';
  return sequence[(index + 1) % sequence.length] ?? 'deuteranopia';
}

export function isColorBlindnessMode(filter: ColorFilter): filter is Exclude<ColorBlindnessMode, 'none'> {
  return filter === 'deuteranopia' || filter === 'protanopia' || filter === 'tritanopia';
}

function normalize(raw: Partial<AccessibilitySettings> | null | undefined): AccessibilitySettings {
  const normalized = { ...DEFAULT_SETTINGS, ...(raw ?? {}) };

  // Migrate the former dyslexia preset, which stored generic spacing values and
  // unrelated animation/content-spacing changes, to the five isolated tools.
  if (raw?.activeProfile === 'dyslexia' && raw.dyslexiaTextSize === undefined) {
    return {
      ...normalized,
      lineHeight: DEFAULT_SETTINGS.lineHeight,
      letterSpacing: DEFAULT_SETTINGS.letterSpacing,
      wordSpacing: DEFAULT_SETTINGS.wordSpacing,
      textAlignLeft: DEFAULT_SETTINGS.textAlignLeft,
      pauseAnimations: DEFAULT_SETTINGS.pauseAnimations,
      contentSpacing: DEFAULT_SETTINGS.contentSpacing,
      dyslexiaFont: true,
      dyslexiaTextSize: true,
      dyslexiaSpacing: true,
      dyslexiaLineHeight: true,
      dyslexiaLeftAlign: true,
    };
  }

  return normalized;
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
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [loadedUid, setLoadedUid] = useState(canPersistAccessibilitySettings(user?.id) ? '' : uid);

  useEffect(() => {
    let cancelled = false;
    const canPersist = canPersistAccessibilitySettings(user?.id);
    const localSettings = canPersist ? load(uid) : DEFAULT_SETTINGS;
    setSettings(localSettings);
    setLoadedUid(canPersist ? '' : uid);

    if (!canPersist) {
      // Guest accessibility choices are intentionally memory-only. Remove the
      // key used by older versions so a landing-page refresh always starts clean.
      try {
        localStorage.removeItem(KEY('__guest__'));
      } catch {
        // Storage can be unavailable in privacy modes; defaults still apply.
      }
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
    if (!canPersistAccessibilitySettings(user?.id) || loadedUid !== uid) return;
    save(uid, settings);
  }, [uid, settings, loadedUid, user?.id]);

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
      if (profileId === 'color') {
        const nextMode = nextColorBlindnessMode(prev.colorFilter);
        if (nextMode === 'none') return DEFAULT_SETTINGS;

        return {
          ...DEFAULT_SETTINGS,
          smartContrast: true,
          colorFilter: nextMode,
          activeProfile: 'color',
        };
      }

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
    'a11y-contrast-high': settings.contrast === 'high',
    'a11y-contrast-inverted': settings.contrast === 'inverted',
    'a11y-contrast-dark': settings.contrast === 'dark',
    'a11y-contrast-light': settings.contrast === 'light',
    'a11y-filter-desaturate': settings.colorFilter === 'desaturate',
    'a11y-filter-monochrome': settings.colorFilter === 'monochrome',
    'accessibility-dyslexia-font': settings.dyslexiaFont,
    'accessibility-dyslexia-text-size': settings.dyslexiaTextSize,
    'accessibility-dyslexia-spacing': settings.dyslexiaSpacing,
    'accessibility-dyslexia-line-height': settings.dyslexiaLineHeight,
    'accessibility-dyslexia-left-align': settings.dyslexiaLeftAlign,
    'a11y-uppercase': settings.uppercase,
    'a11y-text-left': settings.textAlignLeft,
    'a11y-reduce-motion': settings.reduceMotion,
    'a11y-pause-animations': settings.pauseAnimations,
    'accessibility-stop-animations': settings.pauseAnimations,
    'accessibility-information': settings.information,
    'accessibility-large-click-area': settings.largeClickArea,
    'a11y-highlight-links': settings.highlightLinks,
    'a11y-highlight-headings': settings.highlightHeadings,
    'a11y-highlight-focus': settings.highlightFocus,
    'a11y-big-cursor': settings.bigCursor || settings.cursor === 'big',
    'accessibility-large-cursor': settings.bigCursor || settings.cursor === 'big',
    'a11y-hide-images': settings.hideImages,
    'a11y-reading-mask': settings.cursor === 'reading-mask',
    'a11y-reading-guide': settings.cursor === 'reading-guide',
    'a11y-saturation-on': settings.saturation !== 1,
    'a11y-spacing-on': settings.contentSpacing !== 1,
    'a11y-simplified-navigation': settings.simplifiedNavigation,
  };

  Object.entries(flags).forEach(([className, enabled]) => body.classList.toggle(className, enabled));

  // Daltonism and smart-contrast styles belong to app content, never to the
  // sibling accessibility widget. These modes intentionally avoid body filters.
  const contentRoot = document.querySelector<HTMLElement>('.accessibility-content-root');
  if (contentRoot) {
    const contentFlags: Record<string, boolean> = {
      'accessibility-smart-contrast': settings.smartContrast,
      'accessibility-colorblind-deuteranopia': settings.colorFilter === 'deuteranopia',
      'accessibility-colorblind-protanopia': settings.colorFilter === 'protanopia',
      'accessibility-colorblind-tritanopia': settings.colorFilter === 'tritanopia',
    };

    Object.entries(contentFlags).forEach(([className, enabled]) => contentRoot.classList.toggle(className, enabled));
  }
}
