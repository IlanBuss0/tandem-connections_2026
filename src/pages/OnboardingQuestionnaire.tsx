import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessibility, type AccessibilitySettings } from '@/contexts/AccessibilityContext';
import {
  fetchPertenecienteByUsuarioId,
  markOnboardingStatus,
  submitOnboardingSuggestion,
} from '@/data/api';
import { tandemApi } from '@/services/api';
import { Button } from '@/components/ui/button';

// Cuestionario de onboarding (Fase 6). Reglas que no se negocian:
// - Lo responde la propia persona, sobre si misma.
// - Nunca bloquea funciones: solo ADAPTA la interfaz (patch de accesibilidad)
//   y SUGIERE un nivel de apoyo / autonomia que un profesional confirma despues.
// - Se puede saltear en cualquier momento, sin perder acceso a la app.
// - Todo lo que ajusta es editable despues (burbuja de accesibilidad / perfil).

interface QuestionOption {
  label: string;
  accessibilityPatch?: Partial<AccessibilitySettings>;
  supportWeight?: number;
  autonomyWeight?: number;
}

interface Question {
  id: string;
  prompt: string;
  helper?: string;
  options: [QuestionOption, QuestionOption];
}

// 5 preguntas alimentan el nivel de apoyo sugerido (maximo 6 puntos), y 2
// preguntas alimentan la autonomia sugerida (maximo 4 puntos). Separarlas
// evita que una sola respuesta pese doble y hace el resultado mas legible.
const QUESTIONS: Question[] = [
  {
    id: 'pasos',
    prompt: '¿Te sirve que las actividades y rutinas se muestren divididas en pasos bien chicos, de a uno?',
    helper: 'Esto cambia cómo se ve tu pantalla, nada más.',
    options: [
      { label: 'Sí, prefiero un paso a la vez', accessibilityPatch: { simplifiedNavigation: true, contentSpacing: 1.2 }, supportWeight: 2 },
      { label: 'Puedo ver varios pasos juntos', supportWeight: 0 },
    ],
  },
  {
    id: 'movimiento',
    prompt: '¿Los movimientos o animaciones en la pantalla te distraen o te incomodan?',
    options: [
      { label: 'Sí, prefiero que se muevan lo menos posible', accessibilityPatch: { reduceMotion: true, pauseAnimations: true }, supportWeight: 1 },
      { label: 'No, no me molestan', supportWeight: 0 },
    ],
  },
  {
    id: 'texto',
    prompt: '¿Leés más cómodo con el texto más grande y más espacio entre líneas?',
    options: [
      { label: 'Sí, más grande y espaciado', accessibilityPatch: { fontScale: 1.25, lineHeight: 1.8 }, supportWeight: 1 },
      { label: 'El tamaño normal me sirve', supportWeight: 0 },
    ],
  },
  {
    id: 'foco',
    prompt: '¿Te ayuda que se resalte con claridad en qué botón o campo estás parado?',
    options: [
      { label: 'Sí, me ayuda a no perderme', accessibilityPatch: { highlightFocus: true, highlightLinks: true }, supportWeight: 1 },
      { label: 'No lo necesito', supportWeight: 0 },
    ],
  },
  {
    id: 'espaciado',
    prompt: 'Cuando hay mucha información junta en la pantalla, ¿preferís que esté más espaciada y ordenada?',
    options: [
      { label: 'Sí, más espacio entre todo', accessibilityPatch: { contentSpacing: 1.3 }, supportWeight: 1 },
      { label: 'Así como está, está bien', supportWeight: 0 },
    ],
  },
  {
    id: 'organizacion',
    prompt: '¿Cómo te sentís organizando vos mismo tus tareas del día?',
    options: [
      { label: 'Me organizo solo, sin problema', autonomyWeight: 2 },
      { label: 'Prefiero que alguien me ayude a organizarlas', autonomyWeight: 0 },
    ],
  },
  {
    id: 'decisiones',
    prompt: '¿Cómo te sentís manejando tus puntos o tomando decisiones en la app sin que nadie las revise?',
    options: [
      { label: 'Me siento seguro decidiendo solo', autonomyWeight: 2 },
      { label: 'Prefiero que alguien lo revise conmigo', autonomyWeight: 0 },
    ],
  },
];

