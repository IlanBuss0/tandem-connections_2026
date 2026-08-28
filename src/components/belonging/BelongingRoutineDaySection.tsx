import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, Copy, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useRoutines, DayKey, predefinedCategories, predefinedLabels } from '@/contexts/RoutinesContext';
import { fetchPictograms, rememberPictogramChoice, RoutineItem } from '@/data/api';
import { useAuth } from '@/contexts/AuthContext';
import SpeakButton from '@/components/SpeakButton';
import StartTaskHint from '@/components/StartTaskHint';
import GuidedRoutineMode from '@/components/GuidedRoutineMode';
import { isPermissionEnabled, PERTENECIENTE_PERMISSIONS, usePermissionContext } from '@/hooks/usePermissions';
import SectionSelector from '@/components/SectionSelector';
import RoutinePictogram from '@/components/RoutinePictogram';
import RoutinePictogramPicker from '@/components/RoutinePictogramPicker';
import { useRoutinePictograms } from '@/hooks/useRoutinePictograms';
import type { Pictogram } from '@/data/api';

const reminderChoices = [
  { value: -60, label: '1 hora antes' }, { value: -30, label: '30 min antes' },
  { value: -15, label: '15 min antes' }, { value: -10, label: '10 min antes' },
  { value: -5, label: '5 min antes' }, { value: 0, label: 'En el momento' },
  { value: 5, label: '5 min después' }, { value: 10, label: '10 min después' },
  { value: 15, label: '15 min después' },
];

function autoPictogramLabel(title: string): string {
  const words = title.trim().split(/\s+/);
  if (words.length <= 1) return title;
  const skip = ['la','el','los','las','mi','tu','su','un','una','de','del','en','y','a','con','por','para'];
  const meaningful = words.filter(w => !skip.includes(w.toLowerCase()));
  return meaningful.length > 0 ? meaningful[meaningful.length - 1] : words[words.length - 1];
}

