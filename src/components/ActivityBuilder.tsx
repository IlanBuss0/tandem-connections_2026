import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Send,
  Sparkles,
  Search,
  X,
  Gamepad2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomActivities } from "@/contexts/CustomActivitiesContext";
import {
  ACTIVITY_TEMPLATES,
  ActivityTemplate,
  STEP_ICON_OPTIONS,
} from "@/data/activityTemplates";
import { GAME_TEMPLATES, GameTemplate } from "@/data/miniGames";
import {
  fetchLinkedPertenecientesForSupportUser,
  fetchPictograms,
  ActivityCategory,
  ActivityType,
  type Pictogram,
  type User,
} from "@/data/api";
import { motion, AnimatePresence } from "framer-motion";
import type { GameData, GameType } from "@/data/miniGames";
import type { WheelRound } from "@/data/miniGames";
import {
  normalizeRound,
  normalizeWheel,
  parseWheel,
  serializeWheel,
  wheelSegmentAngles,
  wheelValidationError,
} from "@/data/wheelPrecision";
import {
  DEFAULT_MEMORY_SETTINGS,
  memoryValidationError,
  normalizeMemory,
} from "@/data/memoryGame";
import { useToast } from "@/components/ui/use-toast";
import { aiPictogramsApi } from "@/services/ai-pictograms";

const CATEGORIES: ActivityCategory[] = [
  "autonomía personal",
  "higiene",
  "organización",
  "escuela",
  "cocina básica",
  "transporte",
  "compras",
  "manejo del dinero",
  "emociones",
  "comunicación",
  "vida social",
  "seguridad personal",
  "rutinas del hogar",
  "regulación emocional",
  "preparación para salidas",
  "anticipación de cambios",
];
const TYPES: ActivityType[] = ["guiada", "juego", "regulación", "decisión"];
const DIFFICULTIES = ["fácil", "medio", "avanzado"] as const;
const DURATIONS = [
  "3 min",
  "5 min",
  "10 min",
  "15 min",
  "20 min",
  "30 min",
  "45 min",
];

function serializeGameContent(gameType?: GameType, gameData?: GameData) {
  if (!gameType || !gameData) return "";
  if (gameType === "wheel") return serializeWheel(gameData.wheel);
  if (gameType === "drag-word")
    return (gameData.dragRounds || [])
      .map((item) => `${item.image}|${item.correct}|${item.letters.join(",")}`)
      .join("\n");
  if (gameType === "fill-blank")
    return (gameData.fill || [])
      .map(
        (item) => `${item.sentence}|${item.options.join(",")}|${item.correct}`,
      )
      .join("\n");
  if (gameType === "multiple-choice")
    return (gameData.rounds || [])
      .map(
        (item) =>
          `${item.image}|${item.prompt}|${item.options.join(",")}|${item.correct}`,
      )
      .join("\n");
  if (gameType === "true-false")
    return (gameData.tf || [])
      .map((item) => `${item.statement}|${item.answer ? "true" : "false"}`)
      .join("\n");
  if (gameType === "sequence-order")
    return gameData.sequence
      ? `${gameData.sequence.prompt}\n${gameData.sequence.steps.join("\n")}`
      : "";
  if (gameType === "memory") {
    const memory = normalizeMemory(gameData.memory);
    const settings = `@settings|${memory.settings.previewEnabled}|${memory.settings.previewSeconds}|${memory.settings.timed}|${memory.settings.timeLimitSeconds}`;
    return [
      settings,
      ...memory.pairs.map(
        (item) =>
          `${item.a}|${item.b}|${item.aLabel || ""}|${item.bLabel || ""}`,
      ),
    ].join("\n");
  }
  if (gameType === "count-objects")
    return (gameData.count || [])
      .map((item) => `${item.emoji}|${item.count}`)
      .join("\n");
  if (gameType === "matching-pairs")
    return gameData.matching
      ? `${gameData.matching.left.join(",")}\n${gameData.matching.right.join(",")}\n${gameData.matching.correctMap.join(",")}`
      : "";
  if (gameType === "category-sort")
    return (gameData.category?.items || [])
      .map((item) => `${item.label}|${item.categoryIndex}`)
      .join("\n");
  if (gameType === "sound-match")
    return (gameData.sound || [])
      .map((item) => `${item.sound}|${item.options.join(",")}|${item.correct}`)
      .join("\n");
  if (gameType === "tap-correct")
    return (gameData.tap || [])
      .map(
        (item) =>
          `${item.prompt}|${item.options.join(",")}|${item.correctIdx.join(",")}`,
      )
      .join("\n");
  return "";
}

function parseGameContent(
  gameType: GameType,
  text: string,
  previous?: GameData,
): GameData {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (gameType === "wheel") return { ...previous, wheel: parseWheel(text) };
  if (gameType === "drag-word")
    return {
      dragRounds: lines.map((line) => {
        const [image = "", correct = "", letters = ""] = line.split("|");
        return {
          image,
          correct: correct.trim(),
          letters: letters
            .split(",")
            .map((l) => l.trim())
            .filter(Boolean),
        };
      }),
    };
  if (gameType === "fill-blank")
    return {
      fill: lines.map((line) => {
        const [sentence = "", options = "", correct = "0"] = line.split("|");
        return {
          sentence,
          options: options
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          correct: Number(correct) || 0,
        };
      }),
    };
  if (gameType === "multiple-choice")
    return {
      rounds: lines.map((line) => {
        const [image = "", prompt = "", options = "", correct = "0"] =
          line.split("|");
        return {
          image,
          prompt,
          options: options
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          correct: Number(correct) || 0,
        };
      }),
    };
  if (gameType === "true-false")
    return {
      tf: lines.map((line) => {
        const [statement = "", answer = "false"] = line.split("|");
        return { statement, answer: answer.trim().toLowerCase() === "true" };
      }),
    };
  if (gameType === "sequence-order")
    return {
      sequence: {
        prompt: lines[0] || "Ordena los pasos",
        steps: lines.slice(1),
      },
    };
  if (gameType === "memory") {
    const settingsLine = lines.find((line) => line.startsWith("@settings|"));
    const pairLines = lines.filter((line) => !line.startsWith("@settings|"));
    const previousSettings = normalizeMemory(previous?.memory).settings;
    const [, previewEnabled, previewSeconds, timed, timeLimitSeconds] =
      settingsLine?.split("|") || [];
    return {
      memory: {
        pairs: pairLines.map((line) => {
          const [a = "", b = "", aLabel = "", bLabel = ""] = line.split("|");
          return {
            a,
            b,
            aLabel: aLabel || undefined,
            bLabel: bLabel || undefined,
          };
        }),
        settings: settingsLine
          ? {
              previewEnabled: previewEnabled === "true",
              previewSeconds:
                Number(previewSeconds) ||
                DEFAULT_MEMORY_SETTINGS.previewSeconds,
              timed: timed === "true",
              timeLimitSeconds:
                Number(timeLimitSeconds) ||
                DEFAULT_MEMORY_SETTINGS.timeLimitSeconds,
            }
          : previousSettings,
      },
    };
  }
  if (gameType === "count-objects")
    return {
      count: lines.map((line) => {
        const [emoji = "", count = "0"] = line.split("|");
        return { emoji, count: Number(count) || 0 };
      }),
    };
  if (gameType === "matching-pairs") {
    const [left = "", right = "", correctMap = ""] = lines;
    return {
      matching: {
        left: left
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        right: right
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        correctMap: correctMap
          .split(",")
          .map((item) => Number(item.trim()) || 0),
      },
    };
  }
  if (gameType === "category-sort")
    return {
      category: {
        categories: previous?.category?.categories || [
          { name: "Categoria 1", emoji: "1" },
          { name: "Categoria 2", emoji: "2" },
        ],
        items: lines.map((line) => {
          const [label = "", categoryIndex = "0"] = line.split("|");
          return { label, categoryIndex: Number(categoryIndex) || 0 };
        }),
      },
    };
  if (gameType === "sound-match")
    return {
      sound: lines.map((line) => {
        const [sound = "", options = "", correct = "0"] = line.split("|");
        return {
          sound,
          options: options
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          correct: Number(correct) || 0,
        };
      }),
    };
  if (gameType === "tap-correct")
    return {
      tap: lines.map((line) => {
        const [prompt = "", options = "", correct = ""] = line.split("|");
        return {
          prompt,
          options: options
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          correctIdx: correct
            .split(",")
            .map((item) => Number(item.trim()))
            .filter(Number.isFinite),
        };
      }),
    };
  return previous || {};
}