const MAX_SUPPORT_SCORE = QUESTIONS.filter(q => q.options.some(o => o.supportWeight !== undefined))
  .reduce((sum, q) => sum + Math.max(...q.options.map(o => o.supportWeight ?? 0)), 0);
const MAX_AUTONOMY_SCORE = QUESTIONS.filter(q => q.options.some(o => o.autonomyWeight !== undefined))
  .reduce((sum, q) => sum + Math.max(...q.options.map(o => o.autonomyWeight ?? 0)), 0);

function bucketIndex(score: number, max: number): 0 | 1 | 2 {
  if (max <= 0) return 0;
  const ratio = score / max;
  if (ratio < 1 / 3) return 0;
  if (ratio < 2 / 3) return 1;
  return 2;
}

function sortedByOrden<T extends { orden?: number | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
}

type Step = 'intro' | number | 'saving' | 'done';

export default function OnboardingQuestionnaire({ onFinish }: { onFinish: () => void }) {
  const { user } = useAuth();
  const { applyPatch } = useAccessibility();
  const [step, setStep] = useState<Step>('intro');
  const [answers, setAnswers] = useState<Record<string, 0 | 1>>({});
  const [error, setError] = useState<string | null>(null);
  const [resultLabel, setResultLabel] = useState<string | null>(null);

  const currentIndex = typeof step === 'number' ? step : 0;
  const currentQuestion = QUESTIONS[currentIndex];
  const answeredCount = Object.keys(answers).length;

  const handleSkip = async () => {
    if (!user) return;
    setStep('saving');
    try {
      await markOnboardingStatus(user.id, { done: false, skipped: true });
    } finally {
      onFinish();
    }
  };

  const handleAnswer = (optionIndex: 0 | 1) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionIndex }));
    const nextIndex = currentIndex + 1;
    if (nextIndex < QUESTIONS.length) {
      setStep(nextIndex);
    } else {
      void finish({ ...answers, [currentQuestion.id]: optionIndex });
    }
  };

  const finish = async (finalAnswers: Record<string, 0 | 1>) => {
    if (!user) return;
    setStep('saving');
    setError(null);

    try {
      // 1) Aplica el patch de accesibilidad acumulado — esto es lo que
      // realmente cambia la experiencia, y ya se guarda solo (el contexto
      // de accesibilidad persiste en el backend con un debounce propio).
      let patch: Partial<AccessibilitySettings> = {};
      let supportScore = 0;
      let autonomyScore = 0;

      QUESTIONS.forEach(question => {
        const chosenIndex = finalAnswers[question.id];
        if (chosenIndex === undefined) return;
        const option = question.options[chosenIndex];
        if (option.accessibilityPatch) patch = { ...patch, ...option.accessibilityPatch };
        supportScore += option.supportWeight ?? 0;
        autonomyScore += option.autonomyWeight ?? 0;
      });

      if (Object.keys(patch).length > 0) applyPatch(patch);

      // 2) Calcula la sugerencia de nivel de apoyo / autonomia en base a los
      // catalogos reales del backend (nunca se hardcodean ids).
      const [supportLevels, autonomies, perteneciente] = await Promise.all([
        tandemApi.nivelesApoyos.getAll(),
        tandemApi.autonomiasOperativas.getAll(),
        fetchPertenecienteByUsuarioId(user.id),
      ]);

      if (perteneciente?.id && supportLevels.length && autonomies.length) {
        const sortedLevels = sortedByOrden(supportLevels);
        const sortedAutonomies = sortedByOrden(autonomies);

        // Niveles de apoyo van de menos a mas necesidad de apoyo (Bajo -> Alto):
        // a mas puntaje de "necesita apoyo", mas alto el indice.
        const levelIndex = Math.min(bucketIndex(supportScore, MAX_SUPPORT_SCORE), sortedLevels.length - 1);
        // Autonomia va de mas independiente a menos independiente: a mas
        // puntaje de "se maneja solo", el indice es mas bajo (mas independencia).
        const autonomyBucket = bucketIndex(autonomyScore, MAX_AUTONOMY_SCORE);
        const autonomyIndex = Math.min(2 - autonomyBucket, sortedAutonomies.length - 1);

        const suggestedLevel = sortedLevels[Math.max(0, levelIndex)];
        const suggestedAutonomy = sortedAutonomies[Math.max(0, autonomyIndex)];

        await submitOnboardingSuggestion(perteneciente.id, {
          id_nivel_apoyo: suggestedLevel?.id,
          id_autonomia_operativa: suggestedAutonomy?.id,
        });

        setResultLabel(suggestedLevel?.nombre ?? null);
      }

      await markOnboardingStatus(user.id, { done: true, skipped: false });
      setStep('done');
    } catch {
      setError('No se pudo guardar todo, pero tus respuestas de accesibilidad ya se aplicaron. Podés seguir usando la app.');
      await markOnboardingStatus(user.id, { done: true, skipped: false }).catch(() => undefined);
      setStep('done');
    }
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#F8FAFB] px-4 py-10 text-[#4a4a5a] flex items-center justify-center">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-lg">
        {step === 'intro' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5f0ff] text-[#6b4c9a]">
              <Sparkles size={28} />
            </div>
            <h1 className="text-2xl font-extrabold text-[#6b4c9a]">Antes de arrancar</h1>
            <p className="mt-2 text-sm text-[#8b7aa0]">
              7 preguntas rápidas y opcionales para armar Tándem a tu medida. No hay respuestas correctas ni incorrectas,
              y no es un diagnóstico — solo ajusta cómo se ve la app para vos. Lo que sugiera lo confirma después tu
              profesional, y siempre lo podés cambiar vos mismo desde tu perfil.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
              <Button onClick={() => setStep(0)} className="w-full rounded-full sm:flex-1">
                Empezar <ChevronRight size={16} className="ml-1" />
              </Button>
              <Button variant="ghost" onClick={handleSkip} className="w-full rounded-full sm:flex-1">
                Saltear por ahora
              </Button>
            </div>
          </div>
        )}

        {typeof step === 'number' && currentQuestion && (
          <div>
            <div className="mb-5 flex items-center justify-between text-xs font-semibold text-[#8b7aa0]">
              <span>Pregunta {currentIndex + 1} de {QUESTIONS.length}</span>
              <button type="button" onClick={handleSkip} className="underline-offset-4 hover:underline">
                Saltear
              </button>
            </div>
            <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-[#f0e8f8]">
              <div
                className="h-full rounded-full bg-[#6b4c9a] transition-all"
                style={{ width: `${((currentIndex + (answeredCount > currentIndex ? 1 : 0)) / QUESTIONS.length) * 100}%` }}
              />
            </div>
            <h2 className="text-lg font-bold text-[#4a4a5a]">{currentQuestion.prompt}</h2>
            {currentQuestion.helper && <p className="mt-1 text-xs text-[#8b7aa0]">{currentQuestion.helper}</p>}
            <div className="mt-5 space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => handleAnswer(index as 0 | 1)}
                  className="w-full rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-4 text-left text-sm font-semibold text-[#4a4a5a] transition hover:border-[#6b4c9a]/40 hover:bg-[#f5f0ff]"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'saving' && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Loader2 className="animate-spin text-[#6b4c9a]" size={28} />
            <p className="text-sm text-[#8b7aa0]">Guardando tus respuestas...</p>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f8ee] text-[#2f9e56]">
              <CheckCircle2 size={28} />
            </div>
            <h1 className="text-2xl font-extrabold text-[#6b4c9a]">¡Listo!</h1>
            <p className="mt-2 text-sm text-[#8b7aa0]">
              {resultLabel
                ? `Ajustamos la interfaz a tus respuestas y le sugerimos a tu profesional un nivel de apoyo "${resultLabel}" — lo va a confirmar él. Vos podés seguir usando todo sin restricciones.`
                : 'Ajustamos la interfaz según tus respuestas. Podés seguir usando todo sin restricciones.'}
            </p>
            {error && <p className="mt-3 rounded-xl bg-[#fff4e5] px-3 py-2 text-xs text-[#8a5a00]">{error}</p>}
            <Button onClick={onFinish} className="mt-6 w-full rounded-full">
              Entrar a Tándem
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
