import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  useRoutines,
  DayKey,
  predefinedCategories,
  predefinedLabels,
} from "@/contexts/RoutinesContext";
import {
  fetchPictograms,
  rememberPictogramChoice,
  RoutineItem,
} from "@/data/api";
import { useAuth } from "@/contexts/AuthContext";
import GuidedRoutineMode from "@/components/GuidedRoutineMode";
import {
  isPermissionEnabled,
  PERTENECIENTE_PERMISSIONS,
  usePermissionContext,
} from "@/hooks/usePermissions";
import SectionSelector from "@/components/SectionSelector";
import BelongingRoutineStep from "./BelongingRoutineStep";
import RoutinePictogramPicker from "@/components/RoutinePictogramPicker";
import { useRoutinePictograms } from "@/hooks/useRoutinePictograms";
import type { Pictogram } from "@/data/api";

const reminderChoices = [
  { value: -60, label: "1 hora antes" },
  { value: -30, label: "30 min antes" },
  { value: -15, label: "15 min antes" },
  { value: -10, label: "10 min antes" },
  { value: -5, label: "5 min antes" },
  { value: 0, label: "En el momento" },
  { value: 5, label: "5 min después" },
  { value: 10, label: "10 min después" },
  { value: 15, label: "15 min después" },
];

function autoPictogramLabel(title: string): string {
  const words = title.trim().split(/\s+/);
  if (words.length <= 1) return title;
  const skip = [
    "la",
    "el",
    "los",
    "las",
    "mi",
    "tu",
    "su",
    "un",
    "una",
    "de",
    "del",
    "en",
    "y",
    "a",
    "con",
    "por",
    "para",
  ];
  const meaningful = words.filter((w) => !skip.includes(w.toLowerCase()));
  return meaningful.length > 0
    ? meaningful[meaningful.length - 1]
    : words[words.length - 1];
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
    routines,
    addRoutine,
    renameRoutine,
    deleteRoutine,
    duplicateRoutine,
    addItem,
    updateItem,
    deleteItem,
    toggleItem,
    dayNames,
    customCategories,
    hiddenPredefined,
  } = useRoutines();

  const canUseMiDia = isPermissionEnabled(
    permissionContext?.perteneciente?.permisos_efectivos?.permisos,
    PERTENECIENTE_PERMISSIONS.USAR_MI_DIA,
    true,
  );

  const bondedId = routines.find((r) => r.dayOfWeek === dayOfWeek)?.id ?? null;
  const deepRoutineId =
    initialRoutineId && routines.some((r) => r.id === initialRoutineId)
      ? initialRoutineId
      : null;
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (deepRoutineId) setActiveId(deepRoutineId);
    else setActiveId(bondedId);
  }, [dayOfWeek, bondedId, deepRoutineId]);

  const active = useMemo(
    () => routines.find((r) => r.id === activeId) || null,
    [routines, activeId],
  );
  useRoutinePictograms(active);

  const [editingDay, setEditingDay] = useState(false);
  const [dayName, setDayName] = useState("");
  const [dayDow, setDayDow] = useState<string>("null");
  const [dayDate, setDayDate] = useState("");

  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<RoutineItem | null>(null);
  const [form, setForm] = useState<{
    time: string;
    title: string;
    category: string;
    pictogramLabel: string;
    reminders: number[];
  }>({
    time: "08:00",
    title: "",
    category: "mañana",
    pictogramLabel: "",
    reminders: [],
  });
  const [manualPictogram, setManualPictogram] = useState<Pictogram | null>(
    null,
  );
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
      fetchPictograms({
        search: title,
        language: "es",
        limit: 5,
        boostForUsuarioId: user?.id,
      })
        .then((items) => {
          if (suggestionRequestRef.current === requestId)
            setLiveSuggestions(items);
        })
        .catch(() => {
          if (suggestionRequestRef.current === requestId)
            setLiveSuggestions([]);
        });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [form.title, manualPictogram, user?.id]);

  const [pictogramView, setPictogramView] = useState(false);

  const allCategories = useMemo(() => {
    const visiblePredefined = predefinedCategories.filter(
      (c) => !hiddenPredefined.includes(c),
    );
    return [...visiblePredefined, ...customCategories.map((c) => c.id)];
  }, [customCategories, hiddenPredefined]);

  const allLabels = useMemo(() => {
    const labels = { ...predefinedLabels };
    customCategories.forEach((c) => {
      labels[c.id] = c.name;
    });
    return labels;
  }, [customCategories]);

  if (!canUseMiDia) {
    return (
      <section
        aria-labelledby="calendar-routine-title"
        className="min-w-0 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-950"
      >
        <h3
          id="calendar-routine-title"
          className="text-sm font-extrabold uppercase tracking-wide text-[#5f477c]"
        >
          El paso a paso de hoy
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed">
          Tu tutor deshabilitó temporalmente Mi día. No podés ver ni completar
          rutinas hasta que lo vuelva a habilitar.
        </p>
      </section>
    );
  }

  const completed = active ? active.items.filter((r) => r.completed).length : 0;
  const total = active ? Math.max(active.items.length, 1) : 1;

  const startDayEdit = () => {
    if (!active) return;
    setDayName(active.name);
    setDayDow(active.dayOfWeek === null ? "null" : String(active.dayOfWeek));
    setDayDate(active.date || "");
    setEditingDay(true);
  };
  const saveDayEdit = () => {
    if (!active) return;
    renameRoutine(
      active.id,
      dayName.trim() || "Mi día",
      dayDow === "null" ? null : (Number(dayDow) as DayKey),
      dayDate || undefined,
    );
    setEditingDay(false);
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm({
      time: "08:00",
      title: "",
      category: "mañana",
      pictogramLabel: "",
      reminders: [],
    });
    setManualPictogram(null);
    setLiveSuggestions([]);
    setShowAddItem(true);
  };
  const openEdit = (it: RoutineItem) => {
    setEditingItem(it);
    setForm({
      time: it.time,
      title: it.title,
      category: it.category,
      pictogramLabel: it.pictogramLabel || "",
      reminders: it.reminders || [],
    });
    setManualPictogram(null);
    setLiveSuggestions([]);
    setShowAddItem(true);
  };
  const submitItem = () => {
    if (!active) return;
    const title = form.title.trim();
    if (!title) return;
    const pictogramLabel =
      form.pictogramLabel.trim() || autoPictogramLabel(title);
    const payload = {
      ...form,
      title,
      pictogramLabel,
      icon: "",
      ...(manualPictogram
        ? {
            pictogramId: manualPictogram.id,
            pictogramImageUrl: manualPictogram.imageUrl,
            pictogramName: manualPictogram.name,
            pictogramConfidence: "alta" as const,
            pictogramResolvedFor: title,
          }
        : {}),
    };
    if (editingItem) updateItem(active.id, editingItem.id, payload);
    else addItem(active.id, payload);
    if (manualPictogram)
      void rememberPictogramChoice(title, manualPictogram.id);
    setShowAddItem(false);
  };

  return (
    <section
      aria-labelledby="calendar-routine-title"
      className="min-w-0 rounded-3xl border border-[#f0e8f8] bg-white p-4 shadow-lg"
    >
      <h2
        id="calendar-routine-title"
        className="text-xl font-bold text-[#6b4c9a]"
      >
        El paso a paso de hoy
      </h2>

      {!active ? (
        <div className="mt-2 rounded-2xl border border-dashed border-[#e0d8f0] bg-[#faf8ff] px-3 py-3">
          <p className="text-sm font-semibold text-[#4a4a5a]">
            No hay rutina asignada a los {dayNames[dayOfWeek]}.
          </p>
          <button
            type="button"
            onClick={() => {
              const id = addRoutine(`Rutina ${dayNames[dayOfWeek]}`, dayOfWeek);
              setActiveId(id);
            }}
            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#6b4c9a] text-white text-xs font-semibold shadow-md shadow-purple-200 hover:bg-[#5a3c8a]"
          >
            <Plus size={14} /> Crear rutina
          </button>
          {routines.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] text-[#8b7aa0] mb-1">
                O usar una existente:
              </p>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) setActiveId(e.target.value);
                }}
                className="w-full p-2 rounded-xl border border-[#ede4f8] bg-white text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30"
              >
                <option value="">Elegir rutina…</option>
                {routines
                  .filter((r) => r.id !== bondedId)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (
                      {r.dayOfWeek !== null ? dayNames[r.dayOfWeek] : "Sin día"}
                      )
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-2 space-y-3">
          <p className="break-words text-lg font-bold text-[#3f3153]">{active.name}</p>
          <div className="flex flex-wrap items-start gap-2 [&_button]:min-h-11">
            {active.items.length > 0 && (
              <>
                <GuidedRoutineMode routineId={active.id} items={active.items} />
                <button type="button" aria-pressed={pictogramView} onClick={() => setPictogramView(value => !value)} className="min-h-11 rounded-full border border-[#ddcfed] bg-[#faf8ff] px-3 text-xs font-semibold text-[#6b4c9a] hover:bg-[#f5f0ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]">
                  {pictogramView ? "Ver listado" : "Ver paso a paso"}
                </button>
              </>
            )}
            <details className="max-w-full text-sm text-[#6b4c9a] open:w-full">
              <summary className="min-h-11 cursor-pointer rounded-xl px-2 py-3 text-xs font-semibold hover:bg-[#faf8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]">Opciones de rutina</summary>
              <div className="space-y-2 py-2">
            {!editingDay ? (
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <select
                  value={active.id}
                  onChange={(e) => setActiveId(e.target.value)}
                  aria-label="Rutina"
                  className="min-w-0 max-w-full flex-1 truncate rounded-xl border border-[#ede4f8] bg-[#faf8ff] p-2 text-sm font-bold text-[#6b4c9a] outline-none focus:border-[#6b4c9a]/30"
                >
                  {routines.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ·{" "}
                      {r.dayOfWeek !== null ? dayNames[r.dayOfWeek] : "Sin día"}
                    </option>
                  ))}
                </select>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={startDayEdit}
                    className="p-2 rounded-xl hover:bg-[#f5f0ff] text-[#8b7aa0]"
                    title="Editar rutina"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateRoutine(active.id)}
                    className="p-2 rounded-xl hover:bg-[#f5f0ff] text-[#8b7aa0]"
                    title="Duplicar"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("¿Eliminar esta rutina?")) {
                        deleteRoutine(active.id);
                        setActiveId(bondedId);
                      }
                    }}
                    className="p-2 rounded-xl hover:bg-destructive/10 text-destructive"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  value={dayName}
                  onChange={(e) => setDayName(e.target.value)}
                  placeholder="Nombre"
                  className="w-full p-2 rounded-xl border border-[#ede4f8] bg-[#faf8ff] text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30"
                />
                <select
                  value={dayDow}
                  onChange={(e) => setDayDow(e.target.value)}
                  className="w-full p-2 rounded-xl border border-[#ede4f8] bg-[#faf8ff] text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30"
                >
                  <option value="null">Sin día asignado</option>
                  {dayNames.map((n, i) => (
                    <option key={i} value={i}>
                      {n}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveDayEdit}
                    className="flex-1 py-2 rounded-xl bg-[#6b4c9a] text-white text-xs font-semibold hover:bg-[#5a3c8a] inline-flex items-center justify-center gap-1"
                  >
                    <Save size={12} /> Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingDay(false)}
                    className="px-3 py-2 rounded-xl border border-[#ede4f8] text-xs text-[#6b4c9a] font-semibold bg-[#faf8ff] hover:bg-[#f5f0ff]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
              </div>
            </details>
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap justify-between gap-2 text-xs text-[#675a78]">
              <span>{completed} de {active.items.length} pasos completados</span>
              <span className="font-semibold text-[#6b4c9a]">{Math.round((completed / total) * 100)}%</span>
            </div>
            <div role="progressbar" aria-label="Progreso de la rutina" aria-valuenow={Math.round((completed / total) * 100)} aria-valuemin={0} aria-valuemax={100} className="h-1.5 overflow-hidden rounded-full bg-[#eee5fa]">
              <div className="h-full rounded-full bg-[#6b4c9a]" style={{ width: `${(completed / total) * 100}%` }} />
            </div>
          </div>

          {showAddItem && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-white rounded-2xl p-3 border border-[#6b4c9a]/20 shadow-lg space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-[#4a4a5a]">
                  {editingItem ? "Editar paso" : "Nuevo paso"}
                </h4>
                <button type="button" onClick={() => setShowAddItem(false)}>
                  <X size={16} className="text-[#8b7aa0]" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, time: e.target.value }))
                  }
                  className="p-2 rounded-xl border border-[#ede4f8] bg-[#faf8ff] text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30"
                />
                <SectionSelector
                  value={form.category}
                  onChange={(cat) => setForm((f) => ({ ...f, category: cat }))}
                />
              </div>
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="¿Qué tenés que hacer?"
                className="w-full p-2 rounded-xl border border-[#ede4f8] bg-[#faf8ff] text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30"
              />
              {liveSuggestions.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                  {liveSuggestions.map((picto) => (
                    <button
                      key={picto.id}
                      type="button"
                      onClick={() => {
                        setManualPictogram(picto);
                        setLiveSuggestions([]);
                      }}
                      title={picto.name}
                      className="shrink-0 flex flex-col items-center gap-0.5 rounded-xl border border-[#ede4f8] bg-white p-1.5 hover:border-[#6b4c9a] hover:bg-[#faf8ff]"
                    >
                      {picto.imageUrl ? (
                        <img
                          src={picto.imageUrl}
                          alt={picto.name}
                          className="h-8 w-8 object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-lg">{picto.emoji}</span>
                      )}
                      <span className="text-[9px] text-[#8b7aa0] max-w-[3.5rem] truncate">
                        {picto.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <input
                value={form.pictogramLabel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pictogramLabel: e.target.value }))
                }
                placeholder="Etiqueta para pictograma (opcional)"
                className="w-full p-2 rounded-xl border border-[#ede4f8] bg-[#faf8ff] text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30"
              />
              <div>
                <p className="text-xs text-[#8b7aa0] mb-1 flex items-center gap-2">
                  Pictograma
                  {manualPictogram && (
                    <span className="inline-flex items-center gap-1 text-[#6b4c9a] font-medium">
                      <img
                        src={manualPictogram.imageUrl}
                        alt=""
                        className="h-4 w-4 object-contain"
                      />
                      {manualPictogram.name}
                      <button
                        type="button"
                        onClick={() => setManualPictogram(null)}
                        className="text-[#8b7aa0] hover:text-red-500"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                </p>
                <RoutinePictogramPicker
                  onSelect={setManualPictogram}
                  targetUsuarioId={user?.id}
                />
              </div>
              <div>
                <p className="text-xs text-[#8b7aa0] mb-1.5">Avisarme</p>
                <div className="flex flex-wrap gap-1.5">
                  {reminderChoices.map((choice) => {
                    const selected = form.reminders.includes(choice.value);
                    return (
                      <button
                        key={choice.value}
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            reminders: selected
                              ? current.reminders.filter(
                                  (value) => value !== choice.value,
                                )
                              : [...current.reminders, choice.value].sort(
                                  (a, b) => a - b,
                                ),
                          }))
                        }
                        className={`rounded-lg border px-2 py-1 text-[11px] font-medium ${selected ? "border-[#6b4c9a] bg-[#f5f0ff] text-[#6b4c9a]" : "border-[#ede4f8] text-[#8b7aa0]"}`}
                      >
                        {choice.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                type="button"
                onClick={submitItem}
                className="w-full py-2 rounded-xl bg-[#6b4c9a] text-white text-sm font-semibold shadow-md shadow-purple-200 hover:bg-[#5a3c8a]"
              >
                {editingItem ? "Guardar cambios" : "Agregar paso"}
              </button>
            </motion.div>
          )}


          {active.items.length > 0 ? (
            <div className="space-y-4">
              {allCategories.map(category => {
                const items = active.items.filter(item => item.category === category);
                if (!items.length) return null;
                return (
                  <div key={category} className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-[#6b4c9a]">{allLabels[category] || category}</h3>
                    <ol className={pictogramView ? "grid grid-cols-1 gap-3 sm:grid-cols-2" : "space-y-3"}>
                      {items.map(item => (
                        <BelongingRoutineStep
                          key={item.id}
                          item={item}
                          position={active.items.findIndex(step => step.id === item.id) + 1}
                          next={active.items.find(step => !step.completed)?.id === item.id}
                          selected={initialItemId === item.id}
                          visual={pictogramView}
                          onToggle={() => toggleItem(active.id, item.id)}
                          onEdit={() => openEdit(item)}
                          onDelete={() => deleteItem(active.id, item.id)}
                        />
                      ))}
                    </ol>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-[#e0d8f0] bg-[#faf8ff] p-3 text-sm text-[#675a78]">Todavía no hay pasos en esta rutina. Podés agregar el primero abajo.</p>
          )}
          {!showAddItem && (
            <button
              type="button"
              onClick={openCreate}
              className="min-h-11 w-full py-2.5 rounded-xl border-2 border-dashed border-[#e0d8f0] text-[#8b7aa0] hover:border-[#6b4c9a] hover:text-[#6b4c9a] hover:bg-[#faf8ff] text-sm inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]"
            >
              <Plus size={16} /> Agregar paso
            </button>
          )}
        </div>
      )}
    </section>
  );
}
