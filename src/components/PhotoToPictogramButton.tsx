import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Loader2, X } from 'lucide-react';
import type { Pictogram } from '@/data/mockData';
import {
  fetchAiPictogramTargets,
  generatePictogramFromPhoto,
  savePictogramGeneration,
  buildGeneratedPictogram,
} from '@/data/aiPictogramApi';

// Unica responsabilidad: "sacale una foto y te armo un pictograma"
// (Sesion 23, item 16), reusando el generador con IA que ya existia
// desde antes de este roadmap (fal flux-2-pro/edit con la foto como
// referencia, moderacion y fallback a Pollinations — ver
// AiPictogramService.js en el backend).
//
// Solo tutores y profesionales pueden generar pictogramas con IA (misma
// restriccion que AiPictogramStudio). Este boton se auto-oculta si quien
// mira la pantalla no tiene ese permiso, o si no hay un target de IA que
// corresponda a `targetUsuarioId` — nunca muestra un boton que va a
// fallar al tocarlo.
type Phase = 'idle' | 'resolving' | 'unavailable' | 'ready' | 'generating' | 'preview' | 'saving' | 'error';

export default function PhotoToPictogramButton({
  targetUsuarioId,
  label,
  onSelect,
}: {
  targetUsuarioId: string;
  label: string;
  onSelect: (picto: Pictogram) => void;
}) {
  const [phase, setPhase] = useState<Phase>('resolving');
  const [targetPertenecienteId, setTargetPertenecienteId] = useState<number | null>(null);
  const [generation, setGeneration] = useState<{ id: string; previewUrl: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAiPictogramTargets()
      .then((targets) => {
        if (cancelled) return;
        const match = targets.find((t) => String(t.usuarioId) === String(targetUsuarioId));
        if (match) {
          setTargetPertenecienteId(match.id);
          setPhase('ready');
        } else {
          setPhase('unavailable');
        }
      })
      .catch(() => { if (!cancelled) setPhase('unavailable'); });
    return () => { cancelled = true; };
  }, [targetUsuarioId]);

  if (phase === 'resolving' || phase === 'unavailable') return null;

  const handleFile = async (file: File) => {
    if (!targetPertenecienteId) return;
    setPhase('generating');
    setErrorMessage('');
    try {
      const result = await generatePictogramFromPhoto(file, {
        name: label,
        description: label,
        targetPertenecienteId,
      });
      if (!result.previewUrl) throw new Error('No se pudo generar la vista previa.');
      setGeneration({ id: result.id, previewUrl: result.previewUrl });
      setPhase('preview');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo generar el pictograma.');
      setPhase('error');
    }
  };

  const confirmUse = async () => {
    if (!generation || !targetPertenecienteId) return;
    setPhase('saving');
    try {
      const saved = await savePictogramGeneration(generation.id, [targetPertenecienteId]);
      onSelect(buildGeneratedPictogram(saved.id, label, generation.previewUrl));
      setGeneration(null);
      setPhase('ready');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar el pictograma.');
      setPhase('error');
    }
  };

  const discard = () => {
    setGeneration(null);
    setErrorMessage('');
    setPhase('ready');
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void handleFile(file);
        }}
      />

      {(phase === 'ready' || phase === 'error') && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-full border border-[#ede4f8] px-3 py-1.5 text-xs font-semibold text-[#6b4c9a] hover:bg-[#f5f0ff]"
        >
          <Camera size={13} /> Generar desde foto
        </button>
      )}

      {phase === 'generating' && (
        <p className="flex items-center gap-1.5 text-xs text-[#8b7aa0]">
          <Loader2 size={13} className="animate-spin" /> Generando pictograma a partir de la foto…
        </p>
      )}

      {phase === 'error' && errorMessage && (
        <p className="text-xs text-red-600">{errorMessage}</p>
      )}

      {phase === 'preview' && generation && (
        <div className="flex items-center gap-2 rounded-xl border border-[#ede4f8] bg-[#faf8ff] p-2">
          <img src={generation.previewUrl} alt={label} className="h-14 w-14 rounded-lg object-contain" />
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => void confirmUse()}
              className="flex items-center gap-1 rounded-full bg-[#6b4c9a] px-2 py-1 text-[10px] font-semibold text-white"
            >
              <Check size={11} /> Usar este pictograma
            </button>
            <button
              type="button"
              onClick={discard}
              className="flex items-center gap-1 rounded-full border border-[#ede4f8] px-2 py-1 text-[10px] font-semibold text-[#8b7aa0]"
            >
              <X size={11} /> Descartar
            </button>
          </div>
        </div>
      )}

      {phase === 'saving' && (
        <p className="flex items-center gap-1.5 text-xs text-[#8b7aa0]">
          <Loader2 size={13} className="animate-spin" /> Guardando…
        </p>
      )}
    </div>
  );
}
