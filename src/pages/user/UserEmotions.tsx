import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Check, Heart, Loader2, StickyNote } from "lucide-react";
import { useEmotions, emotionOptions } from "@/contexts/EmotionsContext";
import { fetchPersonalNotesForUser, type PersonalNote } from "@/data/api";
import { useAuth } from "@/contexts/AuthContext";
import EmotionCauseQuickPicker from "@/components/EmotionCauseQuickPicker";
import PermissionBlocked from "@/components/PermissionBlocked";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  isPermissionEnabled,
  PERTENECIENTE_PERMISSIONS,
  usePermissionContext,
} from "@/hooks/usePermissions";
import { toast } from "@/hooks/ui/use-toast";

const intensityLabels: Record<number, string> = {
  1: "Muy leve",
  2: "Leve",
  3: "Media",
  4: "Fuerte",
  5: "Muy fuerte",
};

const EMOTION_PASTEL: Record<string, string> = {
  Contento: "bg-[#fdf8e8] border-[#f5ecd0]",
  Feliz: "bg-[#fef9e3] border-[#f7eebd]",
  Tranquilo: "bg-[#eaf8f4] border-[#d4efe6]",
  Motivado: "bg-[#f3eefb] border-[#e3d8f5]",
  Orgulloso: "bg-[#f0eafb] border-[#dfd2f5]",
  Ansioso: "bg-[#eef3fb] border-[#d8e4f5]",
  Nervioso: "bg-[#eef1fb] border-[#dce3f5]",
  Frustrado: "bg-[#fdf1ec] border-[#f5ddd0]",
  Enojado: "bg-[#fdeeed] border-[#f5d5d2]",
  Triste: "bg-[#eef0fb] border-[#dce1f5]",
  Cansado: "bg-[#f0f1f7] border-[#dfe2ed]",
  Aburrido: "bg-[#f2f1f5] border-[#e2e0ea]",
  Sorprendido: "bg-[#fef6ec] border-[#f5e6cd]",
  Preocupado: "bg-[#f0edf8] border-[#e0d8f0]",
};

const EMOTION_SELECTED_BG: Record<string, string> = {
  Contento: "bg-[#f9f2d8] border-[#d4b94a]",
  Feliz: "bg-[#faf1d0] border-[#d4b94a]",
  Tranquilo: "bg-[#d5f0e8] border-[#4a9a8a]",
  Motivado: "bg-[#e4d8f7] border-[#7c5cbf]",
  Orgulloso: "bg-[#e0d4f7] border-[#7c5cbf]",
  Ansioso: "bg-[#d8e6f7] border-[#6b7cc9]",
  Nervioso: "bg-[#dce5f7] border-[#6b7cc9]",
  Frustrado: "bg-[#f7ddd0] border-[#c48060]",
  Enojado: "bg-[#f7d5d2] border-[#c47060]",
  Triste: "bg-[#dde1f7] border-[#7080c0]",
  Cansado: "bg-[#e0e3ef] border-[#8090a8]",
  Aburrido: "bg-[#e5e3ec] border-[#9088a8]",
  Sorprendido: "bg-[#f7e8d0] border-[#c4a050]",
  Preocupado: "bg-[#e2daf5] border-[#8070b0]",
};

function emotionPastel(label: string) {
  return EMOTION_PASTEL[label] ?? "bg-[#f3eefb] border-[#e3d8f5]";
}

function emotionSelectedBg(label: string) {
  return EMOTION_SELECTED_BG[label] ?? "bg-[#e4d8f7] border-[#7c5cbf]";
}

