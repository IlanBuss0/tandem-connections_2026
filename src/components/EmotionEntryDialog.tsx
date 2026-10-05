import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { emotionOptions, useEmotions } from "@/contexts/EmotionsContext";
import EmotionCauseQuickPicker from "@/components/EmotionCauseQuickPicker";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/ui/use-toast";

const intensityLabels: Record<number, string> = {
  1: "Muy leve",
  2: "Leve",
  3: "Media",
  4: "Fuerte",
  5: "Muy fuerte",
};

interface Props {
  emotion: string | null;
  onClose: () => void;
}

export default function EmotionEntryDialog({ emotion, onClose }: Props) {
  const { add } = useEmotions();
  const [intensity, setIntensity] = useState(3);
  const [causes, setCauses] = useState<string[]>([]);
  const [context, setContext] = useState("");
  const [whatHelped, setWhatHelped] = useState("");
  const [saving, setSaving] = useState(false);
  const selectedOption = emotionOptions.find(
    (option) => option.label === emotion,
  );

  useEffect(() => {
    if (!emotion) {
      setIntensity(3);
      setCauses([]);
      setContext("");
      setWhatHelped("");
    }
  }, [emotion]);

  const submit = async () => {
    if (!emotion || !selectedOption || saving) return;
    setSaving(true);
    try {
      await add({
        emotion,
        emoji: selectedOption.emoji,
        intensity,
        context: [...causes, context.trim()].filter(Boolean).join(", "),
        whatHelped: whatHelped.trim(),
      });
      onClose();
      toast({
        title: "✓ Emoción guardada",
        description: "Tu registro se guardó correctamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={Boolean(emotion && selectedOption)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-h-[92vh] w-[88%] max-w-[88vw] overflow-y-auto rounded-3xl border-[#e8dcf8] p-0 sm:max-h-[85vh] sm:w-full sm:max-w-lg sm:p-0 lg:max-w-[560px]">
        {emotion && selectedOption && (
          <div className="space-y-3 p-4 sm:space-y-5 sm:p-6">
            <div className="text-center">
              <span className="text-2xl sm:text-3xl">
                {selectedOption.emoji}
              </span>
              <h4 className="mt-0.5 text-base font-bold text-[#4a4a5a] sm:mt-1 sm:text-lg">
                {selectedOption.label}
              </h4>
              <p className="text-xs text-[#8b7aa0] sm:text-sm">
                Está bien sentirte así 💜
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-[#4a4a5a] sm:mb-2 sm:text-sm">
                Intensidad
              </p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setIntensity(level)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-all duration-150 sm:h-11 sm:w-11 sm:rounded-xl ${intensity === level ? "bg-[#6b4c9a] text-white shadow-sm" : "bg-[#f5f0ff] text-[#6b4c9a] hover:bg-[#ede4f8]"}`}
                    aria-label={`Intensidad ${level}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-center text-[11px] font-medium text-[#8b7aa0] sm:mt-2 sm:text-xs">
                {intensityLabels[intensity]}
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-[#4a4a5a] sm:mb-2 sm:text-sm">
                ¿Qué pasó?
              </p>
              <div className="mb-1.5 sm:mb-2">
                <EmotionCauseQuickPicker
                  selected={causes}
                  onToggle={(cause) =>
                    setCauses((current) =>
                      current.includes(cause)
                        ? current.filter((item) => item !== cause)
                        : [...current, cause],
                    )
                  }
                />
              </div>
              <textarea
                value={context}
                onChange={(event) => setContext(event.target.value)}
                placeholder="Contame si querés..."
                rows={2}
                className="w-full resize-none rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-2.5 text-sm text-[#4a4a5a] outline-none transition-colors placeholder:text-[#b8b0c8] focus:border-[#6b4c9a]/40 focus:ring-2 focus:ring-[#6b4c9a]/15 sm:p-3.5"
              />
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-[#4a4a5a] sm:mb-2 sm:text-sm">
                ¿Hubo algo que te ayudó?
              </p>
              <textarea
                value={whatHelped}
                onChange={(event) => setWhatHelped(event.target.value)}
                placeholder="¿Qué te hizo sentir un poco mejor?"
                rows={2}
                className="w-full resize-none rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-2.5 text-sm text-[#4a4a5a] outline-none transition-colors placeholder:text-[#b8b0c8] focus:border-[#6b4c9a]/40 focus:ring-2 focus:ring-[#6b4c9a]/15 sm:p-3.5"
              />
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#6b4c9a] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200/60 transition-all hover:shadow-lg hover:shadow-purple-200/70 active:scale-[0.98] disabled:opacity-60 sm:py-3.5"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Heart size={18} />
              )}
              Guardar cómo me siento
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