function contentHelp(gameType?: GameType) {
  if (gameType === "wheel")
    return "Usá el editor visual. La primera línea contiene la configuración y las restantes las rondas.";
  if (gameType === "drag-word")
    return "Usá el editor visual de abajo. Formato: emoji|palabra_correcta|letra1,letra2,letra3,...";
  if (gameType === "fill-blank")
    return "Formato: frase con ___|opcion1,opcion2,opcion3|indice correcto empezando en 0";
  if (gameType === "multiple-choice")
    return "Formato: emoji|pregunta|opcion1,opcion2,opcion3,opcion4|indice correcto empezando en 0";
  if (gameType === "true-false") return "Formato: afirmacion|true o false";
  if (gameType === "sequence-order")
    return "Primera linea: consigna. Lineas siguientes: pasos en orden.";
  if (gameType === "memory")
    return "Usá el editor visual para combinar texto, emoji y pictogramas.";
  if (gameType === "count-objects") return "Formato: emoji|cantidad correcta";
  if (gameType === "matching-pairs")
    return "Linea 1: palabras. Linea 2: pictogramas. Linea 3: mapa de indices correctos.";
  if (gameType === "category-sort")
    return "Formato: palabra|indice de categoria empezando en 0";
  if (gameType === "sound-match")
    return "Formato: sonido|opcion1,opcion2,opcion3|indice correcto empezando en 0";
  if (gameType === "tap-correct")
    return "Formato: consigna|opcion1,opcion2,opcion3|indices correctos separados por coma";
  return "";
}

const emptyMcRound = () => ({
  image: "",
  prompt: "¿Qué pictograma es?",
  options: ["", "", "", ""],
  correct: 0,
});

function isImageValue(value?: string) {
  return Boolean(value?.startsWith("http"));
}

function VisualValue({
  value,
  className = "",
}: {
  value?: string;
  className?: string;
}) {
  if (isImageValue(value)) {
    return (
      <img
        src={value}
        alt=""
        className={`object-contain ${className}`}
        loading="lazy"
      />
    );
  }

  return <span className={className}>{value || "Soltá un pictograma"}</span>;
}

const PICTOGRAM_PAGE_SIZE = 24;
const PICTOGRAM_MAX_RESULTS = 100;

function usePictogramSearch(
  initialSearch: string,
  targetPertenecienteId?: string,
) {
  const [search, setSearchState] = useState(initialSearch);
  const [limit, setLimit] = useState(PICTOGRAM_PAGE_SIZE);
  const [pictograms, setPictograms] = useState<Pictogram[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setSearch = (value: string) => {
    setSearchState(value);
    setLimit(PICTOGRAM_PAGE_SIZE);
  };

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      fetchPictograms({
        search: search.trim(),
        language: "es",
        limit,
        targetPertenecienteId,
      })
        .then((items) => {
          if (!cancelled) setPictograms(items);
        })
        .catch(() => {
          if (!cancelled) {
            setPictograms([]);
            setError(
              "No se pudieron cargar los pictogramas. Intentá nuevamente.",
            );
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search, limit, targetPertenecienteId]);

  return {
    search,
    setSearch,
    pictograms,
    loading,
    error,
    canLoadMore: pictograms.length >= limit && limit < PICTOGRAM_MAX_RESULTS,
    loadMore: () =>
      setLimit((current) =>
        Math.min(PICTOGRAM_MAX_RESULTS, current + PICTOGRAM_PAGE_SIZE),
      ),
  };
}

function PictogramSearchPanel({
  initialSearch,
  onSelect,
  className = "max-h-[520px]",
  targetPertenecienteId,
}: {
  initialSearch: string;
  onSelect: (picto: Pictogram) => void;
  className?: string;
  targetPertenecienteId?: string;
}) {
  const {
    search,
    setSearch,
    pictograms,
    loading,
    error,
    canLoadMore,
    loadMore,
  } = usePictogramSearch(initialSearch, targetPertenecienteId);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar pictograma..."
          className="pl-8"
        />
      </div>
      <div
        className={`grid grid-cols-3 gap-2 overflow-y-auto rounded-lg border bg-card p-2 ${className}`}
        aria-busy={loading}
      >
        {pictograms.map((picto) => (
          <button
            key={picto.id}
            draggable
            onDragStart={(event) =>
              event.dataTransfer.setData(
                "application/json",
                JSON.stringify(picto),
              )
            }
            onClick={() => onSelect(picto)}
            className="rounded-lg border border-border p-2 text-center hover:border-primary hover:bg-primary/5"
            title={picto.name}
          >
            {picto.imageUrl ? (
              <img
                src={picto.imageUrl}
                alt={picto.name}
                className="mx-auto h-12 w-12 object-contain"
                loading="lazy"
              />
            ) : (
              <span className="text-2xl">{picto.emoji}</span>
            )}
            <span className="mt-1 block truncate text-[10px] text-muted-foreground">
              {picto.name}
            </span>
          </button>
        ))}
        {loading && pictograms.length === 0 && (
          <p className="col-span-3 py-6 text-center text-xs text-muted-foreground">
            Buscando pictogramas…
          </p>
        )}
        {!loading && error && (
          <p className="col-span-3 py-6 text-center text-xs text-destructive">
            {error}
          </p>
        )}
        {!loading && !error && pictograms.length === 0 && (
          <p className="col-span-3 py-6 text-center text-xs text-muted-foreground">
            Sin resultados
          </p>
        )}
        {canLoadMore && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loading}
            className="col-span-3"
          >
            {loading ? "Cargando…" : "Cargar más"}
          </Button>
        )}
      </div>
    </div>
  );
}

