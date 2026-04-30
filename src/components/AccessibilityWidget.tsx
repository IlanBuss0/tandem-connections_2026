import { useEffect, useRef, useState } from 'react';
import { useAccessibility, ACCESSIBILITY_PROFILES, ContrastMode, ColorFilter, CursorMode, DEFAULT_SETTINGS } from '@/contexts/AccessibilityContext';
import {
  Accessibility, X, RotateCcw, Type, Eye, MousePointer2, Link2, Image as ImageIcon,
  Contrast, Palette, Zap, Volume2, AlignLeft, MoveHorizontal, Minus, Plus, Check,
  Headphones, BookOpen, ChevronRight,
} from 'lucide-react';

type Tab = 'profiles' | 'content' | 'color' | 'navigation' | 'orientation';

export default function AccessibilityWidget() {
  const { settings, update, applyProfile, reset, toggle } = useAccessibility();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('profiles');
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Track mouse para reading mask/guide
  useEffect(() => {
    if (settings.cursor !== 'reading-mask' && settings.cursor !== 'reading-guide') return;
    const handler = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--a11y-mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [settings.cursor]);

  // TTS al hover
  useEffect(() => {
    if (!settings.speakOnHover) return;
    const speak = (text: string) => {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'es-ES';
        u.rate = 1;
        speechRef.current = u;
        window.speechSynthesis.speak(u);
      } catch (_) { /* noop */ }
    };
    let timer: number | null = null;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.closest('.a11y-widget')) return;
      const text = (target.getAttribute('aria-label') || target.innerText || '').trim().slice(0, 200);
      if (!text) return;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => speak(text), 400);
    };
    document.addEventListener('mouseover', handler);
    return () => {
      document.removeEventListener('mouseover', handler);
      try { window.speechSynthesis.cancel(); } catch (_) {}
      if (timer) window.clearTimeout(timer);
    };
  }, [settings.speakOnHover]);

  // Mute global audio
  useEffect(() => {
    document.querySelectorAll('audio,video').forEach((el: any) => { el.muted = settings.muteSounds; });
  }, [settings.muteSounds]);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'profiles', label: 'Perfiles', icon: Accessibility },
    { id: 'content', label: 'Contenido', icon: Type },
    { id: 'color', label: 'Color', icon: Palette },
    { id: 'navigation', label: 'Navegación', icon: MousePointer2 },
    { id: 'orientation', label: 'Orientación', icon: BookOpen },
  ];

  const activeCount = countActive(settings);

  return (
    <>
      {/* SVG filters para daltonismo */}
      <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="a11y-protanopia"><feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0"/></filter>
          <filter id="a11y-deuteranopia"><feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0"/></filter>
          <filter id="a11y-tritanopia"><feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0"/></filter>
        </defs>
      </svg>

      {/* Botón flotante */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir menú de accesibilidad"
        className="a11y-widget fixed left-3 bottom-3 sm:left-4 sm:bottom-4 z-[9998] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-600 text-white shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform ring-4 ring-blue-600/20"
        style={{ filter: 'none' }}
      >
        <Accessibility size={24} />
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="a11y-widget fixed inset-0 z-[9999] flex items-end sm:items-center justify-end sm:justify-end" role="dialog" aria-modal="true" aria-label="Panel de accesibilidad">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white text-gray-900 w-full sm:w-[440px] sm:max-w-[440px] h-[90vh] sm:h-[92vh] sm:mr-4 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Accessibility size={22} />
                <div>
                  <h2 className="font-bold text-base">Accesibilidad</h2>
                  <p className="text-xs opacity-90">Personalizá tu experiencia en TÁNDEM</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={reset} className="p-2 rounded-lg hover:bg-blue-700" aria-label="Restablecer">
                  <RotateCcw size={18} />
                </button>
                <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-blue-700" aria-label="Cerrar">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 min-w-[80px] flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                    tab === t.id ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <t.icon size={16} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {tab === 'profiles' && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 mb-2">Elegí un perfil que se ajuste a tus necesidades. Se aplicarán varios ajustes a la vez.</p>
                  {ACCESSIBILITY_PROFILES.map(p => (
                    <button
                      key={p.id}
                      onClick={() => applyProfile(p.id)}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        settings.activeProfile === p.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-400 bg-white'
                      }`}
                    >
                      <span className="text-2xl">{p.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{p.description}</p>
                      </div>
                      {settings.activeProfile === p.id ? (
                        <Check className="text-blue-600 shrink-0 mt-1" size={18} />
                      ) : (
                        <ChevronRight className="text-gray-400 shrink-0 mt-1" size={18} />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {tab === 'content' && (
                <div className="space-y-3">
                  <SliderRow label="Tamaño del texto" icon={<Type size={16} />} value={settings.fontScale} min={0.85} max={1.6} step={0.05} onChange={v => update('fontScale', v)} format={v => `${Math.round(v*100)}%`} />
                  <SliderRow label="Interlineado" icon={<MoveHorizontal size={16} />} value={settings.lineHeight} min={1.2} max={2.4} step={0.1} onChange={v => update('lineHeight', v)} format={v => v.toFixed(1)} />
                  <SliderRow label="Espaciado entre letras" icon={<MoveHorizontal size={16} />} value={settings.letterSpacing} min={0} max={0.2} step={0.02} onChange={v => update('letterSpacing', v)} format={v => `${v.toFixed(2)} em`} />
                  <SliderRow label="Espaciado entre palabras" icon={<MoveHorizontal size={16} />} value={settings.wordSpacing} min={0} max={0.5} step={0.05} onChange={v => update('wordSpacing', v)} format={v => `${v.toFixed(2)} em`} />
                  <SliderRow label="Espaciado del contenido" icon={<AlignLeft size={16} />} value={settings.contentSpacing} min={1} max={2} step={0.1} onChange={v => update('contentSpacing', v)} format={v => `x${v.toFixed(1)}`} />

                  <ToggleRow label="Fuente para dislexia" icon={<BookOpen size={16} />} value={settings.dyslexiaFont} onChange={() => toggle('dyslexiaFont')} />
                  <ToggleRow label="Alinear texto a la izquierda" icon={<AlignLeft size={16} />} value={settings.textAlignLeft} onChange={() => toggle('textAlignLeft')} />
                  <ToggleRow label="Texto en mayúsculas" icon={<Type size={16} />} value={settings.uppercase} onChange={() => toggle('uppercase')} />
                </div>
              )}

              {tab === 'color' && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><Contrast size={14} /> Contraste</p>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { id: 'normal', label: 'Normal' },
                        { id: 'high', label: 'Alto contraste' },
                        { id: 'inverted', label: 'Invertido' },
                        { id: 'dark', label: 'Modo oscuro' },
                        { id: 'light', label: 'Modo claro' },
                      ] as { id: ContrastMode; label: string }[]).map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => update('contrast', opt.id)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium border-2 ${settings.contrast === opt.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:border-blue-400'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><Palette size={14} /> Filtros de color (daltonismo)</p>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { id: 'none', label: 'Ninguno' },
                        { id: 'monochrome', label: 'Monocromo' },
                        { id: 'desaturate', label: 'Menos saturación' },
                        { id: 'protanopia', label: 'Protanopía' },
                        { id: 'deuteranopia', label: 'Deuteranopía' },
                        { id: 'tritanopia', label: 'Tritanopía' },
                      ] as { id: ColorFilter; label: string }[]).map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => update('colorFilter', opt.id)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium border-2 ${settings.colorFilter === opt.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:border-blue-400'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <SliderRow label="Saturación" icon={<Palette size={16} />} value={settings.saturation} min={0} max={2} step={0.1} onChange={v => update('saturation', v)} format={v => `${Math.round(v*100)}%`} />
                </div>
              )}

              {tab === 'navigation' && (
                <div className="space-y-3">
                  <ToggleRow label="Resaltar enlaces" icon={<Link2 size={16} />} value={settings.highlightLinks} onChange={() => toggle('highlightLinks')} />
                  <ToggleRow label="Resaltar títulos" icon={<Type size={16} />} value={settings.highlightHeadings} onChange={() => toggle('highlightHeadings')} />
                  <ToggleRow label="Resaltar foco del teclado" icon={<MousePointer2 size={16} />} value={settings.highlightFocus} onChange={() => toggle('highlightFocus')} />
                  <ToggleRow label="Cursor grande" icon={<MousePointer2 size={16} />} value={settings.bigCursor} onChange={() => toggle('bigCursor')} />

                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><MousePointer2 size={14} /> Modo de cursor</p>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { id: 'normal', label: 'Normal' },
                        { id: 'big', label: 'Grande' },
                        { id: 'reading-mask', label: 'Máscara de lectura' },
                        { id: 'reading-guide', label: 'Guía de lectura' },
                      ] as { id: CursorMode; label: string }[]).map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => update('cursor', opt.id)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium border-2 ${settings.cursor === opt.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:border-blue-400'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'orientation' && (
                <div className="space-y-3">
                  <ToggleRow label="Reducir movimiento" icon={<Zap size={16} />} value={settings.reduceMotion} onChange={() => toggle('reduceMotion')} />
                  <ToggleRow label="Pausar todas las animaciones" icon={<Zap size={16} />} value={settings.pauseAnimations} onChange={() => toggle('pauseAnimations')} />
                  <ToggleRow label="Ocultar imágenes" icon={<ImageIcon size={16} />} value={settings.hideImages} onChange={() => toggle('hideImages')} />
                  <ToggleRow label="Silenciar sonidos" icon={<Volume2 size={16} />} value={settings.muteSounds} onChange={() => toggle('muteSounds')} />
                  <ToggleRow label="Lectura por voz al pasar el mouse" icon={<Headphones size={16} />} value={settings.speakOnHover} onChange={() => toggle('speakOnHover')} />
                  <ToggleRow label="Tooltip de descripción" icon={<Eye size={16} />} value={settings.readingTooltip} onChange={() => toggle('readingTooltip')} />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-3 bg-gray-50 flex items-center justify-between text-xs text-gray-600">
              <span>{activeCount > 0 ? `${activeCount} ajustes activos` : 'Sin ajustes activos'}</span>
              <button onClick={reset} className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
                <RotateCcw size={12} /> Restablecer todo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ToggleRow({ label, icon, value, onChange }: { label: string; icon: React.ReactNode; value: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-400'}`}>
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{icon}</span>
      <span className="flex-1 text-left text-sm font-medium text-gray-900">{label}</span>
      <span className={`w-10 h-6 rounded-full relative transition-colors ${value ? 'bg-blue-600' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
    </button>
  );
}

function SliderRow({ label, icon, value, min, max, step, onChange, format }: {
  label: string; icon: React.ReactNode; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string;
}) {
  return (
    <div className="p-3 rounded-xl border-2 border-gray-200 bg-white">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-7 h-7 rounded-md bg-gray-100 text-gray-700 flex items-center justify-center">{icon}</span>
        <span className="flex-1 text-sm font-medium text-gray-900">{label}</span>
        <span className="text-xs font-bold text-blue-600 tabular-nums">{format(value)}</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))} className="w-7 h-7 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center" aria-label="Disminuir">
          <Minus size={14} />
        </button>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="flex-1 accent-blue-600"
          aria-label={label}
        />
        <button onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))} className="w-7 h-7 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center" aria-label="Aumentar">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function countActive(s: ReturnType<typeof useAccessibility>['settings']) {
  let n = 0;
  if (s.fontScale !== DEFAULT_SETTINGS.fontScale) n++;
  if (s.lineHeight !== DEFAULT_SETTINGS.lineHeight) n++;
  if (s.letterSpacing !== DEFAULT_SETTINGS.letterSpacing) n++;
  if (s.wordSpacing !== DEFAULT_SETTINGS.wordSpacing) n++;
  if (s.contentSpacing !== DEFAULT_SETTINGS.contentSpacing) n++;
  if (s.saturation !== DEFAULT_SETTINGS.saturation) n++;
  if (s.contrast !== 'normal') n++;
  if (s.colorFilter !== 'none') n++;
  if (s.cursor !== 'normal') n++;
  if (s.dyslexiaFont) n++;
  if (s.textAlignLeft) n++;
  if (s.uppercase) n++;
  if (s.reduceMotion) n++;
  if (s.pauseAnimations) n++;
  if (s.highlightLinks) n++;
  if (s.highlightHeadings) n++;
  if (s.highlightFocus) n++;
  if (s.bigCursor) n++;
  if (s.hideImages) n++;
  if (s.muteSounds) n++;
  if (s.speakOnHover) n++;
  if (s.readingTooltip) n++;
  return n;
}