export default function UserEmotions() {
  const { context: permissionContext } = usePermissionContext();
  const { user } = useAuth();
  const { records, loading, error, add } = useEmotions();
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [causes, setCauses] = useState<string[]>([]);
  const [context, setContext] = useState("");
  const [whatHelped, setWhatHelped] = useState("");
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!user) return;
    setNotesLoading(true);
    fetchPersonalNotesForUser(user.id)
      .then((data) => { if (mounted) setNotes(data); })
      .catch(() => { if (mounted) setNotes([]); })
      .finally(() => { if (mounted) setNotesLoading(false); });
    return () => { mounted = false; };
  }, [user]);

  const selectedOption = emotionOptions.find(
    (emotion) => emotion.label === selectedEmotion,
  );

  const canRegisterEmotions = isPermissionEnabled(
    permissionContext?.perteneciente?.permisos_efectivos?.permisos,
    PERTENECIENTE_PERMISSIONS.REGISTRAR_EMOCIONES,
    true,
  );

  if (!canRegisterEmotions) {
    return (
      <div className="mx-auto max-w-[900px] space-y-6 pb-24 lg:pb-6">
        <div className="rounded-[24px] border border-[#e8dcf8] bg-gradient-to-br from-[#f9f4ff] via-[#f4ebff] to-[#eef8fb] p-6 text-center shadow-[0_10px_30px_#eadff6]">
          <span className="text-4xl">💜</span>
          <h2 className="mt-3 text-2xl font-bold text-[#2e2344] sm:text-3xl">
            ¿Cómo te sentís hoy?
          </h2>
          <p className="mt-1 text-sm text-[#7b5fa6]">
            Tomate un momento para vos.
          </p>
          <p className="text-sm text-[#7b5fa6]">No hay respuestas correctas.</p>
        </div>
        <PermissionBlocked
          title="Emociones deshabilitadas"
          description="Tu tutor deshabilitó temporalmente el registro emocional."
        />
      </div>
    );
  }

  const submit = async () => {
    if (!selectedEmotion || saving) return;
    setSaving(true);

    try {
      await add({
        emotion: selectedEmotion,
        emoji: selectedOption?.emoji || "😊",
        intensity,
        context: [...causes, context.trim()].filter(Boolean).join(", "),
        whatHelped: whatHelped.trim(),
      });
      handleCloseForm();
      toast({
        title: "✓ Emoción guardada",
        description: "Tu registro se guardó correctamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseForm = () => {
    setSelectedEmotion(null);
    setCauses([]);
    setContext("");
    setWhatHelped("");
    setIntensity(3);
  };

  return (
    <div className="mx-auto max-w-[900px] space-y-6 pb-24 lg:pb-6">
      {/* Hero */}
      <div className="rounded-[24px] border border-[#e8dcf8] bg-gradient-to-br from-[#f9f4ff] via-[#f4ebff] to-[#eef8fb] p-6 text-center shadow-[0_10px_30px_#eadff6] sm:p-8">
        <span className="text-4xl">💜</span>
        <h2 className="mt-3 text-2xl font-bold text-[#2e2344] sm:text-3xl">
          ¿Cómo te sentís hoy?
        </h2>
        <p className="mt-1 text-sm text-[#7b5fa6]">
          Tomate un momento para vos.
        </p>
        <p className="text-sm text-[#7b5fa6]">No hay respuestas correctas.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Emotion selector */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-[#4a4a5a]">
          Elegí cómo te sentís
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
        {emotionOptions.map((option) => {
          const isSelected = selectedEmotion === option.label;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => setSelectedEmotion(option.label)}
              aria-pressed={isSelected}
              className={`relative flex flex-col items-center justify-center rounded-2xl border p-3 transition-all duration-200 min-h-[88px] ${
                isSelected
                  ? `border-2 ${emotionSelectedBg(option.label)} shadow-md scale-[1.03]`
                  : `${emotionPastel(option.label)} hover:shadow-sm hover:scale-[1.01]`
              }`}
            >
              {isSelected && (
                <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#6b4c9a]">
                  <Check size={12} className="text-white" strokeWidth={3} />
                </span>
              )}
              <span className="text-3xl leading-none">{option.emoji}</span>
              <span className="mt-1.5 text-[11px] font-medium text-[#4a4a5a] leading-tight">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Accompaniment message (when no emotion selected) */}
      {!selectedEmotion && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-4"
        >
          <Heart size={20} className="shrink-0 text-[#9b8abf]" />
          <div>
            <p className="text-sm font-medium text-[#6b4c9a]">
              Todas tus emociones son válidas.
            </p>
            <p className="text-xs text-[#8b7aa0]">Este es tu espacio seguro.</p>
          </div>
        </motion.div>
      )}

      {/* Emoción elegida: modal */}
      <Dialog
        open={Boolean(selectedEmotion)}
        onOpenChange={(open) => {
          if (!open) handleCloseForm();
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-[#e8dcf8] w-[88%] max-w-[88vw] sm:max-h-[85vh] sm:w-full sm:max-w-lg lg:max-w-[560px] p-0 sm:p-0">
          {selectedEmotion && selectedOption && (
            <div className="space-y-3 p-4 sm:space-y-5 sm:p-6">
              {/* Header */}
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

              {/* Intensity */}
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
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-all duration-150 sm:h-11 sm:w-11 sm:rounded-xl ${
                        intensity === level
                          ? "bg-[#6b4c9a] text-white shadow-sm"
                          : "bg-[#f5f0ff] text-[#6b4c9a] hover:bg-[#ede4f8]"
                      }`}
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

              {/* ¿Qué pasó? */}
              <div>
                <p className="mb-1.5 text-xs font-medium text-[#4a4a5a] sm:mb-2 sm:text-sm">
                  ¿Qué pasó?
                </p>
                <div className="mb-1.5 sm:mb-2">
                  <EmotionCauseQuickPicker
                    selected={causes}
                    onToggle={(cause) =>
                      setCauses((prev) =>
                        prev.includes(cause)
                          ? prev.filter((item) => item !== cause)
                          : [...prev, cause],
                      )
                    }
                  />
                </div>
                <textarea
                  value={context}
                  onChange={(event) => setContext(event.target.value)}
                  placeholder="Contame si querés..."
                  rows={2}
                  className="w-full resize-none rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-2.5 text-sm text-[#4a4a5a] outline-none transition-colors focus:border-[#6b4c9a]/40 focus:ring-2 focus:ring-[#6b4c9a]/15 placeholder:text-[#b8b0c8] sm:p-3.5"
                />
              </div>

              {/* ¿Qué ayudó? */}
              <div>
                <p className="mb-1.5 text-xs font-medium text-[#4a4a5a] sm:mb-2 sm:text-sm">
                  ¿Hubo algo que te ayudó?
                </p>
                <textarea
                  value={whatHelped}
                  onChange={(event) => setWhatHelped(event.target.value)}
                  placeholder="¿Qué te hizo sentir un poco mejor?"
                  rows={2}
                  className="w-full resize-none rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-2.5 text-sm text-[#4a4a5a] outline-none transition-colors focus:border-[#6b4c9a]/40 focus:ring-2 focus:ring-[#6b4c9a]/15 placeholder:text-[#b8b0c8] sm:p-3.5"
                />
              </div>

              {/* Save button */}
              <button
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

      {/* Emociones registradas */}
      <section className="rounded-3xl border border-[#f0e8f8] bg-white p-4 shadow-lg sm:p-5">
        <h3 className="mb-3 font-semibold text-[#6b4c9a]">
          Emociones registradas
        </h3>
        {loading && records.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-sm text-[#8b7aa0]">
            <Loader2 size={16} className="animate-spin" />
            Cargando emociones...
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e0d8f0] bg-[#faf8ff] px-5 py-8 text-center text-sm text-[#8b7aa0]">
            Todavía no guardaste emociones desde el Tablero emocional.
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {records.map((record) => (
              <article
                key={record.id}
                className="flex items-center gap-3 rounded-2xl border border-[#f0e8f8] bg-[#faf8ff] p-3"
              >
                <span className="text-3xl" aria-hidden="true">
                  {record.emoji}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#4a4a5a]">
                    {record.emotion}
                  </p>
                  <p className="text-xs text-[#8b7aa0]">
                    {record.date} · {record.timestamp}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Notas de estado emocional */}
      <section className="rounded-3xl border border-[#f0e8f8] bg-white p-4 shadow-lg sm:p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-[#6b4c9a]">
          <StickyNote size={18} className="text-[#6b4c9a]" />
          Notas de estado emocional
        </h3>
        {notesLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-[#8b7aa0]">
            <Loader2 size={16} className="animate-spin" />
            Cargando notas...
          </div>
        ) : notes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e0d8f0] bg-[#faf8ff] px-5 py-8 text-center text-sm text-[#8b7aa0]">
            Todavía no escribiste ninguna nota desde el inicio.
          </div>
        ) : (
          <div className="space-y-2.5">
            {[...notes].reverse().map((note) => (
              <article
                key={note.id}
                className="rounded-2xl border border-[#f0e8f8] bg-[#faf8ff] p-3"
              >
                <p className="text-sm text-[#4a4a5a]">{note.content}</p>
                <p className="mt-1.5 text-xs text-[#8b7aa0]">
                  {note.createdAt
                    ? new Date(note.createdAt).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "long",
                      })
                    : ""}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
