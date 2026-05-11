import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from '@/data/repo';
import { ArrowLeft, CheckCircle2, Pause, Play, HelpCircle, Volume2, PartyPopper, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import MiniGame from '@/components/MiniGame';

interface Props {
  activity: Activity;
  onBack: () => void;
  onComplete: (id: string) => void;
}

export default function ActivityExecution({ activity, onBack, onComplete }: Props) {
  const { earn } = useWallet();
  const [coinsAwarded, setCoinsAwarded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(activity.steps.map(() => false));
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
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

  if (finished) {
    const reward = Math.max(10, Math.round(activity.points / 2));
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
          <span className="text-7xl block">🎉</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-2xl font-heading font-bold text-foreground">¡Actividad completada!</h2>
          <p className="text-muted-foreground mt-2 max-w-sm">{activity.completionMessage || '¡Excelente trabajo! Seguí así.'}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 font-bold">
              <PartyPopper size={18} /> +{activity.points} puntos
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-600 font-bold border border-amber-200">
              <Coins size={18} /> +{reward} monedas
            </span>
          </div>
        </motion.div>
        <Button onClick={() => { onComplete(activity.id); onBack(); }} className="gradient-primary text-primary-foreground mt-4">
          Volver a actividades
        </Button>
      </div>
    );
  }

  // === Mini-juego ===
  if (activity.gameType && activity.gameData) {
    return (
      <div className="space-y-4 pb-20 lg:pb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground" aria-label="Volver"><ArrowLeft size={20} /></button>
          <div className="flex-1 min-w-0">
            <h2 className="font-heading font-bold text-foreground text-lg leading-tight truncate">{activity.title}</h2>
            <p className="text-xs text-muted-foreground truncate">🎮 Mini-juego · {activity.duration}</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium shrink-0">juego</span>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
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
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <h2 className="font-heading font-bold text-foreground text-lg leading-tight">{activity.title}</h2>
          <p className="text-xs text-muted-foreground">{activity.category} · {activity.duration}</p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${activity.type === 'guiada' ? 'bg-blue-100 text-blue-700' : activity.type === 'juego' ? 'bg-green-100 text-green-700' : activity.type === 'regulación' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
          {activity.type}
        </span>
      </div>

      {/* Progress bar */}
      <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-muted-foreground">Paso {currentStep + 1} de {activity.steps.length}</span>
          <span className="font-medium text-primary">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <motion.div className="gradient-primary h-3 rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
        </div>
        <div className="flex gap-1 mt-2">
          {activity.steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${completedSteps[i] ? 'bg-success' : i === currentStep ? 'bg-primary/50' : 'bg-muted'}`} />
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
          className="bg-card rounded-2xl p-6 border border-border shadow-sm text-center min-h-[200px] flex flex-col items-center justify-center"
        >
          {activity.stepIcons?.[currentStep] && (
            <span className="text-5xl mb-4 block">{activity.stepIcons[currentStep]}</span>
          )}
          <p className="text-lg font-medium text-foreground leading-relaxed">{activity.steps[currentStep]}</p>
          <p className="text-xs text-muted-foreground mt-3">+{pointsPerStep} pts por completar este paso</p>
        </motion.div>
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={() => setPaused(!paused)} className="flex-1">
          {paused ? <><Play size={14} className="mr-1" /> Continuar</> : <><Pause size={14} className="mr-1" /> Pausar</>}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowHelp(!showHelp)} className="flex-1">
          <HelpCircle size={14} className="mr-1" /> Necesito ayuda
        </Button>
        <Button variant="outline" size="sm" className="w-10 p-0">
          <Volume2 size={14} />
        </Button>
      </div>

      {showHelp && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-sky/50 rounded-xl p-4 border border-primary/20">
          <p className="text-sm text-foreground font-medium mb-1">💡 ¿Necesitás ayuda?</p>
          <p className="text-xs text-muted-foreground">Si no sabés cómo seguir, pedile a un adulto de confianza que te acompañe en este paso. También podés pausar y volver después.</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" className="text-xs flex-1">Avisar a mi tutor</Button>
            <Button size="sm" variant="outline" className="text-xs flex-1">Saltar paso</Button>
          </div>
        </motion.div>
      )}

      {/* Complete step button */}
      {!paused && !completedSteps[currentStep] && (
        <Button onClick={markStep} className="w-full gradient-primary text-primary-foreground h-12 text-base font-semibold">
          <CheckCircle2 size={18} className="mr-2" /> Completar paso
        </Button>
      )}
      {completedSteps[currentStep] && currentStep < activity.steps.length - 1 && (
        <Button onClick={() => setCurrentStep(currentStep + 1)} className="w-full gradient-primary text-primary-foreground h-12">
          Siguiente paso →
        </Button>
      )}

      {/* Step overview */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <p className="text-xs font-semibold text-foreground mb-2">Todos los pasos</p>
        <div className="space-y-1.5">
          {activity.steps.map((step, i) => (
            <button key={i} onClick={() => setCurrentStep(i)} className={`w-full flex items-center gap-2 text-xs p-2 rounded-lg text-left transition-colors ${i === currentStep ? 'bg-primary/10' : ''}`}>
              {completedSteps[i] ? <CheckCircle2 size={14} className="text-success shrink-0" /> : <span className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 shrink-0" />}
              <span className={completedSteps[i] ? 'line-through text-muted-foreground' : 'text-foreground'}>{step}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
