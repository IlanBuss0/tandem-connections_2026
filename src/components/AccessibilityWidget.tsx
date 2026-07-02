import { useEffect, useMemo, useRef, useState, type ComponentType, type MutableRefObject, type ReactNode } from 'react';
import {
  Accessibility,
  AlignLeft,
  BookOpen,
  Brain,
  CaseUpper,
  Check,
  Contrast,
  Ear,
  Eye,
  Focus,
  Hand,
  Headphones,
  Image as ImageIcon,
  Keyboard,
  Link2,
  Minus,
  Moon,
  MousePointer2,
  Palette,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sun,
  Target,
  Type,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import {
  ACCESSIBILITY_PROFILES,
  DEFAULT_SETTINGS,
  type AccessibilitySettings,
  type ColorFilter,
  useAccessibility,
} from '@/contexts/AccessibilityContext';
import { useMobileMenu } from '@/contexts/MobileMenuState';

type IconComponent = ComponentType<{ size?: number; className?: string }>;

type ToolAction = {
  id: string;
  label: string;
  description: string;
  icon: IconComponent;
  active: boolean;
  onClick: () => void;
  value?: string;
};

type InformationTooltip = { text: string; x: number; y: number };

const INFORMATION_TARGET_SELECTOR = [
  'button', 'a[href]', 'input', 'select', 'textarea', 'img', 'summary', '[role="button"]',
  '[aria-label]', '[title]', '[alt]', '[tabindex]:not([tabindex="-1"])', '[data-clickable="true"]', '.cursor-pointer',
].join(',');

const PROFILE_ICONS: Record<string, IconComponent> = {
  hand: Hand,
  ear: Ear,
  palette: Palette,
  book: BookOpen,
  eye: Eye,
  brain: Brain,
  zap: Zap,
  target: Target,
};

export default function AccessibilityWidget() {
  const { settings, update, applyProfile, reset, toggle } = useAccessibility();
  const { isMobileMenuOpen } = useMobileMenu();
  const [open, setOpen] = useState(false);
  const [resetNotice, setResetNotice] = useState(false);
  const [informationTooltip, setInformationTooltip] = useState<InformationTooltip | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeCount = countActive(settings);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'u') {
        event.preventDefault();
        setOpen(current => !current);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (settings.cursor !== 'reading-mask' && settings.cursor !== 'reading-guide') return;

    const handler = (event: MouseEvent) => {
      document.documentElement.style.setProperty('--a11y-mouse-y', `${event.clientY}px`);
    };

    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [settings.cursor]);

  useEffect(() => {
    document.querySelectorAll<HTMLMediaElement>('audio,video').forEach(element => {
      element.muted = settings.muteSounds;
    });
  }, [settings.muteSounds]);

  useEffect(() => {
    if (!settings.information) {
      setInformationTooltip(null);
      return;
    }

    const show = (event: MouseEvent) => {
      const target = findInformationTarget(event.target);
      const text = target ? getInformationText(target) : '';
      setInformationTooltip(text ? { text, ...getTooltipPosition(event) } : null);
    };
    const move = (event: MouseEvent) => {
      setInformationTooltip(current => current ? { ...current, ...getTooltipPosition(event) } : null);
    };
    const hide = (event: MouseEvent) => {
      if (findInformationTarget(event.target) !== findInformationTarget(event.relatedTarget)) {
        setInformationTooltip(null);
      }
    };

    document.addEventListener('mouseover', show);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseout', hide);
    return () => {
      document.removeEventListener('mouseover', show);
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseout', hide);
    };
  }, [settings.information]);

  useEffect(() => {
    if (!settings.speakOnHover) {
      window.speechSynthesis?.cancel();
      return;
    }

    let timer: number | null = null;
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.closest('.a11y-widget')) return;

      const text = (target.getAttribute('aria-label') || target.innerText || '').trim().slice(0, 220);
      if (!text) return;

      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => speak(text, speechRef), 450);
    };

    document.addEventListener('mouseover', handler);
    return () => {
      document.removeEventListener('mouseover', handler);
      if (timer) window.clearTimeout(timer);
      window.speechSynthesis?.cancel();
    };
  }, [settings.speakOnHover]);

  useEffect(() => {
    if (!settings.pageReader) {
      window.speechSynthesis?.cancel();
      return;
    }

    speak(getReadablePageText(), speechRef);
  }, [settings.pageReader]);

  const profileLabel = useMemo(() => {
    const profile = ACCESSIBILITY_PROFILES.find(item => item.id === settings.activeProfile);
    if (profile) return profile.name;
    if (activeCount > 0) return 'Configuracion personalizada';
    return 'Sin ajustes activos';
  }, [activeCount, settings.activeProfile]);

  const resetAll = () => {
    reset();
    setResetNotice(true);
    window.setTimeout(() => setResetNotice(false), 2000);
  };

  const tools = useMemo(
    () => ({
      text: [
        {
          id: 'increase-text',
          label: 'Agrandar texto',
          description: 'Aumenta el tamano general de la interfaz.',
          icon: Plus,
          active: settings.fontScale > DEFAULT_SETTINGS.fontScale,
          value: `${Math.round(settings.fontScale * 100)}%`,
          onClick: () => update('fontScale', clamp(round(settings.fontScale + 0.1), 0.85, 1.6)),
        },
        {
          id: 'decrease-text',
          label: 'Disminuir texto',
          description: 'Reduce el tamano general de la interfaz.',
          icon: Minus,
          active: settings.fontScale < DEFAULT_SETTINGS.fontScale,
          value: `${Math.round(settings.fontScale * 100)}%`,
          onClick: () => update('fontScale', clamp(round(settings.fontScale - 0.1), 0.85, 1.6)),
        },
        {
          id: 'dyslexia-font',
          label: 'Fuente apta para dislexia',
          description: 'Usa una tipografia mas espaciada y legible.',
          icon: BookOpen,
          active: settings.dyslexiaFont,
          onClick: () => toggle('dyslexiaFont'),
        },
        {
          id: 'dyslexia-text-size',
          label: 'Texto mas grande',
          description: 'Aumenta levemente el texto de lectura.',
          icon: Plus,
          active: settings.dyslexiaTextSize,
          onClick: () => toggle('dyslexiaTextSize'),
        },
        {
          id: 'text-spacing',
          label: 'Espaciado de texto',
          description: 'Aumenta levemente el espacio entre letras y palabras.',
          icon: SlidersHorizontal,
          active: settings.dyslexiaSpacing,
          onClick: () => toggle('dyslexiaSpacing'),
        },
        {
          id: 'line-height',
          label: 'Altura de linea',
          description: 'Amplia o normaliza el interlineado.',
          icon: Type,
          active: settings.dyslexiaLineHeight,
          onClick: () => toggle('dyslexiaLineHeight'),
        },
        {
          id: 'align-left',
          label: 'Alinear texto a la izquierda',
          description: 'Evita bloques centrados o justificados.',
          icon: AlignLeft,
          active: settings.dyslexiaLeftAlign,
          onClick: () => toggle('dyslexiaLeftAlign'),
        },
        {
          id: 'uppercase',
          label: 'Texto en mayusculas',
          description: 'Convierte textos visibles a mayusculas.',
          icon: CaseUpper,
          active: settings.uppercase,
          onClick: () => toggle('uppercase'),
        },
      ],
      visual: [
        {
          id: 'smart-contrast',
          label: 'Contraste inteligente',
          description: 'Refuerza bordes, enlaces y controles sin cambiar todo el tema.',
          icon: Contrast,
          active: settings.smartContrast,
          onClick: () => toggle('smartContrast'),
        },
        {
          id: 'high-contrast',
          label: 'Alto contraste',
          description: 'Aplica maximo contraste en textos y superficies.',
          icon: Contrast,
          active: settings.contrast === 'high',
          onClick: () => update('contrast', settings.contrast === 'high' ? 'normal' : 'high'),
        },
        {
          id: 'dark-mode',
          label: 'Modo oscuro',
          description: 'Oscurece fondos y mejora lectura nocturna.',
          icon: Moon,
          active: settings.contrast === 'dark',
          onClick: () => update('contrast', settings.contrast === 'dark' ? 'normal' : 'dark'),
        },
        {
          id: 'light-mode',
          label: 'Modo claro',
          description: 'Fuerza una paleta clara y limpia.',
          icon: Sun,
          active: settings.contrast === 'light',
          onClick: () => update('contrast', settings.contrast === 'light' ? 'normal' : 'light'),
        },
        {
          id: 'invert-colors',
          label: 'Invertir colores',
          description: 'Invierte la paleta de la pantalla.',
          icon: Eye,
          active: settings.contrast === 'inverted',
          onClick: () => update('contrast', settings.contrast === 'inverted' ? 'normal' : 'inverted'),
        },
        {
          id: 'saturation',
          label: 'Saturacion',
          description: 'Aumenta la intensidad de los colores.',
          icon: Palette,
          active: settings.saturation > DEFAULT_SETTINGS.saturation,
          value: `${Math.round(settings.saturation * 100)}%`,
          onClick: () => update('saturation', settings.saturation > DEFAULT_SETTINGS.saturation ? DEFAULT_SETTINGS.saturation : 1.35),
        },
        {
          id: 'less-saturation',
          label: 'Menos saturacion',
          description: 'Baja estimulos visuales intensos.',
          icon: Palette,
          active: settings.colorFilter === 'desaturate' || settings.saturation < DEFAULT_SETTINGS.saturation,
          onClick: () => {
            update('colorFilter', settings.colorFilter === 'desaturate' ? 'none' : 'desaturate');
            update('saturation', settings.colorFilter === 'desaturate' ? DEFAULT_SETTINGS.saturation : 0.65);
          },
        },
        {
          id: 'monochrome',
          label: 'Monocromo',
          description: 'Muestra la app en escala de grises.',
          icon: Palette,
          active: settings.colorFilter === 'monochrome',
          onClick: () => update('colorFilter', settings.colorFilter === 'monochrome' ? 'none' : 'monochrome'),
        },
        {
          id: 'color-filters',
          label: 'Filtros para daltonismo',
          description: 'Alterna entre protanopia, deuteranopia y tritanopia.',
          icon: Palette,
          active: isColorBlindnessFilter(settings.colorFilter),
          value: colorFilterLabel(settings.colorFilter),
          onClick: () => update('colorFilter', nextColorFilter(settings.colorFilter)),
        },
        {
          id: 'highlight-links',
          label: 'Resaltar enlaces',
          description: 'Destaca links y botones navegables.',
          icon: Link2,
          active: settings.highlightLinks,
          onClick: () => toggle('highlightLinks'),
        },
        {
          id: 'hide-images',
          label: 'Ocultar imagenes',
          description: 'Reduce distracciones visuales ocultando imagenes.',
          icon: ImageIcon,
          active: settings.hideImages,
          onClick: () => toggle('hideImages'),
        },
      ],
      movement: [
        {
          id: 'pause-animations',
          label: settings.pauseAnimations ? 'Reproducir animaciones' : 'Detener animaciones',
          description: 'Pausa transiciones, animaciones y efectos de movimiento.',
          icon: settings.pauseAnimations ? Play : Pause,
          active: settings.pauseAnimations,
          onClick: () => toggle('pauseAnimations'),
        },
        {
          id: 'reduce-motion',
          label: 'Reducir movimiento',
          description: 'Minimiza desplazamientos y animaciones intensas.',
          icon: Zap,
          active: settings.reduceMotion,
          onClick: () => toggle('reduceMotion'),
        },
        {
          id: 'reading-mask',
          label: 'Mascara de lectura',
          description: 'Oscurece alrededor de la linea actual del cursor.',
          icon: Eye,
          active: settings.cursor === 'reading-mask',
          onClick: () => update('cursor', settings.cursor === 'reading-mask' ? 'normal' : 'reading-mask'),
        },
        {
          id: 'reading-guide',
          label: 'Guia de lectura',
          description: 'Muestra una linea guia que sigue el mouse.',
          icon: BookOpen,
          active: settings.cursor === 'reading-guide',
          onClick: () => update('cursor', settings.cursor === 'reading-guide' ? 'normal' : 'reading-guide'),
        },
        {
          id: 'highlight-focus',
          label: 'Resaltar foco',
          description: 'Hace visible el foco de teclado en controles.',
          icon: Focus,
          active: settings.highlightFocus,
          onClick: () => toggle('highlightFocus'),
        },
        {
          id: 'highlight-headings',
          label: 'Resaltar titulos',
          description: 'Marca encabezados para encontrar secciones.',
          icon: Type,
          active: settings.highlightHeadings,
          onClick: () => toggle('highlightHeadings'),
        },
      ],
      navigation: [
        {
          id: 'information',
          label: 'Informacion',
          description: 'Muestra una etiqueta al pasar el mouse por elementos importantes.',
          icon: Focus,
          active: settings.information,
          onClick: () => toggle('information'),
        },
        {
          id: 'large-click-area',
          label: 'Agrandar areas clickeables',
          description: 'Amplia el area de botones, enlaces y otros controles.',
          icon: Hand,
          active: settings.largeClickArea,
          onClick: () => toggle('largeClickArea'),
        },
        {
          id: 'big-cursor',
          label: 'Cursor grande',
          description: 'Aumenta el cursor y el puntero sobre controles.',
          icon: MousePointer2,
          active: settings.bigCursor || settings.cursor === 'big',
          onClick: () => {
            const active = settings.bigCursor || settings.cursor === 'big';
            update('bigCursor', !active);
            update('cursor', active ? 'normal' : 'big');
          },
        },
        {
          id: 'simplified-navigation',
          label: 'Navegacion simplificada',
          description: 'Aumenta areas tactiles y separa controles interactivos.',
          icon: Keyboard,
          active: settings.simplifiedNavigation,
          onClick: () => toggle('simplifiedNavigation'),
        },
        {
          id: 'page-reader',
          label: 'Lectura de pagina',
          description: 'Lee el contenido principal de la pantalla actual.',
          icon: Headphones,
          active: settings.pageReader,
          onClick: () => toggle('pageReader'),
        },
        {
          id: 'speak-on-hover',
          label: 'Leer al pasar el mouse',
          description: 'Lee textos y controles al apuntarlos.',
          icon: Ear,
          active: settings.speakOnHover,
          onClick: () => toggle('speakOnHover'),
        },
        {
          id: 'mute-sounds',
          label: 'Silenciar sonidos',
          description: 'Silencia audio y video dentro de la app.',
          icon: Volume2,
          active: settings.muteSounds,
          onClick: () => toggle('muteSounds'),
        },
      ],
    }),
    [settings, toggle, update],
  );

  return (
    <>
      <svg aria-hidden="true" className="a11y-widget absolute h-0 w-0">
        <defs>
          <filter id="a11y-protanopia">
            <feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0" />
          </filter>
          <filter id="a11y-deuteranopia">
            <feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0" />
          </filter>
          <filter id="a11y-tritanopia">
            <feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0" />
          </filter>
        </defs>
      </svg>
      {informationTooltip && (
        <div
          className="accessibility-info-tooltip"
          role="tooltip"
          style={{ left: informationTooltip.x, top: informationTooltip.y }}
        >
          {informationTooltip.text}
        </div>
      )}

      {!isMobileMenuOpen && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu de accesibilidad"
          className="a11y-widget fixed bottom-5 left-5 z-[9998] flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-[#2357ff] text-white shadow-2xl shadow-blue-900/25 transition hover:-translate-y-0.5 hover:bg-[#5b35d5] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#b9a7ff] sm:bottom-6 sm:left-6"
        >
          <Accessibility size={28} />
          {activeCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-[#7b2ff2] px-1 text-xs font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
      )}

      {open && (
        <div className="a11y-widget fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-label="Menu de Accesibilidad">
          <button
            type="button"
            aria-label="Cerrar menu de accesibilidad"
            className="absolute inset-0 h-full w-full bg-slate-950/45"
            onClick={() => setOpen(false)}
          />

          <aside className="absolute bottom-0 left-0 top-0 flex w-full max-w-[440px] flex-col overflow-hidden bg-white text-slate-950 shadow-2xl sm:w-[420px]">
            <header className="bg-gradient-to-br from-[#2357ff] via-[#5b35d5] to-[#7b2ff2] px-5 pb-5 pt-4 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                    <Accessibility size={26} />
                  </span>
                  <div>
                    <h2 className="text-xl font-extrabold leading-tight">Menu de Accesibilidad</h2>
                    <p className="mt-1 text-sm text-white/85">CTRL + U</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl p-2 text-white transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Cerrar"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="mt-4 rounded-2xl bg-white/12 p-3 ring-1 ring-white/20">
                <p className="text-xs uppercase tracking-[0.08em] text-white/70">Estado actual</p>
                <p className="mt-1 text-sm font-bold">{profileLabel}</p>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-5">
              <Section title="Perfiles predeterminados" description="Activan combinaciones de herramientas. Luego podes ajustar cada opcion manualmente.">
                <div className="grid gap-3">
                  {ACCESSIBILITY_PROFILES.map(profile => {
                    const Icon = PROFILE_ICONS[profile.icon] ?? Accessibility;
                    const active = settings.activeProfile === profile.id;

                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => applyProfile(profile.id)}
                        className={`group flex min-h-[88px] w-full items-start gap-3 rounded-2xl border-2 p-3 text-left transition ${
                          active
                            ? 'border-[#2357ff] bg-[#eef3ff] shadow-sm'
                            : 'border-slate-200 bg-white hover:border-[#8067f0] hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            active ? 'bg-[#2357ff] text-white' : 'bg-[#f1efff] text-[#5b35d5]'
                          }`}
                        >
                          <Icon size={23} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-extrabold text-slate-950">{profile.name}</span>
                          <span className="mt-1 block text-xs leading-5 text-slate-600">{profile.description}</span>
                        </span>
                        <ActiveMark active={active} />
                      </button>
                    );
                  })}
                </div>
              </Section>

              <Section title="Lectura y texto">
                <ToolGrid tools={tools.text} />
              </Section>

              <Section title="Visual">
                <ToolGrid tools={tools.visual} />
              </Section>

              <Section title="Movimiento y concentracion">
                <ToolGrid tools={tools.movement} />
              </Section>

              <Section title="Navegacion">
                <ToolGrid tools={tools.navigation} />
              </Section>
            </div>

            <footer className="border-t border-slate-200 bg-slate-50 px-4 py-4">
              {resetNotice && <p className="mb-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Configuracion restablecida.</p>}
              <button
                type="button"
                onClick={resetAll}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#2357ff] bg-white px-4 py-3 text-sm font-extrabold text-[#2357ff] transition hover:bg-[#eef3ff] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#b9a7ff]"
              >
                <RotateCcw size={18} />
                Restablecer configuracion
              </button>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <div className="mb-3">
        <h3 className="text-base font-extrabold text-slate-950">{title}</h3>
        {description && <p className="mt-1 text-sm leading-5 text-slate-600">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function ToolGrid({ tools }: { tools: ToolAction[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {tools.map(tool => (
        <ToolButton key={tool.id} tool={tool} />
      ))}
    </div>
  );
}

function ToolButton({ tool }: { tool: ToolAction }) {
  const Icon = tool.icon;

  return (
    <button
      type="button"
      onClick={tool.onClick}
      className={`relative flex min-h-[126px] flex-col rounded-2xl border-2 p-3 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[#b9a7ff] ${
        tool.active ? 'border-[#2357ff] bg-[#eef3ff]' : 'border-slate-200 bg-white hover:border-[#8067f0] hover:bg-slate-50'
      }`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tool.active ? 'bg-[#2357ff] text-white' : 'bg-[#f1efff] text-[#5b35d5]'}`}>
          <Icon size={21} />
        </span>
        <ActiveMark active={tool.active} />
      </span>
      <span className="mt-3 block text-sm font-extrabold leading-5 text-slate-950">{tool.label}</span>
      <span className="mt-1 block flex-1 text-xs leading-5 text-slate-600">{tool.description}</span>
      {tool.value && <span className="mt-2 text-xs font-bold text-[#2357ff]">{tool.value}</span>}
    </button>
  );
}

function ActiveMark({ active }: { active: boolean }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
        active ? 'border-[#2357ff] bg-[#2357ff] text-white' : 'border-slate-300 bg-white text-transparent'
      }`}
      aria-hidden="true"
    >
      <Check size={15} strokeWidth={3} />
    </span>
  );
}

function speak(text: string, ref: MutableRefObject<SpeechSynthesisUtterance | null>) {
  if (!text.trim() || !window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95;
    ref.current = utterance;
    window.speechSynthesis.speak(utterance);
  } catch {
    return;
  }
}

function findInformationTarget(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>(INFORMATION_TARGET_SELECTOR) : null;
}

function getTooltipPosition(event: MouseEvent) {
  return {
    x: Math.max(0, Math.min(event.clientX, window.innerWidth - 306)),
    y: Math.max(0, Math.min(event.clientY, window.innerHeight - 82)),
  };
}

function getInformationText(element: HTMLElement): string {
  const labelledBy = element.getAttribute('aria-labelledby');
  const accessibleName = labelledBy
    ?.split(/\s+/)
    .map(id => document.getElementById(id)?.textContent?.trim())
    .filter(Boolean)
    .join(' ');
  const visibleText = element instanceof HTMLInputElement && element.type !== 'button' && element.type !== 'submit'
    ? element.placeholder
    : element.textContent;

  return (
    element.getAttribute('aria-label') ||
    element.getAttribute('title') ||
    element.getAttribute('alt') ||
    visibleText ||
    accessibleName ||
    ''
  ).replace(/\s+/g, ' ').trim().slice(0, 220);
}

function getReadablePageText() {
  const clone = document.body.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.a11y-widget, script, style, noscript').forEach(element => element.remove());
  return (clone.innerText || document.title || 'No hay texto disponible para leer.').trim().slice(0, 4500);
}

function nextColorFilter(current: ColorFilter): ColorFilter {
  const sequence: ColorFilter[] = ['none', 'protanopia', 'deuteranopia', 'tritanopia'];
  const index = sequence.indexOf(current);
  return sequence[(index + 1) % sequence.length] ?? 'protanopia';
}

function colorFilterLabel(filter: ColorFilter) {
  const labels: Record<ColorFilter, string> = {
    none: 'Ninguno',
    desaturate: 'Baja',
    monochrome: 'Mono',
    protanopia: 'Protanopia',
    deuteranopia: 'Deuteranopia',
    tritanopia: 'Tritanopia',
  };

  return labels[filter];
}

function isColorBlindnessFilter(filter: ColorFilter) {
  return filter === 'protanopia' || filter === 'deuteranopia' || filter === 'tritanopia';
}

function countActive(settings: AccessibilitySettings) {
  let count = 0;
  (Object.keys(DEFAULT_SETTINGS) as (keyof AccessibilitySettings)[]).forEach(key => {
    if (key === 'activeProfile') return;
    if (settings[key] !== DEFAULT_SETTINGS[key]) count += 1;
  });
  return count;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Number(value.toFixed(2));
}
