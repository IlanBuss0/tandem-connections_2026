import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, GripVertical, Save, Send, Sparkles, Search, X, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomActivities } from '@/contexts/CustomActivitiesContext';
import { ACTIVITY_TEMPLATES, ActivityTemplate, STEP_ICON_OPTIONS } from '@/data/activityTemplates';
import { GAME_TEMPLATES, GameTemplate } from '@/data/miniGames';
import { fetchLinkedPertenecientesForSupportUser, ActivityCategory, ActivityType, type User } from '@/data/api';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameData, GameType } from '@/data/miniGames';

const CATEGORIES: ActivityCategory[] = ['autonomía personal','higiene','organización','escuela','cocina básica','transporte','compras','manejo del dinero','emociones','comunicación','vida social','seguridad personal','rutinas del hogar','regulación emocional','preparación para salidas','anticipación de cambios'];
const TYPES: ActivityType[] = ['guiada','juego','regulación','decisión'];
const DIFFICULTIES = ['fácil','medio','avanzado'] as const;
const DURATIONS = ['3 min','5 min','10 min','15 min','20 min','30 min','45 min'];

function serializeGameContent(gameType?: GameType, gameData?: GameData) {
  if (!gameType || !gameData) return '';
  if (gameType === 'wheel') return gameData.wheel?.words?.join('\n') || '';
  if (gameType === 'drag-word') return (gameData.dragRounds || []).map(item => `${item.image}|${item.words.join(',')}|${item.correct}`).join('\n');
  if (gameType === 'fill-blank') return (gameData.fill || []).map(item => `${item.sentence}|${item.options.join(',')}|${item.correct}`).join('\n');
  if (gameType === 'multiple-choice') return (gameData.rounds || []).map(item => `${item.image}|${item.prompt}|${item.options.join(',')}|${item.correct}`).join('\n');
  if (gameType === 'true-false') return (gameData.tf || []).map(item => `${item.statement}|${item.answer ? 'true' : 'false'}`).join('\n');
  if (gameType === 'sequence-order') return gameData.sequence ? `${gameData.sequence.prompt}\n${gameData.sequence.steps.join('\n')}` : '';
  if (gameType === 'memory') return (gameData.memory?.pairs || []).map(item => `${item.a}|${item.b}`).join('\n');
  if (gameType === 'count-objects') return (gameData.count || []).map(item => `${item.emoji}|${item.count}`).join('\n');
  if (gameType === 'matching-pairs') return gameData.matching ? `${gameData.matching.left.join(',')}\n${gameData.matching.right.join(',')}\n${gameData.matching.correctMap.join(',')}` : '';
  if (gameType === 'category-sort') return (gameData.category?.items || []).map(item => `${item.label}|${item.categoryIndex}`).join('\n');
  if (gameType === 'sound-match') return (gameData.sound || []).map(item => `${item.sound}|${item.options.join(',')}|${item.correct}`).join('\n');
  if (gameType === 'tap-correct') return (gameData.tap || []).map(item => `${item.prompt}|${item.options.join(',')}|${item.correctIdx.join(',')}`).join('\n');
  return '';
}

