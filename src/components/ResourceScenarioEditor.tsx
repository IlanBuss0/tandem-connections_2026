import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ShoppingBudgetEditor from '@/components/ShoppingBudgetEditor';
import type { LegacyResourceScenarioData, ResourceScenarioData, ResourceScenarioNode } from '@/data/resourceScenario';
import { isShoppingBudgetScenario, validateResourceScenario } from '@/data/resourceScenario';

type Props = {
  value: ResourceScenarioData;
  onChange: (value: ResourceScenarioData) => void;
  targetUsuarioId?: string;
};

const fieldClass = 'w-full rounded-xl border border-[#e6dcf2] bg-white px-3 py-2 text-sm text-[#4a3b5f] outline-none focus:ring-2 focus:ring-[#6b4c9a]/20';
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export default function ResourceScenarioEditor({ value, onChange, targetUsuarioId }: Props) {
  if (isShoppingBudgetScenario(value)) return <ShoppingBudgetEditor value={value} onChange={onChange} targetUsuarioId={targetUsuarioId} />;
  return <LegacyResourceScenarioEditor value={value} onChange={onChange} />;
}

function LegacyResourceScenarioEditor({ value, onChange }: { value: LegacyResourceScenarioData; onChange: (value: LegacyResourceScenarioData) => void }) {
  const [selectedNodeId, setSelectedNodeId] = useState(value.startNodeId);
  const selectedNode = value.nodes.find(node => node.id === selectedNodeId) || value.nodes[0];
  const validation = useMemo(() => validateResourceScenario(value), [value]);

  const updateNode = (next: ResourceScenarioNode) => onChange({
    ...value,
    nodes: value.nodes.map(node => node.id === next.id ? next : node),
  });

  const addResource = () => {
    if (value.resources.length >= 3) return;
    const id = makeId('resource');
    onChange({ ...value, resources: [...value.resources, { id, name: 'Recurso', icon: '⭐', min: 0, max: 10, initial: 5 }] });
  };

  const removeResource = (id: string) => onChange({
    ...value,
    resources: value.resources.filter(resource => resource.id !== id),
    nodes: value.nodes.map(node => ({
      ...node,
      options: node.options.map(option => {
        const { [id]: _removed, ...resourceDeltas } = option.resourceDeltas;
        return { ...option, resourceDeltas };
      }),
    })),
  });

  const addNode = () => {
    if (value.nodes.length >= 12) return;
    const id = makeId('node');
    const node: ResourceScenarioNode = { id, prompt: 'Nuevo desenlace', terminal: true, options: [] };
    onChange({ ...value, nodes: [...value.nodes, node] });
    setSelectedNodeId(id);
  };

  const removeNode = (id: string) => {
    if (value.nodes.length <= 2) return;
    const nodes = value.nodes.filter(node => node.id !== id);
    const startNodeId = value.startNodeId === id ? nodes[0].id : value.startNodeId;
    onChange({ ...value, startNodeId, nodes });
    setSelectedNodeId(startNodeId);
  };

  if (!selectedNode) return null;

  return (
    <div className="space-y-5 rounded-2xl border border-[#e8def3] bg-[#faf8ff] p-4">
      <div>
        <h4 className="font-semibold text-[#6b4c9a]">Recursos del escenario</h4>
        <p className="text-xs text-[#8b7aa0]">Definí entre 1 y 3 indicadores que cambiarán con cada decisión.</p>
      </div>
      <div className="space-y-3">
        {value.resources.map(resource => (
          <div key={resource.id} className="grid gap-2 rounded-xl border bg-white p-3 sm:grid-cols-[70px_1fr_repeat(3,90px)_40px]">
            <input aria-label="Icono del recurso" className={fieldClass} value={resource.icon} onChange={event => onChange({ ...value, resources: value.resources.map(item => item.id === resource.id ? { ...item, icon: event.target.value } : item) })} />
            <input aria-label="Nombre del recurso" className={fieldClass} value={resource.name} onChange={event => onChange({ ...value, resources: value.resources.map(item => item.id === resource.id ? { ...item, name: event.target.value } : item) })} />
            {(['min', 'initial', 'max'] as const).map(key => (
              <input key={key} aria-label={`${key} de ${resource.name}`} type="number" className={fieldClass} value={resource[key]} onChange={event => onChange({ ...value, resources: value.resources.map(item => item.id === resource.id ? { ...item, [key]: Number(event.target.value) } : item) })} />
            ))}
            <button type="button" aria-label={`Eliminar ${resource.name}`} disabled={value.resources.length <= 1} onClick={() => removeResource(resource.id)} className="rounded-lg text-red-500 disabled:opacity-30"><Trash2 size={18} /></button>
          </div>
        ))}
        <button type="button" disabled={value.resources.length >= 3} onClick={addResource} className="inline-flex items-center gap-2 text-sm font-semibold text-[#6b4c9a] disabled:opacity-40"><Plus size={16} /> Agregar recurso</button>
      </div>

      <div className="border-t border-[#e8def3] pt-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="text-xs font-semibold text-[#6b4c9a]">Nodo inicial
            <select className={`${fieldClass} mt-1`} value={value.startNodeId} onChange={event => onChange({ ...value, startNodeId: event.target.value })}>
              {value.nodes.map(node => <option key={node.id} value={node.id}>{node.prompt || node.id}</option>)}
            </select>
          </label>
          <button type="button" disabled={value.nodes.length >= 12} onClick={addNode} className="inline-flex items-center gap-2 rounded-xl bg-[#6b4c9a] px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"><Plus size={16} /> Agregar nodo</button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {value.nodes.map((node, index) => (
            <button type="button" key={node.id} onClick={() => setSelectedNodeId(node.id)} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold ${node.id === selectedNode.id ? 'bg-[#6b4c9a] text-white' : 'border bg-white text-[#6b4c9a]'}`}>
              {node.terminal ? '🏁' : '🔀'} {index + 1}. {node.prompt || 'Sin texto'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#6b4c9a]">
            <input type="checkbox" checked={selectedNode.terminal} onChange={event => updateNode({
              ...selectedNode,
              terminal: event.target.checked,
              options: event.target.checked ? [] : [
                { id: makeId('option'), label: '', score: 50, resourceDeltas: {}, nextNodeId: value.nodes.find(node => node.id !== selectedNode.id)?.id || selectedNode.id },
                { id: makeId('option'), label: '', score: 50, resourceDeltas: {}, nextNodeId: value.nodes.find(node => node.id !== selectedNode.id)?.id || selectedNode.id },
              ],
            })} /> Desenlace final
          </label>
          <button type="button" aria-label="Eliminar nodo" disabled={value.nodes.length <= 2} onClick={() => removeNode(selectedNode.id)} className="text-red-500 disabled:opacity-30"><Trash2 size={18} /></button>
        </div>
        <input className={fieldClass} aria-label="Consigna del nodo" placeholder="¿Qué sucede o qué decisión hay que tomar?" value={selectedNode.prompt} onChange={event => updateNode({ ...selectedNode, prompt: event.target.value })} />
        <input className={fieldClass} aria-label="Imagen del nodo" placeholder="Emoji o URL de pictograma (opcional)" value={selectedNode.image || ''} onChange={event => updateNode({ ...selectedNode, image: event.target.value || undefined })} />

        {!selectedNode.terminal && selectedNode.options.map((option, optionIndex) => (
          <div key={option.id} className="space-y-2 rounded-xl border border-[#eee6f6] bg-[#fdfcff] p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6b4c9a]">Opción {optionIndex + 1}</span>
              <button type="button" disabled={selectedNode.options.length <= 2} onClick={() => updateNode({ ...selectedNode, options: selectedNode.options.filter(item => item.id !== option.id) })} className="text-red-500 disabled:opacity-30"><Trash2 size={16} /></button>
            </div>
            <input className={fieldClass} placeholder="Texto de la opción" value={option.label} onChange={event => updateNode({ ...selectedNode, options: selectedNode.options.map(item => item.id === option.id ? { ...item, label: event.target.value } : item) })} />
            <div className="grid gap-2 sm:grid-cols-3">
              <input className={fieldClass} placeholder="Emoji o URL (opcional)" value={option.image || ''} onChange={event => updateNode({ ...selectedNode, options: selectedNode.options.map(item => item.id === option.id ? { ...item, image: event.target.value || undefined } : item) })} />
              <input className={fieldClass} placeholder="Feedback (opcional)" value={option.feedback || ''} onChange={event => updateNode({ ...selectedNode, options: selectedNode.options.map(item => item.id === option.id ? { ...item, feedback: event.target.value || undefined } : item) })} />
              <input aria-label="Puntaje de opción" type="number" min={0} max={100} className={fieldClass} value={option.score} onChange={event => updateNode({ ...selectedNode, options: selectedNode.options.map(item => item.id === option.id ? { ...item, score: Number(event.target.value) } : item) })} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs text-[#8b7aa0]">Próximo nodo
                <select className={`${fieldClass} mt-1`} value={option.nextNodeId} onChange={event => updateNode({ ...selectedNode, options: selectedNode.options.map(item => item.id === option.id ? { ...item, nextNodeId: event.target.value } : item) })}>
                  {value.nodes.filter(node => node.id !== selectedNode.id).map(node => <option key={node.id} value={node.id}>{node.prompt || node.id}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {value.resources.map(resource => <label key={resource.id} className="text-xs text-[#8b7aa0]">{resource.icon} {resource.name}
                  <input type="number" className={`${fieldClass} mt-1`} value={option.resourceDeltas[resource.id] || 0} onChange={event => updateNode({ ...selectedNode, options: selectedNode.options.map(item => item.id === option.id ? { ...item, resourceDeltas: { ...item.resourceDeltas, [resource.id]: Number(event.target.value) } } : item) })} />
                </label>)}
              </div>
            </div>
          </div>
        ))}
        {!selectedNode.terminal && <button type="button" disabled={selectedNode.options.length >= 4} onClick={() => updateNode({ ...selectedNode, options: [...selectedNode.options, { id: makeId('option'), label: '', score: 50, resourceDeltas: {}, nextNodeId: value.nodes.find(node => node.id !== selectedNode.id)?.id || selectedNode.id }] })} className="inline-flex items-center gap-2 text-sm font-semibold text-[#6b4c9a] disabled:opacity-40"><Plus size={16} /> Agregar opción</button>}
      </div>

      <p role="status" className={`text-xs font-medium ${validation ? 'text-amber-700' : 'text-green-700'}`}>{validation || 'El escenario está listo para publicar.'}</p>
    </div>
  );
}
