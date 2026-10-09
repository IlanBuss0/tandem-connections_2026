import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Trophy } from 'lucide-react';
import type { LegacyResourceScenarioData, ResourceScenarioOption } from '@/data/resourceScenario';
import { applyResourceDeltas, resourceScenarioScore } from '@/data/resourceScenario';

type Props = { data: LegacyResourceScenarioData; onFinish: (score: number) => void };

function Visual({ value }: { value?: string }) {
  return value?.startsWith('http')
    ? <img src={value} alt="" className="mx-auto h-28 w-28 object-contain" />
    : value ? <span className="text-6xl" aria-hidden="true">{value}</span> : null;
}

export default function ResourceScenarioGame({ data, onFinish }: Props) {
  const nodeById = useMemo(() => new Map(data.nodes.map(node => [node.id, node])), [data.nodes]);
  const [nodeId, setNodeId] = useState(data.startNodeId);
  const [values, setValues] = useState<Record<string, number>>(() => Object.fromEntries(data.resources.map(resource => [resource.id, resource.initial])));
  const [scores, setScores] = useState<number[]>([]);
  const [choice, setChoice] = useState<ResourceScenarioOption | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const node = nodeById.get(nodeId);

  if (!node) return <p className="text-sm text-red-600">El escenario no tiene un nodo inicial válido.</p>;
  const score = resourceScenarioScore(scores);

  const choose = (option: ResourceScenarioOption) => {
    if (choice) return;
    const applied = applyResourceDeltas(data.resources, values, option.resourceDeltas);
    setValues(applied.values);
    setWarnings(applied.warnings);
    setScores(current => [...current, option.score]);
    setChoice(option);
  };

  const advance = () => {
    if (!choice) return;
    setNodeId(choice.nextNodeId);
    setChoice(null);
    setWarnings([]);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-2 sm:grid-cols-3" aria-label="Recursos actuales">
        {data.resources.map(resource => {
          const current = values[resource.id];
          const percentage = ((current - resource.min) / (resource.max - resource.min)) * 100;
          return <div key={resource.id} className="rounded-xl border border-[#e8def3] bg-[#faf8ff] p-3">
            <div className="flex justify-between text-sm font-semibold text-[#6b4c9a]"><span>{resource.icon} {resource.name}</span><span>{current}</span></div>
            <div className="mt-2 h-2 rounded-full bg-[#e8def3]"><div className="h-2 rounded-full bg-[#6b4c9a] transition-all" style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }} /></div>
          </div>;
        })}
      </div>

      <div className="space-y-4 rounded-2xl border border-[#eee6f6] bg-white p-5 text-center">
        <Visual value={node.image} />
        <h3 className="text-xl font-bold text-[#6b4c9a]">{node.prompt}</h3>

        {node.terminal ? (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 font-bold text-amber-800"><Trophy size={18} /> Resultado: {score}/100</div>
            <button type="button" onClick={() => onFinish(score)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6b4c9a] px-5 py-3 font-semibold text-white">Finalizar actividad <ArrowRight size={18} /></button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {node.options.map(option => <button type="button" key={option.id} disabled={Boolean(choice)} onClick={() => choose(option)} className={`min-h-24 rounded-2xl border-2 p-4 text-left transition ${choice?.id === option.id ? 'border-[#6b4c9a] bg-[#f4effa]' : 'border-[#e8def3] bg-white hover:border-[#6b4c9a]/50'} disabled:cursor-default`}>
              <div className="flex items-center gap-3"><Visual value={option.image} /><span className="font-semibold text-[#5b496d]">{option.label}</span></div>
            </button>)}
          </div>
        )}

        {choice && <div className="space-y-3 text-left" aria-live="polite">
          {choice.feedback && <p className="rounded-xl bg-blue-50 p-3 text-sm font-medium text-blue-800">{choice.feedback}</p>}
          {warnings.map(warning => <p key={warning} className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-800"><AlertTriangle size={17} /> {warning}</p>)}
          <button type="button" onClick={advance} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6b4c9a] px-5 py-3 font-semibold text-white">Continuar <ArrowRight size={18} /></button>
        </div>}
      </div>
    </div>
  );
}