function parseGameContent(gameType: GameType, text: string, previous?: GameData): GameData {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  if (gameType === 'wheel') return { wheel: { words: lines } };
  if (gameType === 'drag-word') return { dragRounds: lines.map(line => { const [image = '', words = '', correct = ''] = line.split('|'); return { image, words: words.split(',').map(item => item.trim()).filter(Boolean), correct: correct.trim() }; }) };
  if (gameType === 'fill-blank') return { fill: lines.map(line => { const [sentence = '', options = '', correct = '0'] = line.split('|'); return { sentence, options: options.split(',').map(item => item.trim()).filter(Boolean), correct: Number(correct) || 0 }; }) };
  if (gameType === 'multiple-choice') return { rounds: lines.map(line => { const [image = '', prompt = '', options = '', correct = '0'] = line.split('|'); return { image, prompt, options: options.split(',').map(item => item.trim()).filter(Boolean), correct: Number(correct) || 0 }; }) };
  if (gameType === 'true-false') return { tf: lines.map(line => { const [statement = '', answer = 'false'] = line.split('|'); return { statement, answer: answer.trim().toLowerCase() === 'true' }; }) };
  if (gameType === 'sequence-order') return { sequence: { prompt: lines[0] || 'Ordena los pasos', steps: lines.slice(1) } };
  if (gameType === 'memory') return { memory: { pairs: lines.map(line => { const [a = '', b = ''] = line.split('|'); return { a, b }; }) } };
  if (gameType === 'count-objects') return { count: lines.map(line => { const [emoji = '', count = '0'] = line.split('|'); return { emoji, count: Number(count) || 0 }; }) };
  if (gameType === 'matching-pairs') { const [left = '', right = '', correctMap = ''] = lines; return { matching: { left: left.split(',').map(item => item.trim()).filter(Boolean), right: right.split(',').map(item => item.trim()).filter(Boolean), correctMap: correctMap.split(',').map(item => Number(item.trim()) || 0) } }; }
  if (gameType === 'category-sort') return { category: { categories: previous?.category?.categories || [{ name: 'Categoria 1', emoji: '1' }, { name: 'Categoria 2', emoji: '2' }], items: lines.map(line => { const [label = '', categoryIndex = '0'] = line.split('|'); return { label, categoryIndex: Number(categoryIndex) || 0 }; }) } };
  if (gameType === 'sound-match') return { sound: lines.map(line => { const [sound = '', options = '', correct = '0'] = line.split('|'); return { sound, options: options.split(',').map(item => item.trim()).filter(Boolean), correct: Number(correct) || 0 }; }) };
  if (gameType === 'tap-correct') return { tap: lines.map(line => { const [prompt = '', options = '', correct = ''] = line.split('|'); return { prompt, options: options.split(',').map(item => item.trim()).filter(Boolean), correctIdx: correct.split(',').map(item => Number(item.trim())).filter(Number.isFinite) }; }) };
  return previous || {};
}

function contentHelp(gameType?: GameType) {
  if (gameType === 'wheel') return 'Una palabra/frase por linea.';
  if (gameType === 'drag-word') return 'Formato: emoji|opcion1,opcion2,opcion3|respuesta correcta';
  if (gameType === 'fill-blank') return 'Formato: frase con ___|opcion1,opcion2,opcion3|indice correcto empezando en 0';
  if (gameType === 'multiple-choice') return 'Formato: emoji|pregunta|opcion1,opcion2,opcion3,opcion4|indice correcto empezando en 0';
  if (gameType === 'true-false') return 'Formato: afirmacion|true o false';
  if (gameType === 'sequence-order') return 'Primera linea: consigna. Lineas siguientes: pasos en orden.';
  if (gameType === 'memory') return 'Formato: elemento A|elemento B';
  if (gameType === 'count-objects') return 'Formato: emoji|cantidad correcta';
  if (gameType === 'matching-pairs') return 'Linea 1: palabras. Linea 2: pictogramas. Linea 3: mapa de indices correctos.';
  if (gameType === 'category-sort') return 'Formato: palabra|indice de categoria empezando en 0';
  if (gameType === 'sound-match') return 'Formato: sonido|opcion1,opcion2,opcion3|indice correcto empezando en 0';
  if (gameType === 'tap-correct') return 'Formato: consigna|opcion1,opcion2,opcion3|indices correctos separados por coma';
  return '';
}

interface Props {
  initialId?: string;
  onClose: () => void;
  assignableUsersOverride?: User[];
}

