import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, X, RotateCcw, Trophy } from 'lucide-react';
import type { GameType, GameData } from '@/data/miniGames';
import { normalizeWheel, selectedWheelSegment, wheelMotion, wheelScore, wheelSegmentAngles } from '@/data/wheelPrecision';

interface Props {
  gameType: GameType;
  gameData: GameData;
  onFinish: (scorePct: number) => void;
}

// Helper UI
function VisualValue({ value, className = '' }: { value?: string; className?: string }) {
  if (value?.startsWith('http')) {
    return <img src={value} alt="" className={`object-contain ${className}`} loading="lazy" />;
  }

  return <>{value}</>;
}

function FeedbackBanner({ ok, msg }: { ok: boolean | null; msg?: string }) {
  if (ok === null) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
    >
      {ok ? <Check size={16} /> : <X size={16} />}
      <span>{msg || (ok ? '¡Correcto!' : 'Casi… intentá de nuevo')}</span>
    </motion.div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-muted rounded-full h-2">
      <motion.div className="gradient-primary h-2 rounded-full" animate={{ width: `${value}%` }} />
    </div>
  );
}

// ========== Multiple Choice ==========
function MultipleChoice({ data, onFinish }: { data: GameData; onFinish: (n: number) => void }) {
  const rounds = data.rounds || [];
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const r = rounds[i];
  if (!r) return <p>Sin contenido</p>;

  const choose = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === r.correct) setScore(s => s + 1);
    setTimeout(() => {
      if (i + 1 >= rounds.length) { setDone(true); onFinish(Math.round(((idx === r.correct ? score + 1 : score) / rounds.length) * 100)); }
      else { setI(i + 1); setPicked(null); }
    }, 900);
  };

  return (
    <div className="space-y-4">
      <ProgressBar value={((i + (picked !== null ? 1 : 0)) / rounds.length) * 100} />
      <p className="text-xs text-muted-foreground text-center">Pregunta {Math.min(i + 1, rounds.length)} de {rounds.length}</p>
      <div className="bg-card border border-border rounded-2xl p-6 text-center">
        <p className="font-medium text-foreground mb-3">{r.prompt}</p>
        <div className="my-4 flex min-h-28 items-center justify-center text-7xl">
          <VisualValue value={r.image} className="h-28 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {r.options.map((opt, idx) => {
          const isCorrect = idx === r.correct;
          const isPicked = picked === idx;
          const showState = picked !== null;
          return (
            <button
              key={idx}
              onClick={() => choose(idx)}
              className={`p-4 rounded-xl border-2 text-base font-medium transition-all ${
                showState
                  ? isCorrect ? 'border-green-500 bg-green-50 text-green-800'
                    : isPicked ? 'border-red-500 bg-red-50 text-red-800'
                    : 'border-border bg-card text-muted-foreground opacity-50'
                  : 'border-border bg-card text-foreground hover:border-primary hover:bg-primary/5'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {done && <p className="text-center text-sm text-success font-bold">Puntaje: {score}/{rounds.length}</p>}
    </div>
  );
}

// ========== Drag word (armá la palabra con letras) ==========
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function autoLetters(word: string): string[] {
  return word.toLowerCase().replace(/[^a-záéíóúñü]/g, '').split('');
}

function DragWord({ data, onFinish }: { data: GameData; onFinish: (n: number) => void }) {
  const rounds = data.dragRounds || [];
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [placed, setPlaced] = useState(0);
  const [letters, setLetters] = useState<string[]>(() => {
    const r = (data.dragRounds || [])[0];
    if (!r) return [];
    const src = r.letters.length ? r.letters : autoLetters(r.correct);
    return shuffleArray(src);
  });
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [flash, setFlash] = useState<'correct' | 'incorrect' | null>(null);

  const r = rounds[i];
  if (!r) return null;

  const correctLetters = autoLetters(r.correct);

  const tryLetter = (letterIdx: number) => {
    if (flash !== null) return;
    if (usedIndices.has(letterIdx)) return;
    const letter = letters[letterIdx];
    if (letter === correctLetters[placed]) {
      setUsedIndices(prev => new Set(prev).add(letterIdx));
      const nextPlaced = placed + 1;
      setPlaced(nextPlaced);
      setFlash('correct');
      setTimeout(() => {
        setFlash(null);
        if (nextPlaced >= correctLetters.length) {
          setScore(s => s + 1);
          if (i + 1 >= rounds.length) {
            onFinish(Math.round(((score + 1) / rounds.length) * 100));
          } else {
            setI(i + 1);
            setPlaced(0);
            setUsedIndices(new Set());
            const next = rounds[i + 1];
            const src = next.letters.length ? next.letters : autoLetters(next.correct);
            setLetters(shuffleArray(src));
          }
        }
      }, 300);
    } else {
      setFlash('incorrect');
      setTimeout(() => setFlash(null), 400);
    }
  };

  return (
    <div className="space-y-4">
      <ProgressBar
        value={((i + (placed > 0 || flash !== null ? 1 : 0)) / rounds.length) * 100}
      />
      <p className="text-center text-xs text-muted-foreground">
        Palabra {Math.min(i + 1, rounds.length)} de {rounds.length}
      </p>

      {/* Pictograma */}
      <div className="flex justify-center">
        <div className="flex min-h-32 items-center justify-center text-8xl">
          <VisualValue value={r.image} className="h-32 w-32" />
        </div>
      </div>

      {/* Slots de letras */}
      <div className="flex flex-wrap justify-center gap-2">
        {correctLetters.map((ch, idx) => {
          const isFilled = idx < placed;
          const isActive = idx === placed;
          return (
            <div
              key={idx}
              className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 text-xl font-bold transition-all ${
                isFilled
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : isActive
                    ? flash === 'incorrect'
                      ? 'border-red-500 bg-red-50'
                      : 'border-primary bg-primary/10 text-muted-foreground ring-2 ring-primary/30'
                    : 'border-dashed border-muted-foreground/40 bg-muted/30 text-muted-foreground/50'
              }`}
            >
              {isFilled ? ch : isActive ? '_' : idx + 1}
            </div>
          );
        })}
      </div>

      {flash === 'correct' && <p className="text-center text-xs font-semibold text-green-600">¡Bien!</p>}
      {flash === 'incorrect' && <p className="text-center text-xs font-semibold text-red-600">Esa letra no va ahí</p>}
      {placed >= correctLetters.length && flash === null && (
        <p className="text-center text-xs font-semibold text-green-600">¡Palabra completa!</p>
      )}

      {/* Fichas de letras disponibles */}
      <div className="flex flex-wrap justify-center gap-2">
        {letters.map((letter, idx) => {
          if (usedIndices.has(idx)) return null;
          return (
            <button
              key={idx}
              onClick={() => tryLetter(idx)}
              className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-xl border-2 border-primary/40 bg-primary/5 text-xl font-bold text-foreground shadow-sm transition-all hover:border-primary hover:shadow-md active:scale-95"
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ========== Wheel Precision ==========
function Wheel({ data, onFinish }: { data: GameData; onFinish: (n: number) => void }) {
  const wheel = useMemo(() => normalizeWheel(data.wheel), [data.wheel]);
  const reduceMotion = useReducedMotion();
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'spinning' | 'stopping' | 'result'>('ready');
  const [attempt, setAttempt] = useState(1);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const completionTimerRef = useRef<number | null>(null);
  const wheelRef = useRef<SVGSVGElement | null>(null);
  const angleRef = useRef(0);
  const speedRef = useRef(0);
  const lastTimeRef = useRef(0);
  const attemptsRef = useRef<number[]>([]);
  const phaseRef = useRef<typeof phase>('ready');
  const animationSessionRef = useRef(0);
  const correctResultRef = useRef(false);
  const lastPointerActionRef = useRef(Number.NEGATIVE_INFINITY);
  const round = wheel.rounds[roundIndex];

  const cancelAnimation = () => {
    animationSessionRef.current += 1;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  };
  const changePhase = (next: typeof phase) => {
    phaseRef.current = next;
    setPhase(next);
  };
  useEffect(() => () => {
    cancelAnimation();
    if (completionTimerRef.current !== null) window.clearTimeout(completionTimerRef.current);
  }, []);

  if (!round) return <p className="text-center text-sm text-muted-foreground">Esta ruleta no tiene rondas configuradas.</p>;

  const motion = wheelMotion(wheel.settings.initialSpeed, roundIndex, wheel.settings.speedIncrease);
  const targetSpeed = motion.targetSpeed;
  const renderFrame = (nextAngle: number) => {
    angleRef.current = nextAngle;
    if (wheelRef.current) wheelRef.current.style.transform = `rotate(${nextAngle}deg)`;
  };
  const start = () => {
    if (phaseRef.current !== 'ready' && phaseRef.current !== 'result') return;
    if (phaseRef.current === 'result' && correctResultRef.current) return;
    cancelAnimation();
    const session = animationSessionRef.current;
    setFeedback(null);
    setSelectedSegment(null);
    correctResultRef.current = false;
    changePhase('spinning');
    speedRef.current = reduceMotion ? targetSpeed : 0;
    lastTimeRef.current = performance.now();
    const tick = (now: number) => {
      if (session !== animationSessionRef.current || phaseRef.current !== 'spinning') return;
      const delta = Math.min(32, now - lastTimeRef.current);
      lastTimeRef.current = now;
      speedRef.current += (targetSpeed - speedRef.current) * Math.min(1, delta / motion.accelerationMs);
      renderFrame(angleRef.current + speedRef.current * delta);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  };
  const stop = () => {
    if (phaseRef.current !== 'spinning') return;
    cancelAnimation();
    const session = animationSessionRef.current;
    changePhase('stopping');
    const started = performance.now();
    const duration = reduceMotion ? 120 : motion.decelerationMs;
    const initialSpeed = Math.max(speedRef.current, targetSpeed * 0.7);
    lastTimeRef.current = started;
    const tick = (now: number) => {
      if (session !== animationSessionRef.current || phaseRef.current !== 'stopping') return;
      const progress = Math.min(1, (now - started) / duration);
      const delta = Math.min(32, now - lastTimeRef.current);
      lastTimeRef.current = now;
      const speed = initialSpeed * (1 - progress) ** 2;
      renderFrame(angleRef.current + speed * delta);
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
      else {
        frameRef.current = null;
        const selected = selectedWheelSegment(angleRef.current, wheel.settings.segments);
        const ok = selected === round.correct;
        correctResultRef.current = ok;
        setSelectedSegment(selected);
        setFeedback(ok);
        changePhase('result');
        if (ok) {
          const completedAttempts = [...attemptsRef.current, attempt];
          attemptsRef.current = completedAttempts;
          completionTimerRef.current = window.setTimeout(() => {
            if (roundIndex + 1 >= wheel.rounds.length) onFinish(wheelScore(completedAttempts));
            else {
              setRoundIndex(index => index + 1);
              setAttempt(1);
              setFeedback(null);
              correctResultRef.current = false;
              changePhase('ready');
            }
          }, 900);
        } else setAttempt(value => value + 1);
      }
    };
    frameRef.current = requestAnimationFrame(tick);
  };
  const handlePrimaryAction = () => {
    if (phaseRef.current === 'spinning') stop();
    else if (phaseRef.current === 'ready' || (phaseRef.current === 'result' && !correctResultRef.current)) start();
  };

  const segmentRadius = 116;
  const contentRadius = 78;
  const point = (degrees: number, radius: number) => {
    const radians = (degrees - 90) * Math.PI / 180;
    return [130 + radius * Math.cos(radians), 130 + radius * Math.sin(radians)];
  };
  return (
    <div className="space-y-4 text-center">
      <div><p className="text-sm text-muted-foreground">Buscá:</p><p className="text-2xl font-bold text-foreground">&ldquo;{round.targetWord}&rdquo;</p></div>
      <div className="flex justify-center gap-4 text-xs text-muted-foreground"><span>Intento: {attempt}</span><span>Ronda {roundIndex + 1}/{wheel.rounds.length}</span></div>
      <div className="relative mx-auto h-[270px] w-[270px]">
        <div className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 text-3xl text-primary">▼</div>
        <svg ref={wheelRef} viewBox="0 0 260 260" className="h-full w-full drop-shadow will-change-transform" aria-label={`Ruleta de ${wheel.settings.segments} pictogramas`}>
          {round.options.map((option, index) => {
            const { start: startAngle, center, end: endAngle } = wheelSegmentAngles(index, wheel.settings.segments);
            const [x1, y1] = point(startAngle, segmentRadius);
            const [x2, y2] = point(endAngle, segmentRadius);
            const [ix, iy] = point(center, contentRadius);
            const fill = selectedSegment === index && phase === 'result' ? (feedback ? 'hsl(142 70% 75%)' : 'hsl(0 80% 82%)') : index % 2 ? 'hsl(var(--accent))' : 'hsl(var(--primary) / .2)';
            return <g key={index}><path d={`M 130 130 L ${x1} ${y1} A ${segmentRadius} ${segmentRadius} 0 0 1 ${x2} ${y2} Z`} fill={fill} stroke="hsl(var(--border))" strokeWidth={selectedSegment === index && phase === 'result' ? 3 : 1} />{option.startsWith('http') ? <image href={option} x={ix - 24} y={iy - 24} width="48" height="48" preserveAspectRatio="xMidYMid meet" /> : <text x={ix} y={iy} textAnchor="middle" dominantBaseline="middle" fontSize="11">{option}</text>}</g>;
          })}
          <circle cx="130" cy="130" r="19" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="4" />
        </svg>
      </div>
      <FeedbackBanner ok={feedback} msg={feedback === true ? `¡Correcto! Lo lograste en ${attempt} intento${attempt === 1 ? '' : 's'}.` : feedback === false ? 'No era ese... intentá de nuevo.' : undefined} />
      <Button
        type="button"
        aria-label={phase === 'spinning' ? 'Parar la ruleta' : phase === 'stopping' ? 'Frenando la ruleta' : 'Girar la ruleta'}
        aria-disabled={phase === 'stopping' || feedback === true}
        onPointerDown={(event) => {
          event.preventDefault();
          lastPointerActionRef.current = performance.now();
          handlePrimaryAction();
        }}
        onClick={() => {
          if (performance.now() - lastPointerActionRef.current > 700) handlePrimaryAction();
        }}
        style={{ touchAction: 'manipulation' }}
        className={phase === 'spinning' || phase === 'stopping' ? 'bg-amber-500 text-white hover:bg-amber-600' : 'gradient-primary text-primary-foreground'}
      >
        <RotateCcw size={16} className={`mr-2 ${phase === 'stopping' ? 'animate-spin' : ''}`} />
        {phase === 'spinning' ? '¡Pará!' : phase === 'stopping' ? 'Frenando…' : 'Girar'}
      </Button>
    </div>
  );
}

// ========== Memory ==========
function Memory({ data, onFinish }: { data: GameData; onFinish: (n: number) => void }) {
  const pairs = data.memory?.pairs || [];
  const cards = useMemo(() => {
    const arr: { id: number; pairId: number; label: string }[] = [];
    pairs.forEach((p, i) => {
      arr.push({ id: i * 2, pairId: i, label: p.a });
      arr.push({ id: i * 2 + 1, pairId: i, label: p.b });
    });
    return arr.sort(() => Math.random() - 0.5);
  }, [pairs]);

  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (flipped.length === 2) {
      setTries(t => t + 1);
      const [a, b] = flipped;
      const ca = cards.find(c => c.id === a)!;
      const cb = cards.find(c => c.id === b)!;
      if (ca.pairId === cb.pairId) {
        setMatched(m => [...m, ca.pairId]);
        setTimeout(() => setFlipped([]), 600);
      } else {
        setTimeout(() => setFlipped([]), 900);
      }
    }
  }, [flipped, cards]);

  useEffect(() => {
    if (matched.length === pairs.length && pairs.length > 0) {
      const optimal = pairs.length;
      const score = Math.max(40, Math.round((optimal / Math.max(tries, optimal)) * 100));
      setTimeout(() => onFinish(score), 600);
    }
  }, [matched, pairs.length, tries, onFinish]);

  const flip = (id: number) => {
    if (flipped.length >= 2) return;
    if (flipped.includes(id)) return;
    const card = cards.find(c => c.id === id)!;
    if (matched.includes(card.pairId)) return;
    setFlipped(prev => [...prev, id]);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground text-center">Encontrá las parejas. Intentos: {tries}</p>
      <div className="grid grid-cols-4 gap-2">
        {cards.map(c => {
          const isOpen = flipped.includes(c.id) || matched.includes(c.pairId);
          return (
            <button
              key={c.id}
              onClick={() => flip(c.id)}
              className={`aspect-square rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                isOpen
                  ? matched.includes(c.pairId) ? 'bg-green-100 border-green-500 text-green-800' : 'bg-primary/10 border-primary'
                  : 'bg-card border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {isOpen ? c.label : '❓'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ========== Sequence Order ==========
function SequenceOrder({ data, onFinish }: { data: GameData; onFinish: (n: number) => void }) {
  const seq = data.sequence;
  const correct = seq?.steps || [];
  const [items, setItems] = useState<string[]>(() => [...correct].sort(() => Math.random() - 0.5));
  const [feedback, setFeedback] = useState<boolean | null>(null);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };

  const check = () => {
    const ok = items.every((s, i) => s === correct[i]);
    setFeedback(ok);
    if (ok) setTimeout(() => onFinish(100), 800);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground font-medium">{seq?.prompt}</p>
      <div className="space-y-2">
        {items.map((s, i) => (
          <div key={s + i} className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border">
            <span className="text-sm font-bold text-primary w-6">{i + 1}.</span>
            <span className="flex-1 text-sm text-foreground">{s}</span>
            <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30" aria-label="Subir">▲</button>
            <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30" aria-label="Bajar">▼</button>
          </div>
        ))}
      </div>
      <FeedbackBanner ok={feedback} msg={feedback === false ? 'Aún no está bien, probá otra vez' : '¡Orden perfecto!'} />
      <Button onClick={check} className="w-full gradient-primary text-primary-foreground">Verificar orden</Button>
    </div>
  );
}

// ========== True / False ==========
function TrueFalse({ data, onFinish }: { data: GameData; onFinish: (n: number) => void }) {
  const items = data.tf || [];
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);
  const r = items[i];

  const choose = (val: boolean) => {
    if (picked !== null) return;
    setPicked(val);
    const ok = val === r.answer;
    if (ok) setScore(s => s + 1);
    setTimeout(() => {
      if (i + 1 >= items.length) onFinish(Math.round(((ok ? score + 1 : score) / items.length) * 100));
      else { setI(i + 1); setPicked(null); }
    }, 900);
  };

  if (!r) return null;
  return (
    <div className="space-y-4">
      <ProgressBar value={(i / items.length) * 100} />
      <div className="bg-card border border-border rounded-2xl p-6 min-h-[140px] flex items-center justify-center">
        <p className="text-lg text-foreground text-center">{r.statement}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => choose(true)} className={`p-4 rounded-xl border-2 font-bold text-lg ${picked === true ? (r.answer ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800') : 'bg-card border-border hover:border-primary'}`}>
          ✅ Verdadero
        </button>
        <button onClick={() => choose(false)} className={`p-4 rounded-xl border-2 font-bold text-lg ${picked === false ? (!r.answer ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800') : 'bg-card border-border hover:border-primary'}`}>
          ❌ Falso
        </button>
      </div>
    </div>
  );
}

// ========== Count Objects ==========
function CountObjects({ data, onFinish }: { data: GameData; onFinish: (n: number) => void }) {
  const items = data.count || [];
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const r = items[i];

  const opts = useMemo(() => {
    if (!r) return [] as number[];
    const set = new Set<number>([r.count]);
    while (set.size < 4) set.add(Math.max(1, r.count + Math.floor(Math.random() * 7) - 3));
    return [...set].sort(() => Math.random() - 0.5);
  }, [i, r]);

  if (!r) return null;
  const choose = (n: number) => {
    if (picked !== null) return;
    setPicked(n);
    const ok = n === r.count;
    if (ok) setScore(s => s + 1);
    setTimeout(() => {
      if (i + 1 >= items.length) onFinish(Math.round(((ok ? score + 1 : score) / items.length) * 100));
      else { setI(i + 1); setPicked(null); }
    }, 900);
  };

  return (
    <div className="space-y-4">
      <ProgressBar value={(i / items.length) * 100} />
      <p className="text-sm text-center text-muted-foreground">¿Cuántos hay?</p>
      <div className="bg-card border border-border rounded-2xl p-5 text-center min-h-[140px]">
        <div className="flex flex-wrap justify-center gap-1 text-3xl">
          {Array.from({ length: r.count }).map((_, k) => <span key={k}>{r.emoji}</span>)}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {opts.map(n => (
          <button key={n} onClick={() => choose(n)} className={`p-4 rounded-xl border-2 font-bold text-xl ${picked === n ? (n === r.count ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800') : 'bg-card border-border hover:border-primary'}`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ========== Fill Blank ==========
function FillBlank({ data, onFinish }: { data: GameData; onFinish: (n: number) => void }) {
  const items = data.fill || [];
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const r = items[i];
  if (!r) return null;

  const choose = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const ok = idx === r.correct;
    if (ok) setScore(s => s + 1);
    setTimeout(() => {
      if (i + 1 >= items.length) onFinish(Math.round(((ok ? score + 1 : score) / items.length) * 100));
      else { setI(i + 1); setPicked(null); }
    }, 900);
  };

  return (
    <div className="space-y-4">
      <ProgressBar value={(i / items.length) * 100} />
      <div className="bg-card border border-border rounded-2xl p-6 text-center min-h-[120px] flex items-center justify-center">
        <p className="text-lg text-foreground">{r.sentence.replace('___', picked !== null ? `[${r.options[picked]}]` : '_____')}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {r.options.map((o, idx) => (
          <button key={idx} onClick={() => choose(idx)} className={`p-3 rounded-xl border-2 font-medium ${picked === idx ? (idx === r.correct ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800') : picked !== null && idx === r.correct ? 'bg-green-50 border-green-400 text-green-700' : 'bg-card border-border hover:border-primary text-foreground'}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// ========== Matching pairs ==========
function MatchingPairs({ data, onFinish }: { data: GameData; onFinish: (n: number) => void }) {
  const m = data.matching;
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [wrong, setWrong] = useState<{ l: number; r: number } | null>(null);

  const tryMatch = (rIdx: number) => {
    if (!m) return;
    if (selectedLeft === null) return;
    if (m.correctMap[selectedLeft] === rIdx) {
      setMatches(prev => ({ ...prev, [selectedLeft]: rIdx }));
      setSelectedLeft(null);
    } else {
      setWrong({ l: selectedLeft, r: rIdx });
      setTimeout(() => { setWrong(null); setSelectedLeft(null); }, 700);
    }
  };

  useEffect(() => {
    if (m && Object.keys(matches).length === m.left.length) {
      setTimeout(() => onFinish(100), 500);
    }
  }, [matches, m, onFinish]);

  if (!m) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground text-center">Tocá una palabra y luego su pareja</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {m.left.map((l, i) => {
            const matched = matches[i] !== undefined;
            const isSel = selectedLeft === i;
            const isWrong = wrong?.l === i;
            return (
              <button
                key={i}
                disabled={matched}
                onClick={() => setSelectedLeft(i)}
                className={`w-full p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  matched ? 'bg-green-50 border-green-400 text-green-800 opacity-60'
                  : isWrong ? 'bg-red-100 border-red-500'
                  : isSel ? 'bg-primary/10 border-primary'
                  : 'bg-card border-border hover:border-primary'
                }`}
              >{l}</button>
            );
          })}
        </div>
        <div className="space-y-2">
          {m.right.map((rg, i) => {
            const matched = Object.values(matches).includes(i);
            const isWrong = wrong?.r === i;
            return (
              <button
                key={i}
                disabled={matched}
                onClick={() => tryMatch(i)}
                className={`w-full p-3 rounded-xl border-2 text-2xl transition-colors ${
                  matched ? 'bg-green-50 border-green-400 opacity-60'
                  : isWrong ? 'bg-red-100 border-red-500'
                  : 'bg-card border-border hover:border-primary'
                }`}
              ><VisualValue value={rg} className="mx-auto h-12 w-12" /></button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ========== Category sort ==========
function CategorySort({ data, onFinish }: { data: GameData; onFinish: (n: number) => void }) {
  const c = data.category;
  const [pending, setPending] = useState(() => c?.items || []);
  const [placed, setPlaced] = useState<Record<number, string[]>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [errors, setErrors] = useState(0);

  const total = c?.items.length || 0;
  const placedCount = Object.values(placed).reduce((a, b) => a + b.length, 0);

  const placeIn = (catIdx: number) => {
    if (!c) return;
    if (selected === null) return;
    const item = pending[selected];
    if (!item) return;
    if (item.categoryIndex === catIdx) {
      setPlaced(prev => ({ ...prev, [catIdx]: [...(prev[catIdx] || []), item.label] }));
      setPending(prev => prev.filter((_, i) => i !== selected));
      setSelected(null);
    } else {
      setErrors(e => e + 1);
      setTimeout(() => setSelected(null), 500);
    }
  };

  useEffect(() => {
    if (total > 0 && placedCount === total) {
      const score = Math.max(40, Math.round(((total) / (total + errors)) * 100));
      setTimeout(() => onFinish(score), 500);
    }
  }, [placedCount, total, errors, onFinish]);

  if (!c) return null;

  return (
    <div className="space-y-3">
      <ProgressBar value={(placedCount / total) * 100} />
      <p className="text-xs text-muted-foreground text-center">Tocá una palabra y luego la categoría correcta. Errores: {errors}</p>
      <div className="bg-muted/30 rounded-xl p-3 flex flex-wrap gap-2 min-h-[60px]">
        {pending.map((it, i) => (
          <button
            key={it.label + i}
            onClick={() => setSelected(i)}
            className={`px-3 py-1.5 rounded-full text-sm border-2 ${selected === i ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
          >{it.label}</button>
        ))}
        {pending.length === 0 && <p className="text-xs text-muted-foreground italic">¡Todo clasificado!</p>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {c.categories.map((cat, idx) => (
          <button key={idx} onClick={() => placeIn(idx)} className="p-3 rounded-xl border-2 border-dashed border-border bg-card hover:border-primary transition-colors min-h-[100px] flex flex-col">
            <div className="flex items-center gap-1 text-sm font-semibold"><span>{cat.emoji}</span><span>{cat.name}</span></div>
            <div className="flex flex-wrap gap-1 mt-2">
              {(placed[idx] || []).map((l, k) => <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">{l}</span>)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ========== Sound match ==========
function SoundMatch({ data, onFinish }: { data: GameData; onFinish: (n: number) => void }) {
  const items = data.sound || [];
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const r = items[i];
  if (!r) return null;

  const choose = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const ok = idx === r.correct;
    if (ok) setScore(s => s + 1);
    setTimeout(() => {
      if (i + 1 >= items.length) onFinish(Math.round(((ok ? score + 1 : score) / items.length) * 100));
      else { setI(i + 1); setPicked(null); }
    }, 900);
  };

  return (
    <div className="space-y-4">
      <ProgressBar value={(i / items.length) * 100} />
      <div className="bg-card border border-border rounded-2xl p-6 text-center">
        <p className="text-xs text-muted-foreground">Sonido:</p>
        <p className="text-3xl font-bold text-primary mt-2">"{r.sound}"</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {r.options.map((o, idx) => (
          <button key={idx} onClick={() => choose(idx)} className={`aspect-square rounded-xl border-2 text-4xl ${picked === idx ? (idx === r.correct ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500') : 'bg-card border-border hover:border-primary'}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// ========== Tap correct (multi-select) ==========
function TapCorrect({ data, onFinish }: { data: GameData; onFinish: (n: number) => void }) {
  const items = data.tap || [];
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const r = items[i];
  if (!r) return null;

  const toggle = (idx: number) => {
    if (submitted) return;
    setSelected(prev => prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx]);
  };

  const submit = () => {
    if (submitted) return;
    setSubmitted(true);
    const correct = new Set(r.correctIdx);
    const sel = new Set(selected);
    const ok = correct.size === sel.size && [...correct].every(x => sel.has(x));
    if (ok) setScore(s => s + 1);
    setTimeout(() => {
      if (i + 1 >= items.length) onFinish(Math.round(((ok ? score + 1 : score) / items.length) * 100));
      else { setI(i + 1); setSelected([]); setSubmitted(false); }
    }, 1100);
  };

  return (
    <div className="space-y-4">
      <ProgressBar value={(i / items.length) * 100} />
      <p className="text-sm text-foreground font-medium text-center">{r.prompt}</p>
      <div className="grid grid-cols-3 gap-2">
        {r.options.map((o, idx) => {
          const isSel = selected.includes(idx);
          const isCorrect = r.correctIdx.includes(idx);
          let cls = 'bg-card border-border';
          if (submitted) {
            if (isCorrect && isSel) cls = 'bg-green-100 border-green-500';
            else if (isCorrect && !isSel) cls = 'bg-amber-100 border-amber-500';
            else if (!isCorrect && isSel) cls = 'bg-red-100 border-red-500';
            else cls = 'bg-card border-border opacity-50';
          } else if (isSel) cls = 'bg-primary/10 border-primary';
          return (
            <button key={idx} onClick={() => toggle(idx)} className={`aspect-square rounded-xl border-2 text-4xl transition-colors ${cls}`}>{o}</button>
          );
        })}
      </div>
      {!submitted && (
        <Button onClick={submit} disabled={selected.length === 0} className="w-full gradient-primary text-primary-foreground">Verificar</Button>
      )}
    </div>
  );
}

// ===== Dispatcher =====
export default function MiniGame({ gameType, gameData, onFinish }: Props) {
  switch (gameType) {
    case 'multiple-choice': return <MultipleChoice data={gameData} onFinish={onFinish} />;
    case 'drag-word': return <DragWord key={'dw-' + (gameData.dragRounds || []).map(r => r.correct).join(',')} data={gameData} onFinish={onFinish} />;
    case 'wheel': return <Wheel data={gameData} onFinish={onFinish} />;
    case 'memory': return <Memory data={gameData} onFinish={onFinish} />;
    case 'sequence-order': return <SequenceOrder data={gameData} onFinish={onFinish} />;
    case 'true-false': return <TrueFalse data={gameData} onFinish={onFinish} />;
    case 'count-objects': return <CountObjects data={gameData} onFinish={onFinish} />;
    case 'fill-blank': return <FillBlank data={gameData} onFinish={onFinish} />;
    case 'matching-pairs': return <MatchingPairs data={gameData} onFinish={onFinish} />;
    case 'category-sort': return <CategorySort data={gameData} onFinish={onFinish} />;
    case 'sound-match': return <SoundMatch data={gameData} onFinish={onFinish} />;
    case 'tap-correct': return <TapCorrect data={gameData} onFinish={onFinish} />;
    default: return <p className="text-muted-foreground text-sm">Tipo de juego no soportado</p>;
  }
}