function MultipleChoiceSandbox({
  value,
  onChange,
  targetPertenecienteId,
}: {
  value?: GameData;
  onChange: (next: GameData) => void;
  targetPertenecienteId?: string;
}) {
  const rounds = value?.rounds?.length ? value.rounds : [emptyMcRound()];
  const [roundIndex, setRoundIndex] = useState(0);

  const current =
    rounds[Math.min(roundIndex, rounds.length - 1)] || emptyMcRound();

  const updateRounds = (nextRounds: typeof rounds) => {
    onChange({ ...value, rounds: nextRounds });
  };

  const updateRound = (patch: Partial<typeof current>) => {
    updateRounds(
      rounds.map((round, index) =>
        index === roundIndex ? { ...round, ...patch } : round,
      ),
    );
  };

  const updateOption = (optionIndex: number, option: string) => {
    updateRound({
      options: current.options.map((item, index) =>
        index === optionIndex ? option : item,
      ),
    });
  };

  const setPictogram = (picto: Pictogram) => {
    updateRound({
      image: picto.imageUrl || picto.emoji,
      prompt: current.prompt || `¿Cuál es "${picto.name}"?`,
      options: current.options.map((option, index) =>
        index === current.correct && !option.trim() ? picto.name : option,
      ),
    });
  };

  const addRound = () => {
    updateRounds([...rounds, emptyMcRound()]);
    setRoundIndex(rounds.length);
  };

  const removeRound = () => {
    if (rounds.length === 1) return;
    const next = rounds.filter((_, index) => index !== roundIndex);
    updateRounds(next);
    setRoundIndex(Math.max(0, roundIndex - 1));
  };

  return (
    <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Constructor visual de opción múltiple
          </p>
          <p className="text-xs text-muted-foreground">
            Arrastrá un pictograma al espacio central, escribí las opciones y
            marcá la correcta.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={removeRound}
            disabled={rounds.length === 1}
          >
            <Trash2 size={14} />
          </Button>
          <Button size="sm" variant="outline" onClick={addRound}>
            <Plus size={14} className="mr-1" />
            Pregunta
          </Button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {rounds.map((_, index) => (
          <button
            key={index}
            onClick={() => setRoundIndex(index)}
            className={`h-8 min-w-8 rounded-md border text-xs font-semibold ${roundIndex === index ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="space-y-3">
          <Input
            value={current.prompt}
            onChange={(e) => updateRound({ prompt: e.target.value })}
            placeholder="Pregunta que verá el perteneciente"
          />

          <div
            className="flex min-h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/40 bg-card p-4 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const raw = e.dataTransfer.getData("application/json");
              if (!raw) return;
              try {
                setPictogram(JSON.parse(raw));
              } catch {
                // noop
              }
            }}
          >
            <VisualValue
              value={current.image}
              className={
                isImageValue(current.image)
                  ? "h-28 w-28"
                  : "text-sm text-muted-foreground"
              }
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Slot central del pictograma
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {current.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center gap-2 rounded-lg border p-2 ${current.correct === index ? "border-primary bg-primary/5" : "border-border bg-card"}`}
              >
                <input
                  type="radio"
                  checked={current.correct === index}
                  onChange={() => updateRound({ correct: index })}
                  className="accent-primary"
                />
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Opción ${index + 1}`}
                />
              </label>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              Vista previa
            </p>
            <div className="rounded-xl border border-border p-4 text-center">
              <p className="text-sm font-medium text-foreground">
                {current.prompt || "Pregunta"}
              </p>
              <div className="my-3 flex min-h-24 items-center justify-center text-6xl">
                <VisualValue
                  value={current.image}
                  className={isImageValue(current.image) ? "h-24 w-24" : ""}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {current.options.map((option, index) => (
                  <div
                    key={index}
                    className={`rounded-lg border p-2 text-xs ${current.correct === index ? "border-green-500 bg-green-50 text-green-800" : "border-border"}`}
                  >
                    {option || `Opción ${index + 1}`}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <PictogramSearchPanel
          initialSearch="comer"
          onSelect={setPictogram}
          className="max-h-[420px]"
          targetPertenecienteId={targetPertenecienteId}
        />
      </div>
    </div>
  );
}

function WheelPreview({ round }: { round: WheelRound }) {
  const count = Math.max(1, round.options.length);
  const segmentRadius = 110;
  const contentRadius = 76;
  const point = (degrees: number, radius: number) => {
    const radians = ((degrees - 90) * Math.PI) / 180;
    return [120 + radius * Math.cos(radians), 120 + radius * Math.sin(radians)];
  };
  return (
    <div className="relative mx-auto h-60 w-60">
      <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 text-2xl text-primary">
        ▼
      </div>
      <svg
        viewBox="0 0 240 240"
        className="h-full w-full"
        aria-label="Vista previa de la ruleta"
      >
        {round.options.map((option, index) => {
          const { start, center, end } = wheelSegmentAngles(index, count);
          const [x1, y1] = point(start, segmentRadius);
          const [x2, y2] = point(end, segmentRadius);
          const [ix, iy] = point(center, contentRadius);
          return (
            <g key={index}>
              <path
                d={`M 120 120 L ${x1} ${y1} A ${segmentRadius} ${segmentRadius} 0 0 1 ${x2} ${y2} Z`}
                fill={
                  index % 2 ? "hsl(var(--accent))" : "hsl(var(--primary) / .18)"
                }
                stroke="hsl(var(--border))"
              />
              {isImageValue(option) ? (
                <image
                  href={option}
                  x={ix - 23}
                  y={iy - 23}
                  width="46"
                  height="46"
                  preserveAspectRatio="xMidYMid meet"
                />
              ) : (
                <text
                  x={ix}
                  y={iy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                >
                  {option || "?"}
                </text>
              )}
            </g>
          );
        })}
        <circle
          cx="120"
          cy="120"
          r="18"
          fill="hsl(var(--card))"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
        />
      </svg>
    </div>
  );
}

function WheelPrecisionSandbox({
  value,
  onChange,
  targetPertenecienteId,
}: {
  value?: GameData;
  onChange: (next: GameData) => void;
  targetPertenecienteId?: string;
}) {
  const wheel = normalizeWheel(value?.wheel);
  const rounds = wheel.rounds.length
    ? wheel.rounds
    : [
        normalizeRound(
          { targetWord: "", options: [] },
          wheel.settings.segments,
        ),
      ];
  const [roundIndex, setRoundIndex] = useState(0);
  const currentIndex = Math.min(roundIndex, rounds.length - 1);
  const current = rounds[currentIndex];

  const commit = (nextRounds = rounds, settings = wheel.settings) =>
    onChange({
      ...value,
      wheel: {
        rounds: nextRounds.map((round) =>
          normalizeRound(round, settings.segments),
        ),
        settings,
      },
    });
  const updateRound = (patch: Partial<WheelRound>) =>
    commit(
      rounds.map((round, index) =>
        index === currentIndex
          ? normalizeRound({ ...round, ...patch }, wheel.settings.segments)
          : round,
      ),
    );
  const setSegments = (segments: number) => {
    const settings = { ...wheel.settings, segments };
    commit(
      rounds.map((round) => {
        const correctValue = round.options[round.correct] || round.image;
        const options = [...round.options];
        if (round.correct >= segments && correctValue)
          options[segments - 1] = correctValue;
        return normalizeRound(
          {
            ...round,
            options,
            correct: Math.min(round.correct, segments - 1),
            image: correctValue,
          },
          segments,
        );
      }),
      settings,
    );
  };
  const assignPictogram = (picto: Pictogram, optionIndex = current.correct) => {
    const image = picto.imageUrl || picto.emoji;
    const options = current.options.map((option, index) =>
      index === optionIndex ? image : option,
    );
    updateRound(
      optionIndex === current.correct ? { options, image } : { options },
    );
  };
  const markCorrect = (correct: number) =>
    updateRound({ correct, image: current.options[correct] || "" });
  const addRound = () => {
    commit([
      ...rounds,
      normalizeRound({ targetWord: "", options: [] }, wheel.settings.segments),
    ]);
    setRoundIndex(rounds.length);
  };
  const removeRound = () => {
    if (rounds.length === 1) return;
    commit(rounds.filter((_, index) => index !== currentIndex));
    setRoundIndex(Math.max(0, currentIndex - 1));
  };
  const dropPicto = (event: React.DragEvent, optionIndex: number) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData("application/json");
    if (raw)
      try {
        assignPictogram(JSON.parse(raw), optionIndex);
      } catch {
        /* noop */
      }
  };

  return (
    <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
      <div className="grid gap-3 rounded-lg border bg-card p-3 sm:grid-cols-3">
        <label className="text-xs font-medium">
          Segmentos: {wheel.settings.segments}
          <input
            type="range"
            min={4}
            max={8}
            value={wheel.settings.segments}
            onChange={(e) => setSegments(Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
        </label>
        <label className="text-xs font-medium">
          Velocidad: {wheel.settings.initialSpeed}
          <input
            type="range"
            min={1}
            max={5}
            value={wheel.settings.initialSpeed}
            onChange={(e) =>
              commit(rounds, {
                ...wheel.settings,
                initialSpeed: Number(e.target.value),
              })
            }
            className="mt-2 w-full accent-primary"
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-xs font-medium">
          Acelerar por ronda
          <input
            type="checkbox"
            checked={wheel.settings.speedIncrease}
            onChange={(e) =>
              commit(rounds, {
                ...wheel.settings,
                speedIncrease: e.target.checked,
              })
            }
            className="h-5 w-5 accent-primary"
          />
        </label>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto">
        {rounds.map((_, index) => (
          <button
            key={index}
            onClick={() => setRoundIndex(index)}
            className={`h-8 rounded-md border px-3 text-xs font-semibold ${currentIndex === index ? "bg-primary text-primary-foreground" : "bg-card"}`}
          >
            Ronda {index + 1}
          </button>
        ))}
        <Button size="sm" variant="outline" onClick={addRound}>
          <Plus size={14} className="mr-1" />
          Nueva
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={removeRound}
          disabled={rounds.length === 1}
        >
          <Trash2 size={14} />
        </Button>
      </div>
      <Input
        value={current.targetWord}
        onChange={(e) =>
          updateRound({ targetWord: e.target.value.toUpperCase() })
        }
        placeholder="Palabra objetivo"
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="space-y-3">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => dropPicto(e, current.correct)}
            className="rounded-xl border-2 border-dashed border-primary/40 bg-card p-3 text-center"
          >
            <p className="mb-2 text-xs font-semibold">Pictograma correcto</p>
            <VisualValue
              value={current.image}
              className={
                isImageValue(current.image)
                  ? "mx-auto h-24 w-24"
                  : "text-sm text-muted-foreground"
              }
            />
            <p className="mt-2 text-[10px] text-muted-foreground">
              Arrastrá aquí o al segmento correcto
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold">Opciones de la rueda</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {current.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => markCorrect(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => dropPicto(e, index)}
                  className={`relative flex min-h-24 flex-col items-center justify-center rounded-lg border-2 p-2 ${current.correct === index ? "border-green-500 bg-green-50" : "border-border bg-card"}`}
                >
                  <VisualValue
                    value={option}
                    className={isImageValue(option) ? "h-14 w-14" : "text-xs"}
                  />
                  <span className="mt-1 text-[10px]">
                    {current.correct === index
                      ? "● correcto"
                      : `Segmento ${index + 1}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              Vista previa
            </p>
            <WheelPreview round={current} />
          </div>
        </div>
        <PictogramSearchPanel
          initialSearch="manzana"
          onSelect={assignPictogram}
          targetPertenecienteId={targetPertenecienteId}
        />
      </div>
    </div>
  );
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function MemorySandbox({
  value,
  onChange,
  targetPertenecienteId,
}: {
  value?: GameData;
  onChange: (next: GameData) => void;
  targetPertenecienteId?: string;
}) {
  const memory = normalizeMemory(value?.memory);
  const pairs = memory.pairs.length
    ? memory.pairs
    : Array.from({ length: 4 }, () => ({ a: "", b: "" }));
  const [selected, setSelected] = useState<{ pair: number; side: "a" | "b" }>({
    pair: 0,
    side: "a",
  });

  const commit = (nextPairs = pairs, settings = memory.settings) =>
    onChange({ ...value, memory: { pairs: nextPairs, settings } });
  const updateSide = (
    pairIndex: number,
    side: "a" | "b",
    content: string,
    accessibleLabel?: string,
  ) => {
    const labelKey = side === "a" ? "aLabel" : "bLabel";
    commit(
      pairs.map((pair, index) =>
        index === pairIndex
          ? { ...pair, [side]: content, [labelKey]: accessibleLabel }
          : pair,
      ),
    );
  };
  const addPair = () => {
    if (pairs.length >= 8) return;
    commit([...pairs, { a: "", b: "" }]);
    setSelected({ pair: pairs.length, side: "a" });
  };
  const removePair = (pairIndex: number) => {
    if (pairs.length <= 4) return;
    commit(pairs.filter((_, index) => index !== pairIndex));
    setSelected((current) => ({
      ...current,
      pair: Math.min(current.pair, pairs.length - 2),
    }));
  };
  const assignPictogram = (picto: Pictogram) =>
    updateSide(
      selected.pair,
      selected.side,
      picto.imageUrl || picto.emoji,
      picto.name,
    );

  return (
    <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Constructor visual de memoria
          </p>
          <p className="text-xs text-muted-foreground">
            Relacioná dos contenidos distintos: pictograma, emoji o texto.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addPair}
          disabled={pairs.length >= 8}
        >
          <Plus size={14} className="mr-1" />
          Pareja
        </Button>
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-2">
        <label className="flex items-center justify-between gap-3 text-xs font-medium">
          Mostrar cartas al comenzar
          <input
            type="checkbox"
            checked={memory.settings.previewEnabled}
            onChange={(event) =>
              commit(pairs, {
                ...memory.settings,
                previewEnabled: event.target.checked,
              })
            }
            className="h-5 w-5 accent-primary"
          />
        </label>
        <label className="flex items-center justify-between gap-3 text-xs font-medium">
          Usar contrarreloj
          <input
            type="checkbox"
            checked={memory.settings.timed}
            onChange={(event) =>
              commit(pairs, { ...memory.settings, timed: event.target.checked })
            }
            className="h-5 w-5 accent-primary"
          />
        </label>
        {memory.settings.previewEnabled && (
          <label className="text-xs font-medium">
            Vista previa: {memory.settings.previewSeconds}s
            <input
              type="range"
              min={2}
              max={8}
              value={memory.settings.previewSeconds}
              onChange={(event) =>
                commit(pairs, {
                  ...memory.settings,
                  previewSeconds: Number(event.target.value),
                })
              }
              className="mt-2 w-full accent-primary"
            />
          </label>
        )}
        {memory.settings.timed && (
          <label className="text-xs font-medium">
            Tiempo: {memory.settings.timeLimitSeconds}s
            <input
              type="range"
              min={30}
              max={180}
              step={15}
              value={memory.settings.timeLimitSeconds}
              onChange={(event) =>
                commit(pairs, {
                  ...memory.settings,
                  timeLimitSeconds: Number(event.target.value),
                })
              }
              className="mt-2 w-full accent-primary"
            />
          </label>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="space-y-2">
          {pairs.map((pair, pairIndex) => (
            <div
              key={pairIndex}
              className="rounded-lg border border-border bg-card p-2"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-primary">
                  Pareja {pairIndex + 1}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removePair(pairIndex)}
                  disabled={pairs.length <= 4}
                  aria-label={`Eliminar pareja ${pairIndex + 1}`}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["a", "b"] as const).map((side) => (
                  <div
                    key={side}
                    onClick={() => setSelected({ pair: pairIndex, side })}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const raw =
                        event.dataTransfer.getData("application/json");
                      if (raw)
                        try {
                          const picto = JSON.parse(raw) as Pictogram;
                          updateSide(
                            pairIndex,
                            side,
                            picto.imageUrl || picto.emoji,
                            picto.name,
                          );
                        } catch {
                          /* noop */
                        }
                    }}
                    className={`rounded-lg border-2 p-2 ${selected.pair === pairIndex && selected.side === side ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <div className="mb-2 flex h-20 items-center justify-center overflow-hidden rounded-md bg-muted/30 text-3xl">
                      <VisualValue
                        value={pair[side]}
                        className={isImageValue(pair[side]) ? "h-16 w-16" : ""}
                      />
                    </div>
                    <Input
                      value={pair[side]}
                      onFocus={() => setSelected({ pair: pairIndex, side })}
                      onChange={(event) =>
                        updateSide(pairIndex, side, event.target.value)
                      }
                      placeholder={`Lado ${side.toUpperCase()}`}
                      aria-label={`Pareja ${pairIndex + 1}, lado ${side.toUpperCase()}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            {pairs.length}/8 parejas · mínimo 4
          </p>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            Asignar al lado {selected.side.toUpperCase()} de la pareja{" "}
            {selected.pair + 1}
          </p>
          <PictogramSearchPanel
            initialSearch="escuela"
            onSelect={assignPictogram}
            className="max-h-[520px]"
            targetPertenecienteId={targetPertenecienteId}
          />
        </div>
      </div>
    </div>
  );
}

function DragWordSandbox({
  value,
  onChange,
  targetPertenecienteId,
}: {
  value?: GameData;
  onChange: (next: GameData) => void;
  targetPertenecienteId?: string;
}) {
  const rounds = value?.dragRounds?.length
    ? value.dragRounds
    : [{ image: "", correct: "", letters: [] }];
  const [roundIndex, setRoundIndex] = useState(0);
  const [search, setSearch] = useState("comer");
  const [pictograms, setPictograms] = useState<Pictogram[]>([]);

  const current = rounds[Math.min(roundIndex, rounds.length - 1)];

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      fetchPictograms({ search, targetPertenecienteId })
        .then((items) => {
          if (!cancelled) setPictograms(items.slice(0, 24));
        })
        .catch(() => {
          if (!cancelled) setPictograms([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search, targetPertenecienteId]);

  const updateRounds = (nextRounds: typeof rounds) => {
    onChange({ ...value, dragRounds: nextRounds });
  };

  const updateRound = (patch: Partial<(typeof rounds)[number]>) => {
    updateRounds(
      rounds.map((r, idx) => (idx === roundIndex ? { ...r, ...patch } : r)),
    );
  };

  const setPictogram = (picto: Pictogram) => {
    updateRound({
      image: picto.imageUrl || picto.emoji,
      correct: picto.name.toLowerCase(),
      letters: [],
    });
  };

  const addRound = () => {
    const next = [...rounds, { image: "", correct: "", letters: [] }];
    updateRounds(next);
    setRoundIndex(rounds.length);
  };

  const removeRound = () => {
    if (rounds.length === 1) return;
    const next = rounds.filter((_, idx) => idx !== roundIndex);
    updateRounds(next);
    setRoundIndex(Math.max(0, roundIndex - 1));
  };

  const previewLetters = useMemo(() => {
    const chars = (current.correct || "").split("");
    return shuffleArray(chars);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.correct]);

  return (
    <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Constructor de "Armá la palabra"
          </p>
          <p className="text-xs text-muted-foreground">
            Arrastrá un pictograma, escribí la palabra y editá las fichas de
            letras.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={removeRound}
            disabled={rounds.length === 1}
          >
            <Trash2 size={14} />
          </Button>
          <Button size="sm" variant="outline" onClick={addRound}>
            <Plus size={14} className="mr-1" />
            Ronda
          </Button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {rounds.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setRoundIndex(idx)}
            className={`h-8 min-w-8 rounded-md border text-xs font-semibold ${roundIndex === idx ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="space-y-4">
          {/* Pictograma */}
          <div
            className="flex min-h-36 flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/40 bg-card p-4 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const raw = e.dataTransfer.getData("application/json");
              if (!raw) return;
              try {
                setPictogram(JSON.parse(raw));
              } catch {
                /* noop */
              }
            }}
          >
            <VisualValue
              value={current.image}
              className={
                isImageValue(current.image)
                  ? "h-28 w-28"
                  : "text-sm text-muted-foreground"
              }
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Slot del pictograma
            </p>
          </div>

          {/* Palabra correcta */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Palabra correcta
            </label>
            <Input
              value={current.correct}
              onChange={(e) => {
                const next = e.target.value
                  .toLowerCase()
                  .replace(/[^a-záéíóúñü]/g, "");
                updateRound({ correct: next, letters: [] });
              }}
              placeholder="ej: manzana"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Las fichas se auto-generan de esta palabra. Editalas abajo si
              querés agregar distractores.
            </p>
          </div>

          {/* Editor de fichas (cada ficha es una letra de la palabra) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">
                Fichas de letras
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  updateRound({ correct: current.correct + "a", letters: [] })
                }
                className="h-6 gap-1 text-xs"
                disabled={!current.correct.trim()}
              >
                <Plus size={12} />
                Agregar
              </Button>
            </div>
            {current.correct.trim() ? (
              <div className="flex flex-wrap gap-2">
                {current.correct.split("").map((ch, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1"
                  >
                    <Input
                      value={ch}
                      onChange={(e) => {
                        const next = current.correct.split("");
                        next[idx] =
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-záéíóúñü]/g, "") || "a";
                        updateRound({ correct: next.join(""), letters: [] });
                      }}
                      className="h-7 w-10 min-w-0 px-1 text-center text-sm font-bold"
                      maxLength={1}
                    />
                    <button
                      onClick={() => {
                        if (current.correct.length <= 1) return;
                        const next = current.correct.split("");
                        next.splice(idx, 1);
                        updateRound({ correct: next.join(""), letters: [] });
                      }}
                      className="text-destructive hover:bg-destructive/10 rounded p-0.5"
                      disabled={current.correct.length <= 1}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    updateRound({ correct: current.correct + "a", letters: [] })
                  }
                  className="h-8 w-8 p-0 text-muted-foreground"
                >
                  <Plus size={14} />
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Primero escribí la palabra correcta.
              </p>
            )}
            <div className="text-[10px] text-muted-foreground">
              {current.correct.trim() && (
                <span>
                  {current.correct.length} letra
                  {current.correct.length !== 1 ? "s" : ""} — los slots se
                  sincronizan automáticamente
                </span>
              )}
            </div>
          </div>

          {/* Vista previa */}
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              Vista previa
            </p>
            <div className="rounded-xl border border-border p-4 text-center">
              <div className="my-3 flex min-h-20 items-center justify-center text-6xl">
                <VisualValue
                  value={current.image}
                  className={isImageValue(current.image) ? "h-20 w-20" : ""}
                />
              </div>
              <div className="mb-3 flex flex-wrap justify-center gap-1">
                {(current.correct || "?????").split("").map((_, idx) => (
                  <div
                    key={idx}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/40 bg-muted/30 text-xs text-muted-foreground"
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {(previewLetters.length ? previewLetters : ["?", "?", "?"]).map(
                  (letter, idx) => (
                    <div
                      key={idx}
                      className="flex h-10 w-10 cursor-grab items-center justify-center rounded-lg border-2 border-primary/40 bg-primary/5 text-sm font-bold text-foreground shadow-sm"
                    >
                      {letter}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Buscador de pictogramas */}
        <div className="space-y-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pictograma..."
              className="pl-8"
            />
          </div>
          <div className="grid max-h-[500px] grid-cols-3 gap-2 overflow-y-auto rounded-lg border border-border bg-card p-2">
            {pictograms.map((picto) => (
              <button
                key={picto.id}
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData(
                    "application/json",
                    JSON.stringify(picto),
                  )
                }
                onClick={() => setPictogram(picto)}
                className="rounded-lg border border-border p-2 text-center hover:border-primary hover:bg-primary/5"
                title={picto.name}
              >
                {picto.imageUrl ? (
                  <img
                    src={picto.imageUrl}
                    alt={picto.name}
                    className="mx-auto h-12 w-12 object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-2xl">{picto.emoji}</span>
                )}
                <span className="mt-1 block truncate text-[10px] text-muted-foreground">
                  {picto.name}
                </span>
              </button>
            ))}
            {pictograms.length === 0 && (
              <p className="col-span-3 py-6 text-center text-xs text-muted-foreground">
                Sin resultados
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  initialId?: string;
  onClose: () => void;
  assignableUsersOverride?: User[];
}

export default function ActivityBuilder({
  initialId,
  onClose,
  assignableUsersOverride,
}: Props) {
  const { user } = useAuth();
  const { items, createOrUpdate } = useCustomActivities();
  const { toast } = useToast();
  const editing = initialId ? items.find((a) => a.id === initialId) : undefined;

  const [step, setStep] = useState(editing ? 1 : 0); // 0 = plantilla
  const [tplSearch, setTplSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);

  const linkedUserIds: string[] = useMemo(() => {
    return assignableUsers.map((item) => item.id);
  }, [assignableUsers]);

  useEffect(() => {
    if (assignableUsersOverride) {
      setAssignableUsers(assignableUsersOverride);
      return;
    }
    if (!user || (user.role !== "professional" && user.role !== "tutor"))
      return;
    let cancelled = false;
    fetchLinkedPertenecientesForSupportUser(
      user.id,
      user.role === "professional" ? "professional" : "tutor",
    )
      .then((items) => {
        if (!cancelled) setAssignableUsers(items);
      })
      .catch(() => {
        if (!cancelled) setAssignableUsers([]);
      });
    return () => {
      cancelled = true;
    };
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
        stepIcons: [...(editing.stepIcons || editing.steps.map(() => "📌"))],
        points: editing.points,
        completionMessage: editing.completionMessage || "¡Bien hecho!",
        assignedToIds:
          editing.assignedToIds ||
          (editing.assignedTo ? [editing.assignedTo] : []),
        dueDate: editing.dueDate || "",
        notes: editing.notes || "",
        draft: editing.draft,
        gameType: editing.gameType,
        gameData: editing.gameData,
      };
    }
    return {
      id: undefined as string | undefined,
      title: "",
      category: "autonomía personal" as ActivityCategory,
      type: "guiada" as ActivityType,
      difficulty: "fácil" as "fácil" | "medio" | "avanzado",
      duration: "10 min",
      objective: "",
      description: "",
      steps: [""],
      stepIcons: ["📌"],
      points: 30,
      completionMessage: "¡Bien hecho!",
      assignedToIds: [] as string[],
      dueDate: "",
      notes: "",
      draft: true,
      gameType: undefined as undefined | import("@/data/miniGames").GameType,
      gameData: undefined as undefined | import("@/data/miniGames").GameData,
    };
  });
  const [gameContentText, setGameContentText] = useState(() =>
    serializeGameContent(form.gameType, form.gameData),
  );

  const applyTemplate = (tpl: ActivityTemplate | GameTemplate) => {
    const isGame = (tpl as GameTemplate).gameType !== undefined;
    const nextGameType = isGame ? (tpl as GameTemplate).gameType : undefined;
    const nextGameData = isGame ? (tpl as GameTemplate).gameData : undefined;
    setForm((prev) => ({
      ...prev,
      title: tpl.id === "tpl-blank" ? "" : tpl.name,
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
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((s, idx) => (idx === i ? value : s)),
    }));
  const updateIcon = (i: number, icon: string) =>
    setForm((prev) => ({
      ...prev,
      stepIcons: prev.stepIcons.map((s, idx) => (idx === i ? icon : s)),
    }));
  const addStep = () =>
    setForm((prev) => ({
      ...prev,
      steps: [...prev.steps, ""],
      stepIcons: [...prev.stepIcons, "📌"],
    }));
  const removeStep = (i: number) =>
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, idx) => idx !== i),
      stepIcons: prev.stepIcons.filter((_, idx) => idx !== i),
    }));
  const moveStep = (i: number, dir: -1 | 1) =>
    setForm((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.steps.length) return prev;
      const steps = [...prev.steps];
      const icons = [...prev.stepIcons];
      [steps[i], steps[j]] = [steps[j], steps[i]];
      [icons[i], icons[j]] = [icons[j], icons[i]];
      return { ...prev, steps, stepIcons: icons };
    });

  const toggleAssign = (uid: string) =>
    setForm((prev) => ({
      ...prev,
      assignedToIds: prev.assignedToIds.includes(uid)
        ? prev.assignedToIds.filter((x) => x !== uid)
        : [...prev.assignedToIds, uid],
    }));

  // Validación por paso
  const errors: Record<number, string | null> = {
    1: !form.title.trim()
      ? "Falta el título"
      : !form.objective.trim()
        ? "Falta el objetivo"
        : null,
    2:
      form.steps.filter((s) => s.trim()).length < 1
        ? "Necesitás al menos 1 paso con texto"
        : null,
    3: null,
    4: null,
  };
  const canNext = !errors[step];

  const persist = async (publishNow: boolean) => {
    if (publishNow && form.gameType === "wheel") {
      const wheelError = wheelValidationError(form.gameData?.wheel);
      if (wheelError) {
        toast({
          title: "La ruleta está incompleta",
          description: wheelError,
          variant: "destructive",
        });
        setStep(2);
        return;
      }
    }
    if (publishNow && form.gameType === "memory") {
      const memoryError = memoryValidationError(form.gameData?.memory);
      if (memoryError) {
        toast({
          title: "El juego de memoria está incompleto",
          description: memoryError,
          variant: "destructive",
        });
        setStep(2);
        return;
      }
    }
    setSaving(true);

    try {
      const mineCreations = await aiPictogramsApi
        .mine()
        .catch(() => [] as any[]);
      const privateCreations = mineCreations.filter(
        (x: any) => x.status === "private",
      );

      const collectUrls = (obj: any): string[] => {
        if (!obj) return [];
        if (typeof obj === "string") {
          return obj.startsWith("http") ? [obj] : [];
        }
        if (Array.isArray(obj)) {
          return obj.flatMap(collectUrls);
        }
        if (typeof obj === "object") {
          return Object.values(obj).flatMap(collectUrls);
        }
        return [];
      };

      const usedUrls = collectUrls(form.gameData);
      const usedPrivateCreations = privateCreations.filter((c: any) =>
        usedUrls.includes(c.imageUrl),
      );

      if (usedPrivateCreations.length > 0) {
        if (form.assignedToIds.length !== 1) {
          toast({
            title: "No se puede guardar la actividad",
            description:
              "Usaste un pictograma privado. Para poder guardarla, esta actividad debe estar asignada a un único perteneciente (el destinatario de ese pictograma).",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }

        const singleAssignedId = Number(form.assignedToIds[0]);
        const unauthorizedCreations = usedPrivateCreations.filter(
          (c: any) => Number(c.targetPertenecienteId) !== singleAssignedId,
        );

        if (unauthorizedCreations.length > 0) {
          toast({
            title: "No se puede guardar la actividad",
            description: `El pictograma "${unauthorizedCreations[0].name}" es privado y pertenece a otro usuario. Cambialo o asigná la actividad al destinatario correcto.`,
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
      }
    } catch (err) {
      console.error("Error validating private pictograms", err);
    }

    const cleanSteps = form.steps
      .map((s, i) => ({ s, ic: form.stepIcons[i] || "📌" }))
      .filter((x) => x.s.trim());
    try {
      const result = await createOrUpdate({
        id: form.id,
        title: form.title.trim() || "Actividad sin título",
        category: form.category,
        type: form.type,
        difficulty: form.difficulty,
        duration: form.duration,
        objective: form.objective.trim(),
        description: form.description.trim(),
        steps: cleanSteps.map((x) => x.s),
        stepIcons: cleanSteps.map((x) => x.ic),
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
      if (publishNow) {
        const assignment = result?.assignment;
        const deniedCount = assignment?.denied.length || 0;
        const errorCount = assignment?.errors.length || 0;
        if (deniedCount || errorCount) {
          toast({
            title: assignment?.assigned
              ? "Actividad publicada parcialmente"
              : "No se pudo publicar",
            description: assignment?.assigned
              ? "Algunos vinculados no recibieron la actividad porque el tutor no lo permite."
              : "El tutor no permite asignar actividades a los vinculados seleccionados.",
            variant: assignment?.assigned ? "default" : "destructive",
          });
        } else {
          toast({
            title: "Actividad publicada",
            description: "La actividad fue asignada correctamente.",
          });
        }
      } else {
        toast({ title: "Borrador guardado" });
      }
      onClose();
    } catch (error) {
      toast({
        title: publishNow ? "No se pudo publicar" : "No se pudo guardar",
        description:
          error instanceof Error
            ? error.message
            : "Revisa la conexion con el backend.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const q = tplSearch.toLowerCase();
  const filteredTpls = ACTIVITY_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(q) || t.tags.some((tag) => tag.includes(q)),
  );
  const filteredGameTpls = GAME_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(q) || t.tags.some((tag) => tag.includes(q)),
  );

  const stepsLabels = [
    "Plantilla",
    "Datos básicos",
    "Pasos",
    "Asignar",
    "Revisar",
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            <h2 className="font-heading font-bold text-lg sm:text-xl text-foreground">
              {editing ? "Editar actividad" : "Crear actividad"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {stepsLabels.map((lbl, i) => (
            <button
              key={i}
              onClick={() => {
                if (i === 0 || !errors[Math.min(step, i)] || i < step)
                  setStep(i);
              }}
              className={`flex-1 min-w-[80px] text-[11px] sm:text-xs px-2 py-2 rounded-lg border transition-colors ${
                step === i
                  ? "gradient-primary text-primary-foreground border-transparent font-semibold"
                  : i < step
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-card text-muted-foreground border-border"
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
                  <h3 className="font-heading font-semibold text-foreground mb-1">
                    Elegí una plantilla
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Te ahorra tiempo. Después podés modificar todo. Incluye
                    actividades guiadas y{" "}
                    <span className="font-semibold text-primary">
                      mini-juegos
                    </span>{" "}
                    🎮.
                  </p>
                </div>
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    value={tplSearch}
                    onChange={(e) => setTplSearch(e.target.value)}
                    placeholder="Buscar plantilla…"
                    className="pl-9"
                  />
                </div>

                {/* Mini-juegos */}
                {filteredGameTpls.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Gamepad2 size={14} className="text-primary" />
                      <h4 className="text-sm font-semibold text-foreground">
                        Mini-juegos interactivos
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {filteredGameTpls.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredGameTpls.map((tpl) => (
                        <button
                          key={tpl.id}
                          onClick={() => applyTemplate(tpl)}
                          className="text-left p-3 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/10 hover:border-primary transition-colors flex gap-3"
                        >
                          <span className="text-2xl shrink-0">{tpl.emoji}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="font-medium text-sm text-foreground truncate">
                                {tpl.name}
                              </p>
                              <span className="text-[9px] px-1 py-0.5 rounded bg-primary text-primary-foreground font-bold">
                                JUEGO
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {tpl.gameType} · {tpl.duration}
                            </p>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">
                              {tpl.description}
                            </p>
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
                      <Sparkles size={14} className="text-primary" />{" "}
                      Actividades guiadas
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredTpls.map((tpl) => (
                        <button
                          key={tpl.id}
                          onClick={() => applyTemplate(tpl)}
                          className="text-left p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/40 transition-colors flex gap-3"
                        >
                          <span className="text-2xl shrink-0">{tpl.emoji}</span>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">
                              {tpl.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {tpl.category} · {tpl.duration}
                            </p>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">
                              {tpl.description || "Empezar desde cero"}
                            </p>
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
                <h3 className="font-heading font-semibold text-foreground">
                  Datos básicos
                </h3>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Título *
                  </label>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="Ej: Preparar la mochila"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Objetivo *
                  </label>
                  <Input
                    value={form.objective}
                    onChange={(e) =>
                      setForm({ ...form, objective: e.target.value })
                    }
                    placeholder="¿Qué se busca lograr?"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Descripción
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Breve descripción de la actividad…"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Categoría
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          category: e.target.value as ActivityCategory,
                        })
                      }
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Tipo
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          type: e.target.value as ActivityType,
                        })
                      }
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {TYPES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Dificultad
                    </label>
                    <select
                      value={form.difficulty}
                      onChange={(e) =>
                        setForm({ ...form, difficulty: e.target.value as any })
                      }
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {DIFFICULTIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Duración
                    </label>
                    <select
                      value={form.duration}
                      onChange={(e) =>
                        setForm({ ...form, duration: e.target.value })
                      }
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {DURATIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Puntos al completar: {form.points}
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={150}
                    step={10}
                    value={form.points}
                    onChange={(e) =>
                      setForm({ ...form, points: Number(e.target.value) })
                    }
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            )}

            {/* Paso 2 — Pasos */}
            {step === 2 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-semibold text-foreground">
                    {form.gameType ? "Contenido y pasos" : "Pasos secuenciales"}
                  </h3>
                  <Button size="sm" variant="outline" onClick={addStep}>
                    <Plus size={14} className="mr-1" />
                    Agregar
                  </Button>
                </div>
                {form.gameType === "drag-word" && (
                  <DragWordSandbox
                    value={form.gameData}
                    targetPertenecienteId={form.assignedToIds.join(",")}
                    onChange={(nextGameData) => {
                      setForm((prev) => ({ ...prev, gameData: nextGameData }));
                      setGameContentText(
                        serializeGameContent("drag-word", nextGameData),
                      );
                    }}
                  />
                )}
                {form.gameType === "multiple-choice" && (
                  <MultipleChoiceSandbox
                    value={form.gameData}
                    targetPertenecienteId={form.assignedToIds.join(",")}
                    onChange={(nextGameData) => {
                      setForm((prev) => ({ ...prev, gameData: nextGameData }));
                      setGameContentText(
                        serializeGameContent("multiple-choice", nextGameData),
                      );
                    }}
                  />
                )}
                {form.gameType === "wheel" && (
                  <WheelPrecisionSandbox
                    value={form.gameData}
                    targetPertenecienteId={form.assignedToIds.join(",")}
                    onChange={(nextGameData) => {
                      setForm((prev) => ({ ...prev, gameData: nextGameData }));
                      setGameContentText(
                        serializeGameContent("wheel", nextGameData),
                      );
                    }}
                  />
                )}
                {form.gameType === "memory" && (
                  <MemorySandbox
                    value={form.gameData}
                    targetPertenecienteId={form.assignedToIds.join(",")}
                    onChange={(nextGameData) => {
                      setForm((prev) => ({ ...prev, gameData: nextGameData }));
                      setGameContentText(
                        serializeGameContent("memory", nextGameData),
                      );
                    }}
                  />
                )}
                {form.gameType &&
                  form.gameType !== "multiple-choice" &&
                  form.gameType !== "drag-word" &&
                  form.gameType !== "wheel" &&
                  form.gameType !== "memory" && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Contenido del juego: {form.gameType}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contentHelp(form.gameType)}
                          </p>
                        </div>
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                          editable
                        </span>
                      </div>
                      <textarea
                        value={gameContentText}
                        onChange={(e) => {
                          const nextText = e.target.value;
                          setGameContentText(nextText);
                          setForm((prev) => ({
                            ...prev,
                            gameData: prev.gameType
                              ? parseGameContent(
                                  prev.gameType,
                                  nextText,
                                  prev.gameData,
                                )
                              : prev.gameData,
                          }));
                        }}
                        rows={6}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Carga el contenido del juego..."
                      />
                    </div>
                  )}
                <p className="text-xs text-muted-foreground">
                  Pictograma + texto. Mantené pasos cortos y concretos.
                </p>
                <div className="space-y-2">
                  {form.steps.map((s, i) => (
                    <div
                      key={i}
                      className="flex gap-2 items-start bg-muted/30 rounded-lg p-2"
                    >
                      <div className="flex flex-col gap-0.5 pt-1">
                        <button
                          onClick={() => moveStep(i, -1)}
                          disabled={i === 0}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                        >
                          ▲
                        </button>
                        <GripVertical
                          size={12}
                          className="text-muted-foreground"
                        />
                        <button
                          onClick={() => moveStep(i, 1)}
                          disabled={i === form.steps.length - 1}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                        >
                          ▼
                        </button>
                      </div>
                      <details className="relative">
                        <summary className="list-none cursor-pointer w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-xl">
                          {form.stepIcons[i] || "📌"}
                        </summary>
                        <div className="absolute z-10 mt-1 left-0 w-64 p-2 bg-card border border-border rounded-lg shadow-lg grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                          {STEP_ICON_OPTIONS.map((ic) => (
                            <button
                              key={ic}
                              onClick={(e) => {
                                updateIcon(i, ic);
                                (
                                  e.currentTarget.closest("details") as any
                                ).open = false;
                              }}
                              className="w-7 h-7 rounded hover:bg-muted text-lg"
                            >
                              {ic}
                            </button>
                          ))}
                        </div>
                      </details>
                      <Input
                        value={s}
                        onChange={(e) => updateStep(i, e.target.value)}
                        placeholder={`Paso ${i + 1}`}
                        className="flex-1"
                      />
                      <button
                        onClick={() => removeStep(i)}
                        disabled={form.steps.length === 1}
                        className="p-2 text-destructive disabled:opacity-30 hover:bg-destructive/10 rounded-md"
                        aria-label="Eliminar paso"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Mensaje al completar
                  </label>
                  <Input
                    value={form.completionMessage}
                    onChange={(e) =>
                      setForm({ ...form, completionMessage: e.target.value })
                    }
                    placeholder="¡Excelente trabajo!"
                  />
                </div>
              </div>
            )}

            {/* Paso 3 — Asignar */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-heading font-semibold text-foreground">
                  Asignar a vinculados
                </h3>
                {linkedUserIds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay usuarios vinculados. Podés guardar como borrador y
                    asignar luego.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {assignableUsers
                      .filter((u) => linkedUserIds.includes(u.id))
                      .map((u) => {
                        const checked = form.assignedToIds.includes(u.id);
                        return (
                          <button
                            key={u.id}
                            onClick={() => toggleAssign(u.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}
                          >
                            <span className="text-2xl">{u.avatar}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">
                                {u.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {u.age} años · Nivel {u.level}
                              </p>
                            </div>
                            <span
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs ${checked ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}
                            >
                              {checked ? "✓" : ""}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Fecha límite (opcional)
                  </label>
                  <Input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm({ ...form, dueDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Nota interna (no visible para el usuario)
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    rows={2}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Observaciones para tu seguimiento…"
                  />
                </div>
              </div>
            )}

            {/* Paso 4 — Revisar */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="font-heading font-semibold text-foreground">
                  Revisar y publicar
                </h3>
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <p className="font-bold text-foreground">
                    {form.title || "Sin título"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {form.category} · {form.type} · {form.difficulty} ·{" "}
                    {form.duration} · {form.points} pts
                  </p>
                  <p className="text-sm text-foreground">🎯 {form.objective}</p>
                  {form.description && (
                    <p className="text-sm text-muted-foreground">
                      {form.description}
                    </p>
                  )}
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-foreground mb-1">
                      Pasos ({form.steps.filter((s) => s.trim()).length}):
                    </p>
                    <ol className="space-y-1">
                      {form.steps
                        .filter((s) => s.trim())
                        .map((s, i) => (
                          <li
                            key={i}
                            className="text-xs text-foreground flex gap-2"
                          >
                            <span>{form.stepIcons[i] || "📌"}</span>
                            {s}
                          </li>
                        ))}
                    </ol>
                  </div>
                  <div className="pt-2 text-xs">
                    <span className="text-muted-foreground">Asignada a: </span>
                    <span className="text-foreground">
                      {form.assignedToIds.length === 0
                        ? "— (borrador)"
                        : form.assignedToIds
                            .map(
                              (id) =>
                                assignableUsers
                                  .find((u) => u.id === id)
                                  ?.name.split(" ")[0],
                            )
                            .filter(Boolean)
                            .join(", ")}
                    </span>
                  </div>
                  {form.dueDate && (
                    <p className="text-xs text-muted-foreground">
                      📅 Hasta {form.dueDate}
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => persist(false)}
                    disabled={saving}
                  >
                    <Save size={14} className="mr-1" /> Guardar como borrador
                  </Button>
                  <Button
                    className="flex-1 gradient-primary text-primary-foreground"
                    onClick={() => persist(true)}
                    disabled={saving || form.assignedToIds.length === 0}
                  >
                    <Send size={14} className="mr-1" /> Publicar y asignar
                  </Button>
                </div>
                {form.assignedToIds.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Asigná al menos un usuario para publicar.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Nav */}
        {step < 4 && (
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="ghost"
              onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
            >
              <ChevronLeft size={14} className="mr-1" />{" "}
              {step === 0 ? "Cancelar" : "Atrás"}
            </Button>
            {errors[step] && (
              <span className="text-xs text-destructive">{errors[step]}</span>
            )}
            <Button
              className="gradient-primary text-primary-foreground"
              disabled={!canNext}
              onClick={() => setStep(step + 1)}
            >
              Siguiente <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
