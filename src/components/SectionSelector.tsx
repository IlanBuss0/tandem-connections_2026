import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Plus, Pencil, Trash2 } from 'lucide-react';
import { useRoutines, predefinedCategories, predefinedLabels, iconChoices } from '@/contexts/RoutinesContext';
import { CustomCategory } from '@/data/api';

interface SectionSelectorProps {
  value: string;
  onChange: (category: string) => void;
  className?: string;
}

export default function SectionSelector({ value, onChange, className }: SectionSelectorProps) {
  const {
    customCategories,
    addCustomCategory,
    updateCustomCategory,
    deleteCustomCategory,
    hiddenPredefined,
    toggleHiddenPredefined,
  } = useRoutines();

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showCategoryDropdown) return;
    const handler = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCategoryDropdown]);

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📋');
  const [editingCat, setEditingCat] = useState<CustomCategory | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('');

  const allCategories = useMemo(() => {
    const visiblePredefined = predefinedCategories.filter(c => !hiddenPredefined.includes(c));
    return [...visiblePredefined, ...customCategories.map(c => c.id)];
  }, [customCategories, hiddenPredefined]);

  const allLabels = useMemo(() => {
    const labels = { ...predefinedLabels };
    customCategories.forEach(c => {
      labels[c.id] = `${c.icon} ${c.name}`;
    });
    return labels;
  }, [customCategories]);

  const submitNewCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    addCustomCategory(name, newCatIcon);
    setShowNewCategory(false);
    setNewCatName('');
    setNewCatIcon('📋');
  };

  const startEditCategory = (cat: CustomCategory) => {
    setEditingCat(cat);
    setEditCatName(cat.name);
    setEditCatIcon(cat.icon);
  };

  const submitEditCategory = () => {
    if (!editingCat) return;
    const name = editCatName.trim();
    if (!name) return;
    updateCustomCategory(editingCat.id, name, editCatIcon);
    setEditingCat(null);
  };

  return (
    <div className="space-y-2">
      <div className="relative" ref={categoryDropdownRef}>
        <button
          type="button"
          onClick={() => setShowCategoryDropdown(v => !v)}
          className={className || "w-full flex items-center justify-between p-2.5 rounded-xl border border-[#ede4f8] bg-[#faf8ff] text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20"}
        >
          <span className="truncate">{allLabels[value] || value}</span>
          <ChevronDown size={14} className="shrink-0 ml-2 text-[#8b7aa0]" />
        </button>

        {showCategoryDropdown && (
          <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-[#ede4f8] shadow-lg overflow-hidden max-h-60 overflow-y-auto">
            {allCategories.map(cat => {
              const obj = customCategories.find(c => c.id === cat);
              const isPre = predefinedCategories.includes(cat);
              return (
                <div
                  key={cat}
                  className="flex items-center gap-1 px-2.5 py-2 hover:bg-[#f5f0ff] cursor-pointer text-sm text-[#4a4a5a] border-b border-[#f0e8f8] last:border-b-0"
                >
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => {
                      onChange(cat);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <span className="truncate">{allLabels[cat] || cat}</span>
                  </div>
                  {obj && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditCategory(obj);
                        setShowCategoryDropdown(false);
                      }}
                      className="p-1 rounded-lg hover:bg-white text-[#8b7aa0] shrink-0"
                      title="Editar sección"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCategoryDropdown(false);
                      if (
                        obj &&
                        confirm(
                          '¿Eliminar sección "' +
                            obj.name +
                            '"? Los pasos que la usan no se eliminarán.'
                        )
                      ) {
                        deleteCustomCategory(obj!.id);
                      } else if (
                        isPre &&
                        confirm(
                          '¿Ocultar sección "' + (allLabels[cat] || cat) + '"?'
                        )
                      ) {
                        toggleHiddenPredefined(cat);
                      }
                    }}
                    className="p-1 rounded-lg hover:bg-red-50 text-red-400 shrink-0"
                    title={obj ? 'Eliminar sección' : 'Ocultar sección'}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
            <div
              className="flex items-center gap-1 px-2.5 py-2 hover:bg-[#f5f0ff] cursor-pointer text-sm text-[#6b4c9a] font-medium border-t border-[#f0e8f8]"
              onClick={() => {
                setShowCategoryDropdown(false);
                setShowNewCategory(true);
                setNewCatName('');
                setNewCatIcon('📋');
              }}
            >
              <Plus size={14} />
              <span>Nueva sección</span>
            </div>
          </div>
        )}
      </div>

      {showNewCategory && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-[#faf8ff] rounded-xl border border-[#ede4f8] p-3 space-y-2"
        >
          <input
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            placeholder="Nombre de la sección"
            className="w-full p-2 rounded-xl border border-[#ede4f8] bg-white text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20"
          />
          <div>
            <p className="text-xs text-[#8b7aa0] mb-1">Icono</p>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {iconChoices.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setNewCatIcon(ic)}
                  className={`text-lg p-1 rounded-lg border ${
                    newCatIcon === ic
                      ? 'border-[#6b4c9a] bg-[#f5f0ff]'
                      : 'border-[#ede4f8] bg-white'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submitNewCategory}
              className="flex-1 py-1.5 rounded-xl bg-[#6b4c9a] text-white text-xs font-semibold hover:bg-[#5a3c8a]"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setShowNewCategory(false)}
              className="px-3 py-1.5 rounded-xl border border-[#ede4f8] text-xs text-[#6b4c9a] font-semibold bg-white hover:bg-[#f5f0ff]"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      {editingCat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
          onClick={() => setEditingCat(null)}
        >
          <div
            className="bg-white rounded-2xl p-5 border border-[#f0e8f8] shadow-xl max-w-sm w-full mx-4 space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <h4 className="font-semibold text-sm text-[#4a4a5a]">Editar sección</h4>
            <input
              value={editCatName}
              onChange={e => setEditCatName(e.target.value)}
              placeholder="Nombre"
              className="w-full p-2.5 rounded-xl border border-[#ede4f8] bg-[#faf8ff] text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20"
            />
            <div>
              <p className="text-xs text-[#8b7aa0] mb-1">Icono</p>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {iconChoices.map(ic => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setEditCatIcon(ic)}
                    className={`text-xl p-1.5 rounded-xl border ${
                      editCatIcon === ic ? 'border-[#6b4c9a] bg-[#f5f0ff]' : 'border-[#ede4f8]'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={submitEditCategory}
                className="flex-1 py-2.5 rounded-2xl bg-[#6b4c9a] text-white text-sm font-semibold shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setEditingCat(null)}
                className="px-4 py-2.5 rounded-2xl border border-[#ede4f8] text-sm text-[#6b4c9a] font-semibold bg-[#faf8ff] hover:bg-[#f5f0ff]"
              >
                Cancelar
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    '¿Eliminar esta sección? Los pasos que la usan no se eliminarán.'
                  )
                ) {
                  deleteCustomCategory(editingCat.id);
                  setEditingCat(null);
                }
              }}
              className="w-full py-2 rounded-xl text-xs text-red-500 hover:bg-red-50 font-medium"
            >
              Eliminar sección
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
