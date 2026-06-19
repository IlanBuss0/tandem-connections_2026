import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from '@/data/api';
import { ArrowLeft, CheckCircle2, Pause, Play, HelpCircle, Volume2, PartyPopper, Coins } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import MiniGame from '@/components/MiniGame';

interface Props {
  activity: Activity;
  onBack: () => void;
  onComplete: (id: string) => void;
}

const isImageIcon = (value?: string) => Boolean(value?.startsWith('http'));

function StepIcon({ value, fallback, className = '' }: { value?: string; fallback: string | number; className?: string }) {
  if (isImageIcon(value)) {
    return <img src={value} alt="" className={`object-contain ${className}`} loading="lazy" />;
  }

  return <>{value || fallback}</>;
}

export default function ActivityExecution({ activity, onBack, onComplete }: Props) {
  const { earn } = useWallet();
  const [coinsAwarded, setCoinsAwarded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(activity.steps.map(() => false));
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [completionReported, setCompletionReported] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const progress = (completedSteps.filter(Boolean).length / activity.steps.length) * 100;
  const pointsPerStep = Math.floor(activity.points / activity.steps.length);

  const markStep = () => {
    const updated = [...completedSteps];
    updated[currentStep] = true;
    setCompletedSteps(updated);
    if (currentStep < activity.steps.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 400);
    } else {
      setTimeout(() => setFinished(true), 500);
    }
  };

  // Otorgar monedas una sola vez al terminar
  useEffect(() => {
    if (finished && !coinsAwarded) {
      const reward = Math.max(10, Math.round(activity.points / 2));
      earn(reward, `Actividad: ${activity.title}`);
      setCoinsAwarded(true);
    }
  }, [finished, coinsAwarded, activity, earn]);

  useEffect(() => {
    if (finished && !completionReported) {
      onComplete(activity.id);
      setCompletionReported(true);
    }
  }, [finished, completionReported, activity.id, onComplete]);

  if (finished) {
    const reward = Math.max(10, Math.round(activity.points / 2));
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
          <span className="text-7xl block">🎉</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-2xl font-heading font-bold text-[#6b4c9a]">¡Actividad completada!</h2>
          <p className="text-[#8b7aa0] mt-2 max-w-sm">{activity.completionMessage || '¡Excelente trabajo! Seguí así.'}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 font-bold">
              <PartyPopper size={18} /> +{activity.points} puntos
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-600 font-bold border border-amber-200">
              <Coins size={18} /> +{reward} monedas
            </span>
          </div>
        </motion.div>
        <button onClick={onBack} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6b4c9a] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95 transition mt-4">
          Volver a actividades
        </button>
      </div>
    );
  }

  // === Mini-juego ===
  if (activity.gameType && activity.gameData) {
    return (
      <div className="space-y-4 pb-20 lg:pb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-[#8b7aa0] hover:text-[#6b4c9a]" aria-label="Volver"><ArrowLeft size={20} /></button>
          <div className="flex-1 min-w-0">
            <h2 className="font-heading font-bold text-[#6b4c9a] text-lg leading-tight truncate">{activity.title}</h2>
            <p className="text-xs text-[#8b7aa0] truncate">🎮 Mini-juego · {activity.duration}</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium shrink-0">juego</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#f0e8f8] shadow-sm">
          <MiniGame
            gameType={activity.gameType}
            gameData={activity.gameData}
            onFinish={() => setFinished(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-[#8b7aa0] hover:text-[#6b4c9a]"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <h2 className="font-heading font-bold text-[#6b4c9a] text-lg leading-tight">{activity.title}</h2>
          <p className="text-xs text-[#8b7aa0]">{activity.category} · {activity.duration}</p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${activity.type === 'guiada' ? 'bg-blue-100 text-blue-700' : activity.type === 'juego' ? 'bg-green-100 text-green-700' : activity.type === 'regulación' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
          {activity.type}
        </span>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl p-4 border border-[#f0e8f8] shadow-sm">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-[#8b7aa0]">Paso {currentStep + 1} de {activity.steps.length}</span>
          <span className="font-medium text-[#6b4c9a]">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-[#ede4f8] rounded-full h-3">
          <motion.div className="bg-[#6b4c9a] h-3 rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
        </div>
        <div className="flex gap-1 mt-2">
          {activity.steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${completedSteps[i] ? 'bg-green-500' : i === currentStep ? 'bg-[#6b4c9a]/50' : 'bg-[#ede4f8]'}`} />
          ))}
        </div>
      </div>

      {/* Current step */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="bg-white rounded-2xl p-6 border border-[#f0e8f8] shadow-sm text-center min-h-[200px] flex flex-col items-center justify-center"
        >
          <span className="w-28 h-28 mb-4 rounded-2xl bg-[#6b4c9a]/10 flex items-center justify-center overflow-hidden text-5xl">
            <StepIcon value={activity.stepIcons?.[currentStep]} fallback={currentStep + 1} className="w-24 h-24" />
          </span>
          <p className="text-lg font-medium text-[#6b4c9a] leading-relaxed">{activity.steps[currentStep]}</p>
          <p className="text-xs text-[#8b7aa0] mt-3">+{pointsPerStep} pts por completar este paso</p>
        </motion.div>
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => setPaused(!paused)} className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-[#ede4f8] bg-[#faf8ff] px-4 py-2 text-sm font-medium text-[#6b4c9a] hover:bg-[#f5f0ff] transition">
          {paused ? <><Play size={14} className="mr-1" /> Continuar</> : <><Pause size={14} className="mr-1" /> Pausar</>}
        </button>
        <button onClick={() => setShowHelp(!showHelp)} className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-[#ede4f8] bg-[#faf8ff] px-4 py-2 text-sm font-medium text-[#6b4c9a] hover:bg-[#f5f0ff] transition">
          <HelpCircle size={14} className="mr-1" /> Necesito ayuda
        </button>
        <button className="w-10 h-10 inline-flex items-center justify-center rounded-2xl border border-[#ede4f8] bg-[#faf8ff] text-[#6b4c9a] hover:bg-[#f5f0ff] transition">
          <Volume2 size={14} />
        </button>
      </div>

      {showHelp && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-sky/50 rounded-xl p-4 border border-[#6b4c9a]/20">
          <p className="text-sm text-[#6b4c9a] font-medium mb-1">💡 ¿Necesitás ayuda?</p>
          <p className="text-xs text-[#8b7aa0]">Si no sabés cómo seguir, pedile a un adulto de confianza que te acompañe en este paso. También podés pausar y volver después.</p>
          <div className="flex gap-2 mt-3">
            <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-[#ede4f8] bg-[#faf8ff] px-3 py-1.5 text-xs font-medium text-[#6b4c9a] hover:bg-[#f5f0ff] transition">Avisar a mi tutor</button>
            <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-[#ede4f8] bg-[#faf8ff] px-3 py-1.5 text-xs font-medium text-[#6b4c9a] hover:bg-[#f5f0ff] transition">Saltar paso</button>
          </div>
        </motion.div>
      )}

      {/* Complete step button */}
      {!paused && !completedSteps[currentStep] && (
        <button onClick={markStep} className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6b4c9a] px-5 py-3 text-base font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95 transition">
          <CheckCircle2 size={18} /> Completar paso
        </button>
      )}
      {completedSteps[currentStep] && currentStep < activity.steps.length - 1 && (
        <button onClick={() => setCurrentStep(currentStep + 1)} className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6b4c9a] px-5 py-3 text-base font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95 transition">
          Siguiente paso →
        </button>
      )}

      {/* Step overview */}
      <div className="bg-white rounded-xl p-4 border border-[#f0e8f8]">
        <p className="text-xs font-semibold text-[#6b4c9a] mb-2">Todos los pasos</p>
        <div className="space-y-1.5">
          {activity.steps.map((step, i) => (
            <button key={i} onClick={() => setCurrentStep(i)} className={`w-full flex items-center gap-2 text-xs p-2 rounded-lg text-left transition-colors ${i === currentStep ? 'bg-[#6b4c9a]/10' : ''}`}>
              {completedSteps[i] ? <CheckCircle2 size={14} className="text-green-500 shrink-0" /> : <span className="w-8 h-8 rounded-lg border border-[#8b7aa0]/30 shrink-0 flex items-center justify-center overflow-hidden"><StepIcon value={activity.stepIcons?.[i]} fallback={i + 1} className="w-7 h-7" /></span>}
              <span className={completedSteps[i] ? 'line-through text-[#8b7aa0]' : 'text-[#6b4c9a]'}>{step}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