export default function ActivityBuilder({ initialId, onClose, assignableUsersOverride }: Props) {
  const { user } = useAuth();
  const { items, createOrUpdate } = useCustomActivities();
  const editing = initialId ? items.find(a => a.id === initialId) : undefined;

  const [step, setStep] = useState(editing ? 1 : 0); // 0 = plantilla
  const [tplSearch, setTplSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);

  const linkedUserIds: string[] = useMemo(() => {
    return assignableUsers.map(item => item.id);
  }, [assignableUsers]);

  useEffect(() => {
    if (assignableUsersOverride) {
      setAssignableUsers(assignableUsersOverride);
      return;
    }
    if (!user || (user.role !== 'professional' && user.role !== 'tutor')) return;
    let cancelled = false;
    fetchLinkedPertenecientesForSupportUser(user.id, user.role === 'professional' ? 'professional' : 'tutor')
      .then((items) => {
        if (!cancelled) setAssignableUsers(items);
      })
      .catch(() => {
        if (!cancelled) setAssignableUsers([]);
      });
    return () => { cancelled = true; };
  }, [user, assignableUsersOverride]);

  const [form, setForm] = useState(() => {
    if (editing) {
      return {
        id: editing.id,
        title: editing.title,
        category: editing.category as ActivityCategory,
        type: editing.type as ActivityType,
        difficulty: editing.difficulty,
        duration: editing.duration,
        objective: editing.objective,
        description: editing.description,
        steps: [...editing.steps],
        stepIcons: [...(editing.stepIcons || editing.steps.map(() => '📌'))],
        points: editing.points,
        completionMessage: editing.completionMessage || '¡Bien hecho!',
        assignedToIds: editing.assignedToIds || (editing.assignedTo ? [editing.assignedTo] : []),
        dueDate: editing.dueDate || '',
        notes: editing.notes || '',
        draft: editing.draft,
        gameType: editing.gameType,
        gameData: editing.gameData,
      };
    }
    return {
      id: undefined as string | undefined,
      title: '',
      category: 'autonomía personal' as ActivityCategory,
      type: 'guiada' as ActivityType,
      difficulty: 'fácil' as 'fácil' | 'medio' | 'avanzado',
      duration: '10 min',
      objective: '',
      description: '',
      steps: [''],
      stepIcons: ['📌'],
      points: 30,
      completionMessage: '¡Bien hecho!',
      assignedToIds: [] as string[],
      dueDate: '',
      notes: '',
      draft: true,
      gameType: undefined as undefined | import('@/data/miniGames').GameType,
      gameData: undefined as undefined | import('@/data/miniGames').GameData,
    };
  });
  const [gameContentText, setGameContentText] = useState(() =>
    serializeGameContent(form.gameType, form.gameData)
  );

  const applyTemplate = (tpl: ActivityTemplate | GameTemplate) => {
    const isGame = (tpl as GameTemplate).gameType !== undefined;
    const nextGameType = isGame ? (tpl as GameTemplate).gameType : undefined;
    const nextGameData = isGame ? (tpl as GameTemplate).gameData : undefined;
    setForm(prev => ({
      ...prev,
      title: tpl.id === 'tpl-blank' ? '' : tpl.name,
      category: tpl.category,
      type: tpl.type,
      difficulty: tpl.difficulty,
      duration: tpl.duration,
      objective: tpl.objective,
      description: tpl.description,
      steps: [...tpl.steps],
      stepIcons: [...tpl.stepIcons],
      points: tpl.points,
      completionMessage: tpl.completionMessage,
      gameType: nextGameType,
      gameData: nextGameData,
    }));
    setGameContentText(serializeGameContent(nextGameType, nextGameData));
    setStep(1);
  };

  const updateStep = (i: number, value: string) =>
    setForm(prev => ({ ...prev, steps: prev.steps.map((s, idx) => idx === i ? value : s) }));
  const updateIcon = (i: number, icon: string) =>
    setForm(prev => ({ ...prev, stepIcons: prev.stepIcons.map((s, idx) => idx === i ? icon : s) }));
  const addStep = () => setForm(prev => ({ ...prev, steps: [...prev.steps, ''], stepIcons: [...prev.stepIcons, '📌'] }));
  const removeStep = (i: number) => setForm(prev => ({
    ...prev,
    steps: prev.steps.filter((_, idx) => idx !== i),
    stepIcons: prev.stepIcons.filter((_, idx) => idx !== i),
  }));
  const moveStep = (i: number, dir: -1 | 1) => setForm(prev => {
    const j = i + dir;
    if (j < 0 || j >= prev.steps.length) return prev;
    const steps = [...prev.steps]; const icons = [...prev.stepIcons];
    [steps[i], steps[j]] = [steps[j], steps[i]];
    [icons[i], icons[j]] = [icons[j], icons[i]];
    return { ...prev, steps, stepIcons: icons };
  });

  const toggleAssign = (uid: string) => setForm(prev => ({
    ...prev,
    assignedToIds: prev.assignedToIds.includes(uid)
      ? prev.assignedToIds.filter(x => x !== uid)
      : [...prev.assignedToIds, uid],
  }));

  // Validación por paso
  const errors: Record<number, string | null> = {
    1: !form.title.trim() ? 'Falta el título' : !form.objective.trim() ? 'Falta el objetivo' : null,
    2: form.steps.filter(s => s.trim()).length < 1 ? 'Necesitás al menos 1 paso con texto' : null,
    3: null,
    4: null,
  };
  const canNext = !errors[step];

  const persist = async (publishNow: boolean) => {
    setSaving(true);
    const cleanSteps = form.steps.map((s, i) => ({ s, ic: form.stepIcons[i] || '📌' })).filter(x => x.s.trim());
    try {
      await createOrUpdate({
        id: form.id,
        title: form.title.trim() || 'Actividad sin título',
        category: form.category,
        type: form.type,
        difficulty: form.difficulty,
        duration: form.duration,
        objective: form.objective.trim(),
        description: form.description.trim(),
        steps: cleanSteps.map(x => x.s),
        stepIcons: cleanSteps.map(x => x.ic),
        points: form.points,
        completionMessage: form.completionMessage,
        assignedToIds: form.assignedToIds,
        assignedTo: form.assignedToIds[0],
        dueDate: form.dueDate || undefined,
        notes: form.notes,
        draft: !publishNow,
        gameType: form.gameType,
        gameData: form.gameData,
      } as any);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const q = tplSearch.toLowerCase();
  const filteredTpls = ACTIVITY_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(q) || t.tags.some(tag => tag.includes(q))
  );
  const filteredGameTpls = GAME_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(q) || t.tags.some(tag => tag.includes(q))
  );

  const stepsLabels = ['Plantilla', 'Datos básicos', 'Pasos', 'Asignar', 'Revisar'];

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            <h2 className="font-heading font-bold text-lg sm:text-xl text-foreground">
              {editing ? 'Editar actividad' : 'Crear actividad'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg" aria-label="Cerrar"><X size={20} /></button>
        </div>

        {/* Stepper */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {stepsLabels.map((lbl, i) => (
            <button
              key={i}
              onClick={() => { if (i === 0 || !errors[Math.min(step, i)] || i < step) setStep(i); }}
              className={`flex-1 min-w-[80px] text-[11px] sm:text-xs px-2 py-2 rounded-lg border transition-colors ${
                step === i ? 'gradient-primary text-primary-foreground border-transparent font-semibold'
                : i < step ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-card text-muted-foreground border-border'
              }`}
            >
              <span className="block font-bold">{i + 1}</span>
              <span className="block truncate">{lbl}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="bg-card rounded-xl border border-border p-4 sm:p-5"
          >
            {/* Paso 0 — Plantilla */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">Elegí una plantilla</h3>
                  <p className="text-xs text-muted-foreground">Te ahorra tiempo. Después podés modificar todo. Incluye actividades guiadas y <span className="font-semibold text-primary">mini-juegos</span> 🎮.</p>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={tplSearch} onChange={e => setTplSearch(e.target.value)} placeholder="Buscar plantilla…" className="pl-9" />
                </div>

                {/* Mini-juegos */}
                {filteredGameTpls.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Gamepad2 size={14} className="text-primary" />
                      <h4 className="text-sm font-semibold text-foreground">Mini-juegos interactivos</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{filteredGameTpls.length}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredGameTpls.map(tpl => (
                        <button
                          key={tpl.id}
                          onClick={() => applyTemplate(tpl)}
                          className="text-left p-3 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/10 hover:border-primary transition-colors flex gap-3"
                        >
                          <span className="text-2xl shrink-0">{tpl.emoji}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="font-medium text-sm text-foreground truncate">{tpl.name}</p>
                              <span className="text-[9px] px-1 py-0.5 rounded bg-primary text-primary-foreground font-bold">JUEGO</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">{tpl.gameType} · {tpl.duration}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{tpl.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actividades guiadas */}
                {filteredTpls.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-primary" /> Actividades guiadas
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredTpls.map(tpl => (
                        <button
                          key={tpl.id}
                          onClick={() => applyTemplate(tpl)}
                          className="text-left p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/40 transition-colors flex gap-3"
                        >
                          <span className="text-2xl shrink-0">{tpl.emoji}</span>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{tpl.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{tpl.category} · {tpl.duration}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{tpl.description || 'Empezar desde cero'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Paso 1 — Datos básicos */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-heading font-semibold text-foreground">Datos básicos</h3>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Título *</label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ej: Preparar la mochila" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Objetivo *</label>
                  <Input value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} placeholder="¿Qué se busca lograr?" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Breve descripción de la actividad…"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Categoría</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as ActivityCategory })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ActivityType })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      {TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Dificultad</label>
                    <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value as any })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      {DIFFICULTIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Duración</label>
                    <select value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      {DURATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Puntos al completar: {form.points}</label>
                  <input type="range" min={10} max={150} step={10} value={form.points} onChange={e => setForm({ ...form, points: Number(e.target.value) })} className="w-full accent-primary" />
                </div>
              </div>
            )}

            {/* Paso 2 — Pasos */}
            {step === 2 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-semibold text-foreground">{form.gameType ? 'Contenido y pasos' : 'Pasos secuenciales'}</h3>
                  <Button size="sm" variant="outline" onClick={addStep}><Plus size={14} className="mr-1" />Agregar</Button>
                </div>
                {form.gameType && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Contenido del juego: {form.gameType}</p>
                        <p className="text-xs text-muted-foreground">{contentHelp(form.gameType)}</p>
                      </div>
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">editable</span>
                    </div>
                    <textarea
                      value={gameContentText}
                      onChange={e => {
                        const nextText = e.target.value;
                        setGameContentText(nextText);
                        setForm(prev => ({
                          ...prev,
                          gameData: prev.gameType ? parseGameContent(prev.gameType, nextText, prev.gameData) : prev.gameData,
                        }));
                      }}
                      rows={6}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Carga el contenido del juego..."
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Pictograma + texto. Mantené pasos cortos y concretos.</p>
                <div className="space-y-2">
                  {form.steps.map((s, i) => (
                    <div key={i} className="flex gap-2 items-start bg-muted/30 rounded-lg p-2">
                      <div className="flex flex-col gap-0.5 pt-1">
                        <button onClick={() => moveStep(i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs">▲</button>
                        <GripVertical size={12} className="text-muted-foreground" />
                        <button onClick={() => moveStep(i, 1)} disabled={i === form.steps.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs">▼</button>
                      </div>
                      <details className="relative">
                        <summary className="list-none cursor-pointer w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-xl">
                          {form.stepIcons[i] || '📌'}
                        </summary>
                        <div className="absolute z-10 mt-1 left-0 w-64 p-2 bg-card border border-border rounded-lg shadow-lg grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                          {STEP_ICON_OPTIONS.map(ic => (
                            <button key={ic} onClick={(e) => { updateIcon(i, ic); (e.currentTarget.closest('details') as any).open = false; }} className="w-7 h-7 rounded hover:bg-muted text-lg">{ic}</button>
                          ))}
                        </div>
                      </details>
                      <Input value={s} onChange={e => updateStep(i, e.target.value)} placeholder={`Paso ${i + 1}`} className="flex-1" />
                      <button onClick={() => removeStep(i)} disabled={form.steps.length === 1} className="p-2 text-destructive disabled:opacity-30 hover:bg-destructive/10 rounded-md" aria-label="Eliminar paso"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Mensaje al completar</label>
                  <Input value={form.completionMessage} onChange={e => setForm({ ...form, completionMessage: e.target.value })} placeholder="¡Excelente trabajo!" />
                </div>
              </div>
            )}

            {/* Paso 3 — Asignar */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-heading font-semibold text-foreground">Asignar a vinculados</h3>
                {linkedUserIds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay usuarios vinculados. Podés guardar como borrador y asignar luego.</p>
                ) : (
                  <div className="space-y-2">
                    {assignableUsers.filter(u => linkedUserIds.includes(u.id)).map(u => {
                      const checked = form.assignedToIds.includes(u.id);
                      return (
                        <button key={u.id} onClick={() => toggleAssign(u.id)} className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${checked ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'}`}>
                          <span className="text-2xl">{u.avatar}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.age} años · Nivel {u.level}</p>
                          </div>
                          <span className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs ${checked ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}`}>
                            {checked ? '✓' : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Fecha límite (opcional)</label>
                  <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nota interna (no visible para el usuario)</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Observaciones para tu seguimiento…" />
                </div>
              </div>
            )}

            {/* Paso 4 — Revisar */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="font-heading font-semibold text-foreground">Revisar y publicar</h3>
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <p className="font-bold text-foreground">{form.title || 'Sin título'}</p>
                  <p className="text-xs text-muted-foreground">{form.category} · {form.type} · {form.difficulty} · {form.duration} · {form.points} pts</p>
                  <p className="text-sm text-foreground">🎯 {form.objective}</p>
                  {form.description && <p className="text-sm text-muted-foreground">{form.description}</p>}
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-foreground mb-1">Pasos ({form.steps.filter(s=>s.trim()).length}):</p>
                    <ol className="space-y-1">
                      {form.steps.filter(s => s.trim()).map((s, i) => (
                        <li key={i} className="text-xs text-foreground flex gap-2"><span>{form.stepIcons[i] || '📌'}</span>{s}</li>
                      ))}
                    </ol>
                  </div>
                  <div className="pt-2 text-xs">
                    <span className="text-muted-foreground">Asignada a: </span>
                    <span className="text-foreground">
                      {form.assignedToIds.length === 0 ? '— (borrador)' : form.assignedToIds.map(id => assignableUsers.find(u => u.id === id)?.name.split(' ')[0]).filter(Boolean).join(', ')}
                    </span>
                  </div>
                  {form.dueDate && <p className="text-xs text-muted-foreground">📅 Hasta {form.dueDate}</p>}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => persist(false)} disabled={saving}>
                    <Save size={14} className="mr-1" /> Guardar como borrador
                  </Button>
                  <Button className="flex-1 gradient-primary text-primary-foreground" onClick={() => persist(true)} disabled={saving || form.assignedToIds.length === 0}>
                    <Send size={14} className="mr-1" /> Publicar y asignar
                  </Button>
                </div>
                {form.assignedToIds.length === 0 && <p className="text-xs text-muted-foreground text-center">Asigná al menos un usuario para publicar.</p>}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Nav */}
        {step < 4 && (
          <div className="flex items-center justify-between mt-4">
            <Button variant="ghost" onClick={() => step === 0 ? onClose() : setStep(step - 1)}>
              <ChevronLeft size={14} className="mr-1" /> {step === 0 ? 'Cancelar' : 'Atrás'}
            </Button>
            {errors[step] && <span className="text-xs text-destructive">{errors[step]}</span>}
            <Button className="gradient-primary text-primary-foreground" disabled={!canNext} onClick={() => setStep(step + 1)}>
              Siguiente <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