// Seccion "Rutina" del detalle del dia en el Calendario. Reemplaza el tab
// "Mi dia": conserva todo lo que se podia hacer ahi (completar pasos,
// crear/editar/duplicar/eliminar rutinas y pasos, modo guiado, vista de
// pictogramas) pero contextualizado al dia de la semana que se esta viendo.
export default function BelongingRoutineDaySection({
  dayOfWeek,
  initialRoutineId,
  initialItemId,
}: {
  dayOfWeek: DayKey;
  initialRoutineId?: string;
  initialItemId?: string;
}) {
  const { user } = useAuth();
  const { context: permissionContext } = usePermissionContext();
  const {
    routines, addRoutine, renameRoutine, deleteRoutine, duplicateRoutine,
    addItem, updateItem, deleteItem, toggleItem, dayNames,
    customCategories, hiddenPredefined,
  } = useRoutines();

  const canUseMiDia = isPermissionEnabled(
    permissionContext?.perteneciente?.permisos_efectivos?.permisos,
    PERTENECIENTE_PERMISSIONS.USAR_MI_DIA,
    true,
  );

  const bondedId = routines.find(r => r.dayOfWeek === dayOfWeek)?.id ?? null;
  const deepRoutineId = initialRoutineId && routines.some(r => r.id === initialRoutineId) ? initialRoutineId : null;
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (deepRoutineId) setActiveId(deepRoutineId);
    else setActiveId(bondedId);
  }, [dayOfWeek, bondedId, deepRoutineId]);

  const active = useMemo(() => routines.find(r => r.id === activeId) || null, [routines, activeId]);
  useRoutinePictograms(active);

  const [editingDay, setEditingDay] = useState(false);
  const [dayName, setDayName] = useState('');
  const [dayDow, setDayDow] = useState<string>('null');
  const [dayDate, setDayDate] = useState('');

  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<RoutineItem | null>(null);
  const [form, setForm] = useState<{ time: string; title: string; category: string; pictogramLabel: string; reminders: number[] }>({
    time: '08:00', title: '', category: 'mañana', pictogramLabel: '', reminders: [],
  });
  const [manualPictogram, setManualPictogram] = useState<Pictogram | null>(null);
  const [liveSuggestions, setLiveSuggestions] = useState<Pictogram[]>([]);
  const suggestionRequestRef = useRef(0);

  useEffect(() => {
    const title = form.title.trim();
    if (title.length < 3 || manualPictogram) {
      setLiveSuggestions([]);
      return;
    }
    const requestId = ++suggestionRequestRef.current;
    const timer = window.setTimeout(() => {
      fetchPictograms({ search: title, language: 'es', limit: 5, boostForUsuarioId: user?.id })
        .then(items => { if (suggestionRequestRef.current === requestId) setLiveSuggestions(items); })
        .catch(() => { if (suggestionRequestRef.current === requestId) setLiveSuggestions([]); });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [form.title, manualPictogram, user?.id]);

  const [pictogramView, setPictogramView] = useState(false);

  const allCategories = useMemo(() => {
    const visiblePredefined = predefinedCategories.filter(c => !hiddenPredefined.includes(c));
    return [...visiblePredefined, ...customCategories.map(c => c.id)];
  }, [customCategories, hiddenPredefined]);

  const allLabels = useMemo(() => {
    const labels = { ...predefinedLabels };
    customCategories.forEach(c => { labels[c.id] = c.name; });
    return labels;
  }, [customCategories]);

  if (!canUseMiDia) {
    return (
      <section aria-labelledby="calendar-routine-title" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-amber-950">
        <h3 id="calendar-routine-title" className="text-sm font-extrabold uppercase tracking-wide text-[#5f477c]">Rutina</h3>
        <p className="mt-1.5 text-xs leading-relaxed">
          Tu tutor deshabilitó temporalmente Mi día. No podés ver ni completar rutinas hasta que lo vuelva a habilitar.
        </p>
      </section>
    );
  }

  const completed = active ? active.items.filter(r => r.completed).length : 0;
  const total = active ? Math.max(active.items.length, 1) : 1;

  const startDayEdit = () => {
    if (!active) return;
    setDayName(active.name);
    setDayDow(active.dayOfWeek === null ? 'null' : String(active.dayOfWeek));
    setDayDate(active.date || '');
    setEditingDay(true);
  };
  const saveDayEdit = () => {
    if (!active) return;
    renameRoutine(active.id, dayName.trim() || 'Mi día', dayDow === 'null' ? null : Number(dayDow) as DayKey, dayDate || undefined);
    setEditingDay(false);
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm({ time: '08:00', title: '', category: 'mañana', pictogramLabel: '', reminders: [] });
    setManualPictogram(null);
    setLiveSuggestions([]);
    setShowAddItem(true);
  };
  const openEdit = (it: RoutineItem) => {
    setEditingItem(it);
    setForm({ time: it.time, title: it.title, category: it.category, pictogramLabel: it.pictogramLabel || '', reminders: it.reminders || [] });
    setManualPictogram(null);
    setLiveSuggestions([]);
    setShowAddItem(true);
  };
  const submitItem = () => {
    if (!active) return;
    const title = form.title.trim();
    if (!title) return;
    const pictogramLabel = form.pictogramLabel.trim() || autoPictogramLabel(title);
    const payload = {
      ...form, title, pictogramLabel, icon: '',
      ...(manualPictogram ? {
        pictogramId: manualPictogram.id,
        pictogramImageUrl: manualPictogram.imageUrl,
        pictogramName: manualPictogram.name,
        pictogramConfidence: 'alta' as const,
        pictogramResolvedFor: title,
      } : {}),
    };
    if (editingItem) updateItem(active.id, editingItem.id, payload);
    else addItem(active.id, payload);
    if (manualPictogram) void rememberPictogramChoice(title, manualPictogram.id);
    setShowAddItem(false);
  };

  return (
    <section aria-labelledby="calendar-routine-title" className="mt-4 border-t border-[#eee5f7] pt-3.5">
      <h3 id="calendar-routine-title" className="text-sm font-extrabold uppercase tracking-wide text-[#5f477c]">Rutina</h3>

      {!active ? (
        <div className="mt-2 rounded-2xl border border-dashed border-[#e0d8f0] bg-[#faf8ff] px-3 py-3">
          <p className="text-sm font-semibold text-[#4a4a5a]">No hay rutina asignada a los {dayNames[dayOfWeek]}.</p>
          <button
            type="button"
            onClick={() => { const id = addRoutine(`Rutina ${dayNames[dayOfWeek]}`, dayOfWeek); setActiveId(id); }}
            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#6b4c9a] text-white text-xs font-semibold shadow-md shadow-purple-200 hover:bg-[#5a3c8a]"
          >
            <Plus size={14} /> Crear rutina
          </button>
          {routines.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] text-[#8b7aa0] mb-1">O usar una existente:</p>
              <select
                value=""
                onChange={e => { if (e.target.value) setActiveId(e.target.value); }}
                className="w-full p-2 rounded-xl border border-[#ede4f8] bg-white text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30"
              >
                <option value="">Elegir rutina…</option>
                {routines.filter(r => r.id !== bondedId).map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.dayOfWeek !== null ? dayNames[r.dayOfWeek] : 'Sin día'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-2 space-y-3">
          <div className="bg-white rounded-2xl border border-[#f0e8f8] p-3">
            {!editingDay ? (
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <select
                  value={active.id}
                  onChange={e => setActiveId(e.target.value)}
                  aria-label="Rutina"
                  className="min-w-0 max-w-full flex-1 truncate rounded-xl border border-[#ede4f8] bg-[#faf8ff] p-2 text-sm font-bold text-[#6b4c9a] outline-none focus:border-[#6b4c9a]/30"
                >
                  {routines.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} · {r.dayOfWeek !== null ? dayNames[r.dayOfWeek] : 'Sin día'}
                    </option>
                  ))}
                </select>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={startDayEdit} className="p-2 rounded-xl hover:bg-[#f5f0ff] text-[#8b7aa0]" title="Editar rutina"><Pencil size={14} /></button>
                  <button type="button" onClick={() => duplicateRoutine(active.id)} className="p-2 rounded-xl hover:bg-[#f5f0ff] text-[#8b7aa0]" title="Duplicar"><Copy size={14} /></button>
                  <button
                    type="button"
                    onClick={() => { if (confirm('¿Eliminar esta rutina?')) { deleteRoutine(active.id); setActiveId(bondedId); } }}
                    className="p-2 rounded-xl hover:bg-destructive/10 text-destructive" title="Eliminar"
                  ><Trash2 size={14} /></button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <input value={dayName} onChange={e => setDayName(e.target.value)} placeholder="Nombre" className="w-full p-2 rounded-xl border border-[#ede4f8] bg-[#faf8ff] text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30" />
                <select value={dayDow} onChange={e => setDayDow(e.target.value)} className="w-full p-2 rounded-xl border border-[#ede4f8] bg-[#faf8ff] text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30">
                  <option value="null">Sin día asignado</option>
                  {dayNames.map((n, i) => <option key={i} value={i}>{n}</option>)}
                </select>
                <div className="flex gap-2">
                  <button type="button" onClick={saveDayEdit} className="flex-1 py-2 rounded-xl bg-[#6b4c9a] text-white text-xs font-semibold hover:bg-[#5a3c8a] inline-flex items-center justify-center gap-1"><Save size={12} /> Guardar</button>
                  <button type="button" onClick={() => setEditingDay(false)} className="px-3 py-2 rounded-xl border border-[#ede4f8] text-xs text-[#6b4c9a] font-semibold bg-[#faf8ff] hover:bg-[#f5f0ff]">Cancelar</button>
                </div>
              </div>
            )}

            <div className="mt-3 flex justify-between items-center mb-1.5">
              <span className="text-xs font-medium text-[#4a4a5a]">Progreso</span>
              <span className="text-xs font-bold text-[#6b4c9a]">{Math.round((completed / total) * 100)}% · {completed}/{active.items.length}</span>
            </div>
            <div className="w-full bg-[#f0e8f8] rounded-full h-2.5">
              <motion.div className="bg-[#6b4c9a] h-2.5 rounded-full" initial={{ width: 0 }} animate={{ width: `${(completed / total) * 100}%` }} />
            </div>

            {active.items.length > 0 && (
              <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                <GuidedRoutineMode routineId={active.id} items={active.items} />
                <button
                  type="button"
                  onClick={() => setPictogramView(v => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold bg-[#6b4c9a] text-white border-transparent hover:bg-[#5a3c8a]"
                >
                  {pictogramView ? '📝 Texto' : '🖼️ Pictograma'}
                </button>
              </div>
            )}
          </div>

          {showAddItem && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white rounded-2xl p-3 border border-[#6b4c9a]/20 shadow-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-[#4a4a5a]">{editingItem ? 'Editar paso' : 'Nuevo paso'}</h4>
                <button type="button" onClick={() => setShowAddItem(false)}><X size={16} className="text-[#8b7aa0]" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="p-2 rounded-xl border border-[#ede4f8] bg-[#faf8ff] text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30" />
                <SectionSelector value={form.category} onChange={cat => setForm(f => ({ ...f, category: cat }))} />
              </div>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="¿Qué tenés que hacer?" className="w-full p-2 rounded-xl border border-[#ede4f8] bg-[#faf8ff] text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30" />
              {liveSuggestions.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                  {liveSuggestions.map(picto => (
                    <button key={picto.id} type="button" onClick={() => { setManualPictogram(picto); setLiveSuggestions([]); }} title={picto.name} className="shrink-0 flex flex-col items-center gap-0.5 rounded-xl border border-[#ede4f8] bg-white p-1.5 hover:border-[#6b4c9a] hover:bg-[#faf8ff]">
                      {picto.imageUrl ? <img src={picto.imageUrl} alt={picto.name} className="h-8 w-8 object-contain" loading="lazy" /> : <span className="text-lg">{picto.emoji}</span>}
                      <span className="text-[9px] text-[#8b7aa0] max-w-[3.5rem] truncate">{picto.name}</span>
                    </button>
                  ))}
                </div>
              )}
              <input value={form.pictogramLabel} onChange={e => setForm(f => ({ ...f, pictogramLabel: e.target.value }))} placeholder="Etiqueta para pictograma (opcional)" className="w-full p-2 rounded-xl border border-[#ede4f8] bg-[#faf8ff] text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30" />
              <div>
                <p className="text-xs text-[#8b7aa0] mb-1 flex items-center gap-2">
                  Pictograma
                  {manualPictogram && (
                    <span className="inline-flex items-center gap-1 text-[#6b4c9a] font-medium">
                      <img src={manualPictogram.imageUrl} alt="" className="h-4 w-4 object-contain" />
                      {manualPictogram.name}
                      <button type="button" onClick={() => setManualPictogram(null)} className="text-[#8b7aa0] hover:text-red-500">✕</button>
                    </span>
                  )}
                </p>
                <RoutinePictogramPicker onSelect={setManualPictogram} targetUsuarioId={user?.id} />
              </div>
              <div>
                <p className="text-xs text-[#8b7aa0] mb-1.5">Avisarme</p>
                <div className="flex flex-wrap gap-1.5">
                  {reminderChoices.map(choice => {
                    const selected = form.reminders.includes(choice.value);
                    return <button key={choice.value} type="button" onClick={() => setForm(current => ({ ...current, reminders: selected ? current.reminders.filter(value => value !== choice.value) : [...current.reminders, choice.value].sort((a, b) => a - b) }))} className={`rounded-lg border px-2 py-1 text-[11px] font-medium ${selected ? 'border-[#6b4c9a] bg-[#f5f0ff] text-[#6b4c9a]' : 'border-[#ede4f8] text-[#8b7aa0]'}`}>{choice.label}</button>;
                  })}
                </div>
              </div>
              <button type="button" onClick={submitItem} className="w-full py-2 rounded-xl bg-[#6b4c9a] text-white text-sm font-semibold shadow-md shadow-purple-200 hover:bg-[#5a3c8a]">
                {editingItem ? 'Guardar cambios' : 'Agregar paso'}
              </button>
            </motion.div>
          )}

          {!showAddItem && (
            <button type="button" onClick={openCreate} className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#e0d8f0] text-[#8b7aa0] hover:border-[#6b4c9a] hover:text-[#6b4c9a] hover:bg-[#faf8ff] text-sm inline-flex items-center justify-center gap-2">
              <Plus size={16} /> Agregar paso
            </button>
          )}

          {active.items.length > 0 && (
            <div className="space-y-3">
              {allCategories.map(cat => {
                const catItems = active.items.filter(it => it.category === cat);
                if (catItems.length === 0) return null;
                return (
                  <div key={cat} className="space-y-1.5">
                    <h4 className="text-xs font-bold text-[#6b4c9a] uppercase tracking-wide">{allLabels[cat] || cat}</h4>
                    {!pictogramView ? (
                      <div className="space-y-1.5">
                        {catItems.map((item, i) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className={`group flex items-center gap-2.5 rounded-xl border p-2.5 transition-all ${initialItemId === item.id ? 'ring-2 ring-[#6b4c9a] border-[#6b4c9a]' : ''} ${item.completed ? 'bg-green-50 border-green-200' : 'bg-white border-[#f0e8f8] hover:border-[#d8c7ef]'}`}
                          >
                            <button type="button" onClick={() => toggleItem(active.id, item.id)} className="shrink-0" aria-label={item.completed ? 'Marcar pendiente' : 'Marcar completado'}>
                              {item.completed ? <CheckCircle2 size={19} className="text-green-500" /> : <Circle size={19} className="text-[#8b7aa0]" />}
                            </button>
                            {item.pictogramImageUrl ? (
                              <img src={item.pictogramImageUrl} alt={item.pictogramName ?? item.title} className="h-7 w-7 shrink-0 object-contain" loading="lazy" />
                            ) : (
                              <span className="text-lg shrink-0">{item.icon}</span>
                            )}
                            <div className="flex-1 text-left min-w-0">
                              <p className={`text-[13px] font-medium truncate ${item.completed ? 'line-through text-[#8b7aa0]' : 'text-[#4a4a5a]'}`}>{item.title}</p>
                              {(item.reminders?.length || 0) > 0 && <p className="text-[10px] text-[#6b4c9a]">🔔 {item.reminders!.length} aviso{item.reminders!.length === 1 ? '' : 's'}</p>}
                            </div>
                            <span className="text-[11px] text-[#8b7aa0] flex items-center gap-0.5"><Clock size={11} /> {item.time}</span>
                            <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <SpeakButton text={item.pictogramLabel || item.title} size={11} className="p-1.5" />
                              <button type="button" onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-[#f5f0ff] text-[#8b7aa0]" title="Editar"><Pencil size={11} /></button>
                              <button type="button" onClick={() => deleteItem(active.id, item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="Eliminar"><Trash2 size={11} /></button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {catItems.map((item, i) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className={`group relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-pointer ${item.completed ? 'bg-green-50 border-green-300' : 'bg-white border-[#d8c7ef] hover:border-[#6b4c9a] hover:shadow-md'}`}
                            onClick={() => toggleItem(active.id, item.id)}
                          >
                            <RoutinePictogram item={item} size="sm" />
                            <span className="text-xs font-semibold text-[#4a4a5a] text-center leading-tight">{item.pictogramLabel || item.title}</span>
                            <span className="text-[10px] text-[#8b7aa0] flex items-center gap-0.5"><Clock size={9} /> {item.time}</span>
                            <span className="absolute top-1 right-1">
                              {item.completed ? <CheckCircle2 size={15} className="text-green-500" /> : <Circle size={15} className="text-[#8b7aa0]" />}
                            </span>
                            <div className="absolute top-1 left-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <SpeakButton text={item.pictogramLabel || item.title} size={8} className="p-0.5" />
                              <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(item); }} className="p-0.5 rounded hover:bg-[#f5f0ff] text-[#8b7aa0]"><Pencil size={9} /></button>
                              <button type="button" onClick={(e) => { e.stopPropagation(); deleteItem(active.id, item.id); }} className="p-0.5 rounded hover:bg-red-50 text-red-400"><Trash2 size={9} /></button>
                            </div>
                            {!item.completed && (
                              <div className="mt-0.5" onClick={(e) => e.stopPropagation()}>
                                <StartTaskHint stepTitle={item.pictogramLabel || item.title} />
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}